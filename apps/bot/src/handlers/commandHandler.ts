import { readdir } from "fs/promises";
import { join } from "path";
import type { BeatboxClient } from "../structures/Client";

export async function loadCommands(client: BeatboxClient) {
  const commandsPath = join(import.meta.dir, "..", "commands");
  const categories = await readdir(commandsPath);

  for (const category of categories) {
    const categoryPath = join(commandsPath, category);
    const files = await readdir(categoryPath);
    const commandFiles = files.filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

    for (const file of commandFiles) {
      const command = await import(join(categoryPath, file));
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
      }
    }
  }
}
