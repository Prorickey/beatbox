-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Guild" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "iconUrl" TEXT,
    "prefix" TEXT NOT NULL DEFAULT '!',
    "volume" INTEGER NOT NULL DEFAULT 80,
    "djRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guild_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuildSettings" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "announceNowPlaying" BOOLEAN NOT NULL DEFAULT true,
    "defaultRepeatMode" TEXT NOT NULL DEFAULT 'off',
    "maxQueueSize" INTEGER NOT NULL DEFAULT 100,
    "allowDuplicates" BOOLEAN NOT NULL DEFAULT true,
    "autoPlay" BOOLEAN NOT NULL DEFAULT true,
    "twentyFourSeven" BOOLEAN NOT NULL DEFAULT false,
    "requestChannelId" TEXT,
    "requestMessageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuildSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Playlist" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "guildId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaylistTrack" (
    "id" TEXT NOT NULL,
    "playlistId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "uri" TEXT NOT NULL,
    "artworkUrl" TEXT,
    "sourceName" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlaylistTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEngagement" (
    "id" TEXT NOT NULL,
    "interactionCount" INTEGER NOT NULL DEFAULT 0,
    "totalVoiceTime" INTEGER NOT NULL DEFAULT 0,
    "promoSent" BOOLEAN NOT NULL DEFAULT false,
    "promoSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "locale" TEXT NOT NULL DEFAULT 'en',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserGuildCache" (
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "guildName" TEXT NOT NULL,
    "guildIcon" TEXT,
    "botPresent" BOOLEAN NOT NULL DEFAULT false,
    "canManage" BOOLEAN NOT NULL DEFAULT false,
    "cachedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserGuildCache_pkey" PRIMARY KEY ("userId","guildId")
);

-- CreateTable
CREATE TABLE "TrackPlay" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "uri" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "playedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackPlay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ListeningSession" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "tracksPlayed" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "ListeningSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedQueue" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedQueueTrack" (
    "id" TEXT NOT NULL,
    "savedQueueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "uri" TEXT NOT NULL,
    "artworkUrl" TEXT,
    "sourceName" TEXT NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "SavedQueueTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LastQueue" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LastQueue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LastQueueTrack" (
    "id" TEXT NOT NULL,
    "lastQueueId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "uri" TEXT NOT NULL,
    "artworkUrl" TEXT,
    "sourceName" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "wasPlaying" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LastQueueTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GuildSettings_guildId_key" ON "GuildSettings"("guildId");

-- CreateIndex
CREATE INDEX "Playlist_userId_idx" ON "Playlist"("userId");

-- CreateIndex
CREATE INDEX "Playlist_guildId_idx" ON "Playlist"("guildId");

-- CreateIndex
CREATE INDEX "PlaylistTrack_playlistId_idx" ON "PlaylistTrack"("playlistId");

-- CreateIndex
CREATE INDEX "UserGuildCache_userId_idx" ON "UserGuildCache"("userId");

-- CreateIndex
CREATE INDEX "TrackPlay_guildId_idx" ON "TrackPlay"("guildId");

-- CreateIndex
CREATE INDEX "TrackPlay_guildId_userId_idx" ON "TrackPlay"("guildId", "userId");

-- CreateIndex
CREATE INDEX "TrackPlay_guildId_title_author_idx" ON "TrackPlay"("guildId", "title", "author");

-- CreateIndex
CREATE INDEX "ListeningSession_guildId_idx" ON "ListeningSession"("guildId");

-- CreateIndex
CREATE INDEX "Feedback_userId_idx" ON "Feedback"("userId");

-- CreateIndex
CREATE INDEX "Feedback_read_idx" ON "Feedback"("read");

-- CreateIndex
CREATE INDEX "SavedQueue_userId_guildId_idx" ON "SavedQueue"("userId", "guildId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedQueue_userId_guildId_name_key" ON "SavedQueue"("userId", "guildId", "name");

-- CreateIndex
CREATE INDEX "SavedQueueTrack_savedQueueId_idx" ON "SavedQueueTrack"("savedQueueId");

-- CreateIndex
CREATE UNIQUE INDEX "LastQueue_guildId_key" ON "LastQueue"("guildId");

-- CreateIndex
CREATE INDEX "LastQueueTrack_lastQueueId_idx" ON "LastQueueTrack"("lastQueueId");

-- AddForeignKey
ALTER TABLE "GuildSettings" ADD CONSTRAINT "GuildSettings_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playlist" ADD CONSTRAINT "Playlist_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "Guild"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaylistTrack" ADD CONSTRAINT "PlaylistTrack_playlistId_fkey" FOREIGN KEY ("playlistId") REFERENCES "Playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedQueueTrack" ADD CONSTRAINT "SavedQueueTrack_savedQueueId_fkey" FOREIGN KEY ("savedQueueId") REFERENCES "SavedQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LastQueueTrack" ADD CONSTRAINT "LastQueueTrack_lastQueueId_fkey" FOREIGN KEY ("lastQueueId") REFERENCES "LastQueue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
