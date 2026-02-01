interface SpotifyTrack {
  name: string;
  artists: string[];
  durationMs: number;
  albumArt: string | null;
}

interface SpotifyTokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: SpotifyTokenCache | null = null;

const SPOTIFY_URL_REGEX =
  /https?:\/\/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/;

export function parseSpotifyUrl(
  url: string
): { type: "track" | "album" | "playlist"; id: string } | null {
  const match = url.match(SPOTIFY_URL_REGEX);
  if (!match) return null;
  return { type: match[1] as "track" | "album" | "playlist", id: match[2] };
}

export function isSpotifyUrl(url: string): boolean {
  return SPOTIFY_URL_REGEX.test(url);
}

export function isSpotifyConfigured(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set in .env"
    );
  }

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify auth failed: ${res.status}`);
  }

  const data = await res.json();
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000, // refresh 60s early
  };

  return tokenCache.token;
}

async function spotifyFetch(endpoint: string): Promise<any> {
  const token = await getAccessToken();
  const res = await fetch(`https://api.spotify.com/v1${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Spotify API error: ${res.status} on ${endpoint}`);
  }

  return res.json();
}

function extractTrack(item: any): SpotifyTrack {
  return {
    name: item.name,
    artists: item.artists.map((a: any) => a.name),
    durationMs: item.duration_ms,
    albumArt: item.album?.images?.[0]?.url ?? null,
  };
}

export async function getSpotifyTracks(
  type: "track" | "album" | "playlist",
  id: string
): Promise<{ name: string; tracks: SpotifyTrack[]; artworkUrl: string | null }> {
  if (type === "track") {
    const data = await spotifyFetch(`/tracks/${id}`);
    const track = extractTrack(data);
    return {
      name: track.name,
      tracks: [track],
      artworkUrl: data.album?.images?.[0]?.url ?? null,
    };
  }

  if (type === "album") {
    const data = await spotifyFetch(`/albums/${id}`);
    const artworkUrl = data.images?.[0]?.url ?? null;

    // Album tracks don't include album info, so we add artwork from album level
    const tracks: SpotifyTrack[] = data.tracks.items.map((item: any) => ({
      name: item.name,
      artists: item.artists.map((a: any) => a.name),
      durationMs: item.duration_ms,
      albumArt: artworkUrl,
    }));

    // Handle pagination for large albums
    let next = data.tracks.next;
    while (next) {
      const token = await getAccessToken();
      const res = await fetch(next, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const page = await res.json();
      for (const item of page.items) {
        tracks.push({
          name: item.name,
          artists: item.artists.map((a: any) => a.name),
          durationMs: item.duration_ms,
          albumArt: artworkUrl,
        });
      }
      next = page.next;
    }

    return { name: data.name, tracks, artworkUrl };
  }

  // Playlist
  const data = await spotifyFetch(`/playlists/${id}`);
  const artworkUrl = data.images?.[0]?.url ?? null;
  const tracks: SpotifyTrack[] = [];

  for (const item of data.tracks.items) {
    if (item.track) {
      tracks.push(extractTrack(item.track));
    }
  }

  // Handle pagination
  let next = data.tracks.next;
  while (next) {
    const token = await getAccessToken();
    const res = await fetch(next, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const page = await res.json();
    for (const item of page.items) {
      if (item.track) {
        tracks.push(extractTrack(item.track));
      }
    }
    next = page.next;
  }

  return { name: data.name, tracks, artworkUrl };
}

/**
 * Build a YouTube search query from Spotify track metadata.
 * Includes artist name for accuracy.
 */
export function buildSearchQuery(track: SpotifyTrack): string {
  return `${track.artists[0]} - ${track.name}`;
}
