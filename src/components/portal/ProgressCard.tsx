import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SectionLabel,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle } from "lucide-react";
import type { StepDef } from "@/lib/wizard/state";

export function ProgressCard({
  steps,
  completed,
  resumeHref,
  totalSteps,
}: {
  steps: StepDef[];
  completed: Record<string, boolean>;
  resumeHref: string;
  totalSteps: number;
}) {
  const done = steps.filter((s) => s.key !== "review" && completed[s.key]).length;
  const denom = Math.max(1, totalSteps - 1);
  const pct = Math.round((done / denom) * 100);
  return (
    <Card>
      <CardHeader>
        <SectionLabel>Your onboarding</SectionLabel>
        <div className="mt-3 flex items-baseline justify-between gap-3">
          <CardTitle className="font-serif text-3xl">
            {pct === 100 ? "All set." : "A few quick steps."}
          </CardTitle>
          <span className="font-sans text-sm text-ink-muted">
            {pct}% · {done} of {denom}
          </span>
        </div>
        <div className="mt-5 h-1.5 rounded-full bg-line/60 overflow-hidden">
          <div
            className="h-full bg-teal transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mb-6">
          {steps
            .filter((s) => s.key !== "review")
            .map((s) => (
              <li
                key={s.key}
                className="flex items-center gap-2 text-sm font-sans"
              >
                {completed[s.key] ? (
                  <CheckCircle2 className="h-4 w-4 text-teal flex-shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-ink-muted/50 flex-shrink-0" />
                )}
                <span
                  className={
                    completed[s.key]
                      ? "text-ink-muted/60 line-through"
                      : "text-ink"
                  }
                >
                  {s.title}
                </span>
              </li>
            ))}
        </ul>
        <Link href={resumeHref}>
          <Button size="lg">
            {done === 0 ? "Start onboarding →" : "Continue onboarding →"}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
