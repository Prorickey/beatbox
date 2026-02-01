# Beatbox

A Discord music bot with a real-time web dashboard. Play music from YouTube, Spotify, SoundCloud, and more — controlled from Discord slash commands or a browser.

## Features

- **Multi-source playback** — YouTube, Spotify (tracks/albums/playlists), SoundCloud, Bandcamp, Twitch, and direct URLs via Lavalink
- **Web dashboard** — Real-time player controls, queue management, and settings synced with Discord via Socket.io
- **Playlists** — Save, load, and manage playlists from both Discord commands and the dashboard
- **Listening stats** — Per-server stats: top tracks, top listeners, session history, and 24-hour activity
- **Guild settings** — Configurable repeat mode, autoplay, queue limits, and duplicate handling per server
- **Auto-join** — Bot automatically joins your voice channel when you open the dashboard
- **Idle disconnect** — Pauses and disconnects after 5 minutes when the voice channel empties
- **Spotify integration** — Paste Spotify links and the bot resolves them via YouTube for playback
- **Rich presence** — Bot status rotates between currently playing tracks and idle messages

## Architecture

```
beatbox/
  apps/
    bot/          Discord bot (Bun + Discord.js + Kazagumo/Shoukaku + Socket.io server)
    dashboard/    Web dashboard (Next.js 15 + Tailwind + shadcn/ui + Socket.io client)
  packages/
    database/     Shared Prisma schema and client (PostgreSQL)
    shared/       Shared types, Socket.io events, constants, and utilities
```

## Prerequisites

- [Bun](https://bun.sh) (package manager and runtime)
- [PostgreSQL](https://www.postgresql.org/) 16+
- [Lavalink](https://github.com/lavalink-devs/Lavalink) 4.x
- A [Discord application](https://discord.com/developers/applications) with bot token

Or use Docker Compose for PostgreSQL and Lavalink:

```bash
docker compose up -d
```

## Setup

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Configure environment**

   ```bash
   cp .env.example .env
   ```

   Fill in the required variables:

   | Variable | Description |
   |----------|-------------|
   | `DISCORD_TOKEN` | Bot token |
   | `DISCORD_CLIENT_ID` | OAuth2 client ID |
   | `DISCORD_CLIENT_SECRET` | OAuth2 client secret |
   | `LAVALINK_HOST` | Lavalink server host (default: `localhost`) |
   | `LAVALINK_PORT` | Lavalink server port (default: `2333`) |
   | `LAVALINK_PASSWORD` | Lavalink password (default: `youshallnotpass`) |
   | `DATABASE_URL` | PostgreSQL connection string |
   | `NEXTAUTH_URL` | Dashboard URL (default: `http://localhost:3000`) |
   | `NEXTAUTH_SECRET` | Random secret for NextAuth sessions |
   | `SOCKET_PORT` | Bot Socket.io port (default: `3001`) |
   | `NEXT_PUBLIC_SOCKET_URL` | Socket.io URL for the dashboard |
   | `SPOTIFY_CLIENT_ID` | *(Optional)* Spotify API client ID |
   | `SPOTIFY_CLIENT_SECRET` | *(Optional)* Spotify API client secret |

3. **Set up the database**

   ```bash
   bun run db:push
   bun run db:generate
   ```

4. **Register Discord slash commands**

   ```bash
   cd apps/bot && bun run deploy-commands
   ```

5. **Start development**

   ```bash
   bun run dev
   ```

   Or run individually:

   ```bash
   bun run --filter @beatbox/bot dev        # Bot only
   bun run --filter @beatbox/dashboard dev   # Dashboard only
   ```

## Commands

### Music

| Command | Description |
|---------|-------------|
| `/play <query>` | Play a song or add it to the queue |
| `/skip` | Skip the current track |
| `/pause` | Pause or resume playback |
| `/stop` | Stop playback and clear the queue |
| `/queue` | View the current queue |
| `/nowplaying` | Show the currently playing track |
| `/volume <level>` | Set the playback volume |
| `/seek <position>` | Seek to a position in the current track |
| `/shuffle` | Shuffle the queue |
| `/repeat <mode>` | Set repeat mode (off, track, queue) |
| `/playlist` | Manage saved playlists |
| `/stats` | View listening statistics |

### Utility

| Command | Description |
|---------|-------------|
| `/help` | Show all available commands |
| `/feedback <message>` | Send feedback to the developers |

## License

[MIT](LICENSE)
