import { SlashCommandBuilder, type ChatInputCommandInteraction } from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { errorEmbed, successEmbed } from "../../utils/embeds";
import { broadcastState } from "../../handlers/socketHandler";

export const data = new SlashCommandBuilder()
  .setName("filter")
  .setDescription("Apply audio filters to the player")
  .addSubcommand((sub) =>
    sub
      .setName("bassboost")
      .setDescription("Boost low-frequency EQ bands")
      .addStringOption((opt) =>
        opt
          .setName("level")
          .setDescription("Bassboost level")
          .setRequired(false)
          .addChoices(
            { name: "Light", value: "light" },
            { name: "Medium", value: "medium" },
            { name: "Heavy", value: "heavy" }
          )
      )
  )
  .addSubcommand((sub) =>
    sub
      .setName("nightcore")
      .setDescription("Speed up + pitch up (timescale speed: 1.3, pitch: 1.3)")
  )
  .addSubcommand((sub) =>
    sub
      .setName("vaporwave")
      .setDescription("Slow down + pitch down (timescale speed: 0.8, pitch: 0.8)")
  )
  .addSubcommand((sub) =>
    sub.setName("8d").setDescription("Rotating audio (rotation: 0.2Hz)")
  )
  .addSubcommand((sub) =>
    sub.setName("karaoke").setDescription("Karaoke filter (reduce vocals)")
  )
  .addSubcommand((sub) =>
    sub.setName("tremolo").setDescription("Tremolo effect (frequency: 2, depth: 0.5)")
  )
  .addSubcommand((sub) =>
    sub.setName("vibrato").setDescription("Vibrato effect (frequency: 2, depth: 0.5)")
  )
  .addSubcommand((sub) =>
    sub
      .setName("speed")
      .setDescription("Custom speed multiplier")
      .addNumberOption((opt) =>
        opt
          .setName("multiplier")
          .setDescription("Speed multiplier (0.5-2.0)")
          .setRequired(true)
          .setMinValue(0.5)
          .setMaxValue(2.0)
      )
  )
  .addSubcommand((sub) =>
    sub.setName("reset").setDescription("Remove all filters")
  );

export async function execute(
  interaction: ChatInputCommandInteraction,
  client: BeatboxClient
) {
  const member = interaction.guild?.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice.channel;

  if (!voiceChannel) {
    await interaction.reply({
      embeds: [errorEmbed("You need to be in a voice channel to use filters.")],
      ephemeral: true,
    });
    return;
  }

  const player = client.kazagumo.players.get(interaction.guildId!);
  if (!player) {
    await interaction.reply({
      embeds: [errorEmbed("No active player in this server.")],
      ephemeral: true,
    });
    return;
  }

  const sub = interaction.options.getSubcommand();

  try {
    switch (sub) {
      case "bassboost":
        await handleBassboost(interaction, player);
        break;
      case "nightcore":
        await handleNightcore(interaction, player);
        break;
      case "vaporwave":
        await handleVaporwave(interaction, player);
        break;
      case "8d":
        await handle8D(interaction, player);
        break;
      case "karaoke":
        await handleKaraoke(interaction, player);
        break;
      case "tremolo":
        await handleTremolo(interaction, player);
        break;
      case "vibrato":
        await handleVibrato(interaction, player);
        break;
      case "speed":
        await handleSpeed(interaction, player);
        break;
      case "reset":
        await handleReset(interaction, player);
        break;
    }

    broadcastState(client, interaction.guildId!);
  } catch (error) {
    console.error("Filter command error:", error);
    await interaction.reply({
      embeds: [errorEmbed("Failed to apply the filter.")],
      ephemeral: true,
    });
  }
}

async function handleBassboost(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  const level = interaction.options.getString("level") ?? "medium";

  // Current filters
  const currentFilters = player.shoukaku.filters || {};

  // Check if bassboost is already active
  const isActive = currentFilters.equalizer && currentFilters.equalizer.length > 0;

  if (isActive) {
    // Remove bassboost
    await player.shoukaku.setFilters({
      ...currentFilters,
      equalizer: [],
    });
    await interaction.reply({
      embeds: [successEmbed("Bassboost filter removed.")],
    });
  } else {
    // Apply bassboost with level
    const gains = {
      light: [0.15, 0.12, 0.1, 0.08, 0.05],
      medium: [0.25, 0.2, 0.15, 0.12, 0.08],
      heavy: [0.35, 0.3, 0.25, 0.2, 0.15],
    };

    const selectedGains = gains[level as keyof typeof gains];
    const equalizer = selectedGains.map((gain, index) => ({
      band: index,
      gain,
    }));

    await player.shoukaku.setFilters({
      ...currentFilters,
      equalizer,
    });

    await interaction.reply({
      embeds: [successEmbed(`Bassboost filter applied (${level}).`)],
    });
  }
}

