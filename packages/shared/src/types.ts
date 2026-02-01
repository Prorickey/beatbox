export interface Track {
  id: string;
  title: string;
  author: string;
  duration: number;
  uri: string;
  artworkUrl: string | null;
  sourceName: string;
  requester: {
    id: string;
    username: string;
    avatar: string | null;
  };
}

export interface QueueTrack extends Track {
  addedAt: string;
  position: number;
}

export interface PlayerState {
  guildId: string;
  playing: boolean;
  paused: boolean;
  currentTrack: Track | null;
  position: number;
  volume: number;
  repeatMode: 'off' | 'track' | 'queue';
  queue: QueueTrack[];
}

export interface GuildInfo {
  id: string;
  name: string;
  iconUrl: string | null;
  memberCount: number;
}

export interface DashboardUser {
  id: string;
  username: string;
  avatar: string | null;
  guilds: GuildInfo[];
}
