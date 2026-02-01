import { NowPlaying } from "@/components/now-playing";
import { QueueView } from "@/components/queue-view";
import { VolumeControl } from "@/components/volume-control";

export default async function GuildDashboard({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <NowPlaying guildId={guildId} />
          <VolumeControl guildId={guildId} />
        </div>
        <aside>
          <QueueView guildId={guildId} />
        </aside>
      </div>
    </div>
  );
}
