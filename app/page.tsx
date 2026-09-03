import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";

const features = [
  {
    icon: BookOpen,
    title: "Log every trade",
    body: "Capture entries, exits, and notes while it's still fresh.",
  },
  {
    icon: BarChart3,
    title: "See your edge",
    body: "Win rate, R:R, and P&L trends at a glance.",
  },
  {
    icon: Target,
    title: "Learn faster",
    body: "Review what worked and what didn't — no more guessing.",
  },
];

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
          Your trades. <span className="text-primary">Reviewed.</span>
        </h1>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          A simple journal for tracking positions, spotting patterns, and
          getting better at trading.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href={routes.login}>
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href={routes.dashboard}>See the dashboard</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24 grid gap-4 sm:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-lg border border-border bg-card p-5"
            >
              <Icon className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-medium">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
            </div>
          );
        })}
      </section>
    </main>
  );
}
