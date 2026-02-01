import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, nowPlayingEmbed, playerButtons } from "../../utils/embeds";

export const data = new SlashCommandBuilder()
  .setName("nowplaying")
  .setDescription("Show the currently playing track");

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const player = client.kazagumo.players.get(interaction.guildId!);
  if (!player?.queue.current) {
    await interaction.reply({
      embeds: [errorEmbed("Nothing is playing right now.")],
      ephemeral: true,
    });
    return;
  }

  const current = player.queue.current;
  const track = {
    id: current.identifier,
    title: current.title,
    author: current.author,
    duration: current.length ?? 0,
    uri: current.uri ?? "",
    artworkUrl: current.thumbnail ?? null,
    sourceName: current.sourceName ?? "unknown",
    requester: current.requester as any,
  };

  await interaction.reply({
    embeds: [nowPlayingEmbed(track, player.position, player.volume, (player.loop as any) ?? "off")],
    components: [playerButtons(player.paused)],
  });
}
