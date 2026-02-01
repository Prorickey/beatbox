import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { EmbedBuilder } from "discord.js";
import { EMBED_COLORS, formatDuration, truncate } from "@beatbox/shared";
import { errorEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";
import { applyGuildSettings } from "../../utils/guildSettings";
import {
  isSpotifyUrl,
  isSpotifyConfigured,
  parseSpotifyUrl,
  getSpotifyTracks,
  buildSearchQuery,
} from "../../utils/spotify";

function playingNextEmbed(track: any, position: number) {
  return new EmbedBuilder()
    .setColor(EMBED_COLORS.SUCCESS)
    .setAuthor({ name: "Playing Next ✅" })
    .setTitle(truncate(track.title, 60))
    .setURL(track.uri)
    .setDescription(
      `by **${track.author}** — ${formatDuration(track.duration)}`
    )
    .setThumbnail(track.artworkUrl)
    .setFooter({ text: `Will play after current track` });
}

export const data = new SlashCommandBuilder()
  .setName("playtop")
  .setDescription("Play a song next (adds to front of queue)")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Song name, URL, or Spotify link")
      .setRequired(true)
      .setAutocomplete(false)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in a voice channel to play music.")],
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();
  const query = interaction.options.getString("query", true);

  // Cancel any pending disconnect timer
  const disconnectTimer = client.disconnectTimers.get(interaction.guildId!);
  if (disconnectTimer) {
    clearTimeout(disconnectTimer);
    client.disconnectTimers.delete(interaction.guildId!);
    console.log(`[playtop] Cancelled disconnect timer for guild ${interaction.guildId}`);
  }

  let player = client.kazagumo.players.get(interaction.guildId!);
  if (!player) {
    player = await client.kazagumo.createPlayer({
      guildId: interaction.guildId!,
      textId: interaction.channelId,
      voiceId: voiceChannel.id,
      volume: 80,
    });
    await applyGuildSettings(player, interaction.guildId!);
  }

  try {
    // --- Spotify URL handling ---
    if (isSpotifyUrl(query) && !isSpotifyConfigured()) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            "Spotify links aren't configured yet. Ask the bot owner to add `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` to the environment."
          ),
        ],
      });
      return;
    }

    if (isSpotifyUrl(query)) {
      const parsed = parseSpotifyUrl(query);
      if (!parsed) {
        await interaction.editReply({
          embeds: [errorEmbed("Couldn't parse that Spotify link.")],
        });
        return;
      }

      console.log(`[playtop] Spotify ${parsed.type}: ${parsed.id}`);

      const spotify = await getSpotifyTracks(parsed.type, parsed.id);
      console.log(
        `[playtop] Fetched ${spotify.tracks.length} tracks from Spotify "${spotify.name}"`
      );

      if (spotify.tracks.length === 0) {
        await interaction.editReply({
          embeds: [errorEmbed("No tracks found in that Spotify link.")],
        });
        return;
      }

      // Reply early so the user knows it's working
      await interaction.editReply({
        embeds: [
          playingNextEmbed(
            {
              id: parsed.id,
              title: spotify.name,
              author: `${spotify.tracks.length} tracks from Spotify`,
              duration: spotify.tracks.reduce((a, t) => a + t.durationMs, 0),
              uri: query,
              artworkUrl: spotify.artworkUrl,
              sourceName: "spotify",
              requester: {
                id: interaction.user.id,
                username: interaction.user.username,
                avatar: interaction.user.displayAvatarURL(),
              },
            },
            1
          ),
        ],
      });

      // Search YouTube for each track and add to queue at front (maintaining order)
      let added = 0;
      for (let i = 0; i < spotify.tracks.length; i++) {
        const spotifyTrack = spotify.tracks[i];
        const searchQuery = buildSearchQuery(spotifyTrack);
        try {
          const result = await client.kazagumo.search(searchQuery, {
            requester: {
              id: interaction.user.id,
              username: interaction.user.username,
              avatar: interaction.user.displayAvatarURL(),
            },
          });

          if (result.tracks.length > 0) {
            // Add at position i to maintain order (0, 1, 2, ...)
            player.queue.add(result.tracks[0], i);
            added++;
            console.log(
              `[playtop] Spotify -> YT: "${searchQuery}" -> "${result.tracks[0].title}" at position ${i}`
            );
          } else {
            console.warn(`[playtop] Spotify -> YT: no results for "${searchQuery}"`);
          }
        } catch (err) {
          console.warn(`[playtop] Spotify -> YT: search failed for "${searchQuery}":`, err);
        }
      }

      console.log(
        `[playtop] Added ${added}/${spotify.tracks.length} Spotify tracks to front of queue`
      );

      if (!player.playing && !player.paused) {
        player.play();
      }

      broadcastState(client, interaction.guildId!);
      return;
    }

    // --- Normal search/URL handling ---
    console.log(`[playtop] Searching for: "${query}"`);
    const result = await client.kazagumo.search(query, {
      requester: {
        id: interaction.user.id,
        username: interaction.user.username,
        avatar: interaction.user.displayAvatarURL(),
      },
    });
    console.log(`[playtop] Search result: type=${result.type}, tracks=${result.tracks.length}`);

    if (!result.tracks.length) {
      console.warn(`[playtop] No tracks found for query: "${query}" (type: ${result.type})`);
      await interaction.editReply({
        embeds: [errorEmbed("No results found for your search.")],
      });
      return;
    }

    console.log(`[playtop] First track: "${result.tracks[0].title}" by ${result.tracks[0].author} (${result.tracks[0].sourceName})`);

    if (result.type === "PLAYLIST") {
      // Add tracks at positions 0, 1, 2, ... to maintain playlist order at front
      for (let i = 0; i < result.tracks.length; i++) {
        player.queue.add(result.tracks[i], i);
      }
      await interaction.editReply({
        embeds: [
          playingNextEmbed(
            {
              id: result.tracks[0].identifier,
              title: result.playlistName ?? "Playlist",
              author: `${result.tracks.length} tracks`,
              duration: result.tracks.reduce((a, t) => a + (t.length ?? 0), 0),
              uri: query,
              artworkUrl: result.tracks[0].thumbnail ?? null,
              sourceName: result.tracks[0].sourceName ?? "unknown",
              requester: {
                id: interaction.user.id,
                username: interaction.user.username,
                avatar: interaction.user.displayAvatarURL(),
              },
            },
            1
          ),
        ],
      });
    } else {
      const track = result.tracks[0];
      // Add at position 0 (front of queue)
      player.queue.add(track, 0);

      if (player.queue.length === 1 && !player.queue.current) {
        // Queue was empty, this will start playing
      } else {
        await interaction.editReply({
          embeds: [
            playingNextEmbed(
              {
                id: track.identifier,
                title: track.title,
                author: track.author,
                duration: track.length ?? 0,
                uri: track.uri ?? "",
                artworkUrl: track.thumbnail ?? null,
                sourceName: track.sourceName ?? "unknown",
                requester: {
                  id: interaction.user.id,
                  username: interaction.user.username,
                  avatar: interaction.user.displayAvatarURL(),
                },
              },
              1
            ),
          ],
        });
      }
    }

    if (!player.playing && !player.paused) {
      player.play();
    }

    broadcastState(client, interaction.guildId!);
  } catch (error) {
    console.error("Playtop command error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to play the requested track.")],
    });
  }
}
