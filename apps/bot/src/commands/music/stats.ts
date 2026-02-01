import {
  SlashCommandBuilder,
  EmbedBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import type { BeatboxClient } from "../../structures/Client";
import { prisma } from "@beatbox/database";
import { EMBED_COLORS, formatDuration, truncate } from "@beatbox/shared";
import { errorEmbed } from "../../utils/embeds";

export const data = new SlashCommandBuilder()
  .setName("stats")
  .setDescription("View fun listening stats for this server");

export async function execute(
  interaction: ChatInputCommandInteraction,
  _client: BeatboxClient
) {
  const guildId = interaction.guildId!;

  await interaction.deferReply();

  try {
    const [
      totalPlays,
      totalListeningMs,
      topTrackResult,
      topUserResult,
      sessionCount,
      completedSessions,
      recentPlays,
      uniqueTracks,
      uniqueListeners,
    ] = await Promise.all([
      // Total tracks played
      prisma.trackPlay.count({ where: { guildId } }),

      // Total listening time (sum of track durations)
      prisma.trackPlay.aggregate({
        where: { guildId },
        _sum: { duration: true },
      }),

      // Most played track
      prisma.$queryRaw<{ title: string; author: string; count: bigint }[]>`
        SELECT title, author, COUNT(*) as count
        FROM "TrackPlay"
        WHERE "guildId" = ${guildId}
        GROUP BY title, author
        ORDER BY count DESC
        LIMIT 1
      `,

      // Top user by plays
      prisma.$queryRaw<{ userId: string; username: string; count: bigint }[]>`
        SELECT "userId", username, COUNT(*) as count
        FROM "TrackPlay"
        WHERE "guildId" = ${guildId}
        GROUP BY "userId", username
        ORDER BY count DESC
        LIMIT 1
      `,

      // Total sessions
      prisma.listeningSession.count({ where: { guildId } }),

      // Completed sessions (with endedAt)
      prisma.listeningSession.findMany({
        where: { guildId, endedAt: { not: null } },
        select: { startedAt: true, endedAt: true, tracksPlayed: true },
      }),

      // Recent plays (last 24h)
      prisma.trackPlay.count({
        where: {
          guildId,
          playedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),

      // Unique tracks
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT (title, author)) as count
        FROM "TrackPlay"
        WHERE "guildId" = ${guildId}
      `,

      // Unique listeners
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT "userId") as count
        FROM "TrackPlay"
        WHERE "guildId" = ${guildId}
      `,
    ]);

    if (totalPlays === 0) {
      await interaction.editReply({
        embeds: [
          errorEmbed(
            "No listening data yet! Play some tracks to start building stats."
          ),
        ],
      });
      return;
    }

    const totalMs = totalListeningMs._sum.duration ?? 0;
    const totalMinutes = Math.floor(totalMs / 60000);
    const totalHours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;

    const topTrack = topTrackResult[0];
    const topUser = topUserResult[0];
    const uniqueTrackCount = Number(uniqueTracks[0]?.count ?? 0);
    const uniqueListenerCount = Number(uniqueListeners[0]?.count ?? 0);

    // Calculate average session length
    let avgSessionMinutes = 0;
    if (completedSessions.length > 0) {
      const totalSessionMs = completedSessions.reduce((sum, s) => {
        return sum + (s.endedAt!.getTime() - s.startedAt.getTime());
      }, 0);
      avgSessionMinutes = Math.floor(
        totalSessionMs / completedSessions.length / 60000
      );
    }

    const totalSessionTracks = completedSessions.reduce(
      (sum, s) => sum + s.tracksPlayed,
      0
    );
    const avgTracksPerSession =
      completedSessions.length > 0
        ? Math.round(totalSessionTracks / completedSessions.length)
        : 0;

    const embed = new EmbedBuilder()
      .setColor(EMBED_COLORS.PRIMARY)
      .setAuthor({ name: `${interaction.guild?.name ?? "Server"} Stats` })
      .setTitle("Listening Stats")
      .setDescription(
        `Here's what this server has been vibing to:`
      )
      .addFields(
        {
          name: "Most Played Track",
          value: topTrack
            ? `**${truncate(topTrack.title, 45)}**\nby ${topTrack.author} — played **${topTrack.count}x**`
            : "No data yet",
          inline: false,
        },
        {
          name: "Top Listener",
          value: topUser
            ? `<@${topUser.userId}> — **${topUser.count}** tracks requested`
            : "No data yet",
          inline: true,
        },
        {
          name: "Unique Listeners",
          value: `**${uniqueListenerCount}** users`,
          inline: true,
        },
        {
          name: "Total Listening Time",
          value:
            totalHours > 0
              ? `**${totalHours}h ${remainingMinutes}m**`
              : `**${totalMinutes}m**`,
          inline: true,
        },
        {
          name: "Tracks Played",
          value: `**${totalPlays}** total\n**${uniqueTrackCount}** unique`,
          inline: true,
        },
        {
          name: "Last 24 Hours",
          value: `**${recentPlays}** tracks played`,
          inline: true,
        },
        {
          name: "Sessions",
          value: [
            `**${sessionCount}** total sessions`,
            avgSessionMinutes > 0
              ? `~**${avgSessionMinutes}m** avg length`
              : null,
            avgTracksPerSession > 0
              ? `~**${avgTracksPerSession}** tracks/session`
              : null,
          ]
            .filter(Boolean)
            .join("\n"),
          inline: true,
        }
      )
      .setFooter({ text: "Stats are tracked per server" })
      .setTimestamp();

    if (interaction.guild?.iconURL()) {
      embed.setThumbnail(interaction.guild.iconURL()!);
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[stats] Error fetching stats:", error);
    await interaction.editReply({
      embeds: [errorEmbed("Failed to fetch server stats.")],
    });
  }
}
