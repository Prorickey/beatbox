"use client";

import { signIn } from "next-auth/react";
import { Music } from "lucide-react";

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

export default function SignInPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px]" />
        </div>
        <div className="absolute bottom-0 left-0 translate-y-1/2">
          <div className="h-[400px] w-[400px] rounded-full bg-[#5865F2]/10 blur-[100px]" />
        </div>
        <div className="absolute bottom-0 right-0 translate-y-1/3">
          <div className="h-[300px] w-[300px] rounded-full bg-primary/5 blur-[80px]" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Logo and branding */}
        <div className="mb-10 flex flex-col items-center">
          <div className="relative mb-5">
            <div className="absolute -inset-3 rounded-full bg-primary/20 blur-lg" />
            <Music className="relative h-14 w-14 text-primary" />
          </div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              Beatbox
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Sign-in card */}
        <div className="rounded-2xl border border-border/50 bg-card/80 p-8 shadow-xl backdrop-blur-sm">
          <h2 className="mb-2 text-center text-lg font-semibold text-card-foreground">
            Welcome back
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Connect your Discord account to get started
          </p>

          <button
            onClick={() => signIn("discord", { callbackUrl: "/dashboard" })}
            className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-6 py-3.5 text-[15px] font-medium text-white transition-all hover:bg-[#4752C4] hover:shadow-lg hover:shadow-[#5865F2]/25 active:scale-[0.98]"
          >
            <DiscordIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            Continue with Discord
          </button>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">secured by OAuth2</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground/70">
            We only request access to your identity and server list.
            <br />
            We never post on your behalf.
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground/50">
          By signing in, you agree to let Beatbox read your server list.
        </p>
      </div>
    </main>
  );
}
