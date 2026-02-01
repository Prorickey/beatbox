import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { EMBED_COLORS } from "@beatbox/shared";
import { readdir } from "fs/promises";
import { join } from "path";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("List all available commands");

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  try {
    const commandsRoot = join(import.meta.dir, "..");
    const categories = await readdir(commandsRoot);

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setTitle("Beatbox Commands");

    for (const category of categories.sort()) {
      const categoryPath = join(commandsRoot, category);

      let files: string[];
      try {
        files = await readdir(categoryPath);
      } catch {
        // Skip non-directory entries
        continue;
      }

      const commandFiles = files.filter(
        (f) => f.endsWith(".ts") || f.endsWith(".js")
      );

      const lines: string[] = [];
      for (const file of commandFiles.sort()) {
        const commandName = file.replace(/\.(ts|js)$/, "");
        const command = client.commands.get(commandName);
        if (command) {
          const description = command.data.description || "No description";
          lines.push(`\`/${commandName}\` — ${description}`);
        }
      }

      if (lines.length > 0) {
        const categoryName =
          category.charAt(0).toUpperCase() + category.slice(1);
        embed.addFields({
          name: categoryName,
          value: lines.join("\n"),
        });
      }
    }

    embed.setFooter({ text: "Visit the dashboard for more info" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  } catch (error) {
    console.error("[help] Error building help embed:", error);
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(EMBED_COLORS.ERROR)
          .setDescription("Failed to load command list."),
      ],
      ephemeral: true,
    });
  }
}
