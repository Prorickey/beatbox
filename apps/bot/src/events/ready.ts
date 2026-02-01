import { Events, ActivityType, type Client } from "discord.js";

export const name = Events.ClientReady;
export const once = true;

export async function execute(client: Client) {
  console.log(`Logged in as ${client.user?.tag}`);
  client.user?.setActivity("music 🎵", { type: ActivityType.Listening });
}
