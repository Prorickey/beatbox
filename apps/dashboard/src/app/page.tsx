"use client";

import Link from "next/link";
import { Music, Headphones, Radio, LayoutDashboard } from "lucide-react";
import { useSession } from "next-auth/react";

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z" />
    </svg>
  );
}

function Starfield() {
  // Deterministic star positions using a simple seed approach
  const stars = Array.from({ length: 120 }, (_, i) => ({
    id: i,
    left: `${((i * 37 + 13) % 100)}%`,
    top: `${((i * 53 + 7) % 100)}%`,
    size: (i % 4 === 0) ? 3 : (i % 3 === 0) ? 2 : 1.5,
    opacity: 0.3 + (i % 5) * 0.12,
    duration: 20 + (i % 7) * 5,
    delay: (i % 11) * -2,
  }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full bg-white"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            opacity: s.opacity,
            animation: `starFloat ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes starFloat {
          0%, 100% { transform: translateY(0) translateX(0); opacity: var(--tw-opacity, 0.2); }
          25% { transform: translateY(-8px) translateX(4px); opacity: calc(var(--tw-opacity, 0.2) + 0.1); }
          50% { transform: translateY(-3px) translateX(-3px); opacity: var(--tw-opacity, 0.2); }
          75% { transform: translateY(5px) translateX(2px); opacity: calc(var(--tw-opacity, 0.2) - 0.05); }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const { data: session, status } = useSession();
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-t from-primary/[0.06] via-background to-background">
      {/* Starfield */}
      <Starfield />

      {/* Background glow effects — brighter from bottom like stage lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[#5865F2]/[0.07] via-primary/[0.03] to-transparent" />
        <div className="absolute left-1/4 top-0 -translate-y-1/3">
          <div className="h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px]" />
        </div>
        <div className="absolute bottom-0 left-1/3 translate-y-1/4">
          <div className="h-[600px] w-[600px] rounded-full bg-primary/10 blur-[140px]" />
        </div>
        <div className="absolute bottom-0 right-1/4 translate-y-1/4">
          <div className="h-[500px] w-[500px] rounded-full bg-[#5865F2]/12 blur-[120px]" />
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="absolute -inset-5 rounded-full bg-primary/20 blur-2xl" />
            <Music className="relative h-20 w-20 text-primary drop-shadow-[0_0_15px_rgba(124,58,237,0.4)]" />
          </div>
        </div>

        <h1 className="mb-4 text-6xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-primary via-purple-400 to-[#5865F2] bg-clip-text text-transparent">
            Beatbox
          </span>
        </h1>
        <p className="mx-auto mb-14 max-w-lg text-lg text-muted-foreground">
          Your premium Discord music experience, controlled from anywhere.
        </p>

        <div className="mb-14 grid gap-5 sm:grid-cols-3">
          <FeatureCard
            icon={<Headphones className="h-7 w-7" />}
            title="Crystal Clear Audio"
            description="High-quality playback from YouTube, Spotify, SoundCloud, and more."
          />
          <FeatureCard
            icon={<Radio className="h-7 w-7" />}
            title="Real-time Control"
            description="Control playback, manage queues, and adjust settings live."
          />
          <FeatureCard
            icon={<LayoutDashboard className="h-7 w-7" />}
            title="Web Dashboard"
            description="Full control from your browser with a beautiful interface."
          />
        </div>

        {session ? (
          <Link
            href="/dashboard"
            className="group inline-flex items-center gap-3 rounded-xl bg-[#5865F2] px-8 py-4 text-lg font-medium text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752C4] hover:shadow-xl hover:shadow-[#5865F2]/30 active:scale-[0.98]"
          >
            <LayoutDashboard className="h-6 w-6 transition-transform group-hover:scale-110" />
            Dashboard
          </Link>
        ) : (
          <Link
            href="/signin"
            className="group inline-flex items-center gap-3 rounded-xl bg-[#5865F2] px-8 py-4 text-lg font-medium text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752C4] hover:shadow-xl hover:shadow-[#5865F2]/30 active:scale-[0.98]"
          >
            <DiscordIcon className="h-6 w-6 transition-transform group-hover:scale-110" />
            Sign in with Discord
          </Link>
        )}
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
    <div className="group rounded-2xl border border-border/50 bg-card/50 p-6 text-left backdrop-blur-sm transition-all hover:border-primary/20 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1">
      <div className="mb-3 text-primary">{icon}</div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
