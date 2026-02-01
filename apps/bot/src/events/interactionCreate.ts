import {
  Events,
  type Interaction,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { BeatboxClient } from "../structures/Client";
import { errorEmbed } from "../utils/embeds";
import { handleButton } from "../handlers/buttonHandler";

export const name = Events.InteractionCreate;
export const once = false;

export async function execute(interaction: Interaction, client: BeatboxClient) {
  if (interaction.isChatInputCommand()) {
    await handleCommand(interaction, client);
  } else if (interaction.isButton()) {
    await handleButton(interaction, client);
  }
}

async function handleCommand(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    const reply = {
      embeds: [errorEmbed("Something went wrong executing that command.")],
      ephemeral: true,
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}
