import { readdir } from "fs/promises";
import { join } from "path";
import type { BeatboxClient } from "../structures/Client";

export async function loadEvents(client: BeatboxClient) {
  const eventsPath = join(import.meta.dir, "..", "events");
  const files = await readdir(eventsPath);
  const eventFiles = files.filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of eventFiles) {
    const event = await import(join(eventsPath, file));
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
    console.log(`Loaded event: ${event.name}`);
  }

  // Kazagumo events
  client.kazagumo.shoukaku.on("ready", (name) =>
    console.log(`Lavalink node ${name} connected`)
  );
  client.kazagumo.shoukaku.on("error", (name, error) =>
    console.error(`Lavalink node ${name} error:`, error)
  );
}
