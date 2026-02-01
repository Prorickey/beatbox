import Link from "next/link";
import { Music, Headphones, Radio, LayoutDashboard } from "lucide-react";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-background via-background to-primary/5">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 rounded-full bg-primary/20 blur-xl" />
            <Music className="relative h-20 w-20 text-primary" />
          </div>
        </div>

        <h1 className="mb-4 text-5xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Beatbox
          </span>
        </h1>
        <p className="mb-12 text-xl text-muted-foreground">
          Your premium Discord music experience, controlled from anywhere.
        </p>

        <div className="mb-12 grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon={<Headphones className="h-8 w-8" />}
            title="Crystal Clear Audio"
            description="High-quality playback from YouTube, Spotify, SoundCloud, and more."
          />
          <FeatureCard
            icon={<Radio className="h-8 w-8" />}
            title="Real-time Control"
            description="Control playback, manage queues, and adjust settings live."
          />
          <FeatureCard
            icon={<LayoutDashboard className="h-8 w-8" />}
            title="Web Dashboard"
            description="Full control from your browser with a beautiful interface."
          />
        </div>

        <Link
          href="/api/auth/signin"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Sign in with Discord
        </Link>
      </div>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-left transition-colors hover:bg-accent/50">
      <div className="mb-3 text-primary">{icon}</div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