async function handleNightcore(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  const currentFilters = player.shoukaku.filters || {};
  const isActive = currentFilters.timescale?.speed === 1.3;

  if (isActive) {
    // Remove nightcore
    const { timescale, ...rest } = currentFilters;
    await player.shoukaku.setFilters(rest);
    await interaction.reply({
      embeds: [successEmbed("Nightcore filter removed.")],
    });
  } else {
    // Apply nightcore
    await player.shoukaku.setFilters({
      ...currentFilters,
      timescale: { speed: 1.3, pitch: 1.3, rate: 1.3 },
    });
    await interaction.reply({
      embeds: [successEmbed("Nightcore filter applied.")],
    });
  }
}

async function handleVaporwave(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  const currentFilters = player.shoukaku.filters || {};
  const isActive = currentFilters.timescale?.speed === 0.8;

  if (isActive) {
    // Remove vaporwave
    const { timescale, ...rest } = currentFilters;
    await player.shoukaku.setFilters(rest);
    await interaction.reply({
      embeds: [successEmbed("Vaporwave filter removed.")],
    });
  } else {
    // Apply vaporwave
    await player.shoukaku.setFilters({
      ...currentFilters,
      timescale: { speed: 0.8, pitch: 0.8, rate: 0.8 },
    });
    await interaction.reply({
      embeds: [successEmbed("Vaporwave filter applied.")],
    });
  }
}

async function handle8D(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  const currentFilters = player.shoukaku.filters || {};
  const isActive = currentFilters.rotation?.rotationHz !== undefined;

  if (isActive) {
    // Remove 8D
    const { rotation, ...rest } = currentFilters;
    await player.shoukaku.setFilters(rest);
    await interaction.reply({
      embeds: [successEmbed("8D filter removed.")],
    });
  } else {
    // Apply 8D
    await player.shoukaku.setFilters({
      ...currentFilters,
      rotation: { rotationHz: 0.2 },
    });
    await interaction.reply({
      embeds: [successEmbed("8D filter applied.")],
    });
  }
}

async function handleKaraoke(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  const currentFilters = player.shoukaku.filters || {};
  const isActive = currentFilters.karaoke !== undefined;

  if (isActive) {
    // Remove karaoke
    const { karaoke, ...rest } = currentFilters;
    await player.shoukaku.setFilters(rest);
    await interaction.reply({
      embeds: [successEmbed("Karaoke filter removed.")],
    });
  } else {
    // Apply karaoke
    await player.shoukaku.setFilters({
      ...currentFilters,
      karaoke: {
        level: 1.0,
        monoLevel: 1.0,
        filterBand: 220.0,
        filterWidth: 100.0,
      },
    });
    await interaction.reply({
      embeds: [successEmbed("Karaoke filter applied.")],
    });
  }
}

async function handleTremolo(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  const currentFilters = player.shoukaku.filters || {};
  const isActive = currentFilters.tremolo !== undefined;

  if (isActive) {
    // Remove tremolo
    const { tremolo, ...rest } = currentFilters;
    await player.shoukaku.setFilters(rest);
    await interaction.reply({
      embeds: [successEmbed("Tremolo filter removed.")],
    });
  } else {
    // Apply tremolo
    await player.shoukaku.setFilters({
      ...currentFilters,
      tremolo: { frequency: 2.0, depth: 0.5 },
    });
    await interaction.reply({
      embeds: [successEmbed("Tremolo filter applied.")],
    });
  }
}

async function handleVibrato(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  const currentFilters = player.shoukaku.filters || {};
  const isActive = currentFilters.vibrato !== undefined;

  if (isActive) {
    // Remove vibrato
    const { vibrato, ...rest } = currentFilters;
    await player.shoukaku.setFilters(rest);
    await interaction.reply({
      embeds: [successEmbed("Vibrato filter removed.")],
    });
  } else {
    // Apply vibrato
    await player.shoukaku.setFilters({
      ...currentFilters,
      vibrato: { frequency: 2.0, depth: 0.5 },
    });
    await interaction.reply({
      embeds: [successEmbed("Vibrato filter applied.")],
    });
  }
}

async function handleSpeed(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  const multiplier = interaction.options.getNumber("multiplier", true);
  const currentFilters = player.shoukaku.filters || {};

  // Apply speed
  await player.shoukaku.setFilters({
    ...currentFilters,
    timescale: { speed: multiplier, pitch: 1.0, rate: 1.0 },
  });

  await interaction.reply({
    embeds: [successEmbed(`Speed filter applied (${multiplier}x).`)],
  });
}

async function handleReset(
  interaction: ChatInputCommandInteraction,
  player: any
) {
  // Remove all filters
  await player.shoukaku.setFilters({});

  await interaction.reply({
    embeds: [successEmbed("All filters removed.")],
  });
}
