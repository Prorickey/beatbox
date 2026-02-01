import { GuildSelector } from "@/components/guild-selector";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-6 py-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
      <GuildSelector />
    </div>
  );
}
