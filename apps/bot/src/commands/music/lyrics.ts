import { SlashCommandBuilder, type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed } from "../../utils/embeds";
import { EMBED_COLORS } from "@beatbox/shared";

interface LyricsApiResponse {
  lyrics: string;
}

export const data = new SlashCommandBuilder()
  .setName("lyrics")
  .setDescription("Get lyrics for the current track or search for a song")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Song to search for (defaults to current track)")
      .setRequired(false)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  await interaction.deferReply();

  const query = interaction.options.getString("query");
  let searchQuery: { artist: string; title: string };

  if (!query) {
    // Use currently playing track
    const player = client.kazagumo.players.get(interaction.guildId!);
    if (!player || !player.queue.current) {
      await interaction.editReply({
        embeds: [errorEmbed("No track is currently playing. Please provide a search query.")],
      });
      return;
    }

    const currentTrack = player.queue.current;
    searchQuery = {
      artist: currentTrack.author,
      title: currentTrack.title,
    };
  } else {
    // Parse the query - assume format "Artist - Title" or just use query as title
    const parts = query.split("-").map((p) => p.trim());
    if (parts.length >= 2) {
      searchQuery = {
        artist: parts[0],
        title: parts.slice(1).join("-").trim(),
      };
    } else {
      searchQuery = {
        artist: "",
        title: query,
      };
    }
  }

  try {
    let lyrics: string | null = null;

    // Try with artist and title first
    if (searchQuery.artist) {
      lyrics = await fetchLyrics(searchQuery.artist, searchQuery.title);
    }

    // Fallback: try with just title if artist search failed
    if (!lyrics) {
      lyrics = await fetchLyrics("", searchQuery.title);
    }

    if (!lyrics) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            `No lyrics found for "${searchQuery.artist ? `${searchQuery.artist} - ` : ""}${searchQuery.title}".`
          ),
        ],
      });
      return;
    }

    // Discord embed description limit is 4096 characters
    const maxLength = 4096;
    let displayLyrics = lyrics;
    let truncated = false;

    if (lyrics.length > maxLength) {
      displayLyrics = lyrics.substring(0, maxLength - 20) + "\n\n...";
      truncated = true;
    }

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setAuthor({ name: "Lyrics 🎵" })
      .setTitle(`${searchQuery.artist ? `${searchQuery.artist} - ` : ""}${searchQuery.title}`)
      .setDescription(displayLyrics);

    if (truncated) {
      embed.setFooter({ text: "Lyrics truncated due to length" });
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("Lyrics command error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to fetch lyrics. Please try again later.")],
    });
  }
}

async function fetchLyrics(artist: string, title: string): Promise<string | null> {
  try {
    const encodedArtist = encodeURIComponent(artist);
    const encodedTitle = encodeURIComponent(title);

    const url = artist
      ? `https://api.lyrics.ovh/v1/${encodedArtist}/${encodedTitle}`
      : `https://api.lyrics.ovh/v1/${encodedTitle}/${encodedTitle}`;

    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const data = await response.json() as LyricsApiResponse;
    return data.lyrics || null;
  } catch (error) {
    console.error("Error fetching lyrics:", error);
    return null;
  }
}
