import { config } from "dotenv";
config({ path: "../../.env" });

import { REST, Routes } from "discord.js";
import { readdir } from "fs/promises";
import { join } from "path";

async function deploy() {
  const commands = [];
  const commandsPath = join(import.meta.dir, "..", "commands");
  const categories = await readdir(commandsPath);

  for (const category of categories) {
    const categoryPath = join(commandsPath, category);
    const files = await readdir(categoryPath);

    for (const file of files.filter((f) => f.endsWith(".ts"))) {
      const command = await import(join(categoryPath, file));
      if ("data" in command) {
        commands.push(command.data.toJSON());
      }
    }
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  console.log(`Deploying ${commands.length} commands...`);
  await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID!),
    { body: commands }
  );
  console.log("Commands deployed successfully!");
}

deploy().catch(console.error);
