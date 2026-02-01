import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { prisma } from "@beatbox/database";

export const data = new SlashCommandBuilder()
  .setName("deletequeue")
  .setDescription("Delete a saved queue")
  .addStringOption((option) =>
    option
      .setName("name")
      .setDescription("Name of the saved queue to delete")
      .setRequired(true)
      .setAutocomplete(false)
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  await interaction.deferReply();

  const name = interaction.options.getString("name", true);
  const userId = interaction.user.id;
  const guildId = interaction.guildId!;

  try {
    // Try to delete the saved queue
    const result = await prisma.savedQueue.deleteMany({
      where: {
        userId,
        guildId,
        name,
      },
    });

    if (result.count === 0) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            `No saved queue found with the name **${name}**. Use \`/savedqueues\` to see your saved queues.`
          ),
        ],
      });
      return;
    }

    await interaction.editReply({
      embeds: [successEmbed(`Deleted saved queue **${name}**.`)],
    });

    console.log(
      `[deletequeue] User ${userId} deleted queue "${name}" in guild ${guildId}`
    );
  } catch (error) {
    console.error("Delete queue error:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to delete the queue. Please try again.")],
    });
  }
}
