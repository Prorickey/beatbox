import { config } from "dotenv";
config({ path: "../../.env" });

import { BeatboxClient } from "./structures/Client";

const client = new BeatboxClient();

client.start().catch((error) => {
  console.error("Failed to start Beatbox:", error);
  process.exit(1);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection:", error);
});
