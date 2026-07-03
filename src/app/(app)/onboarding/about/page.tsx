"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { composeDescriptions } from "@/lib/wizard/descriptions";
import { Wand2 } from "lucide-react";

const PROMPTS: Array<{
  key: keyof import("@/lib/wizard/state").WizardState["about"];
  label: string;
  required?: boolean;
}> = [
  { key: "vision", label: "What is your business's vision/mission?", required: true },
  { key: "offerings", label: "What services or products do you offer?", required: true },
  { key: "usp", label: "What makes your business unique? (USP)", required: true },
  { key: "idealCustomer", label: "Who is your ideal customer?", required: true },
  { key: "competitorEdge", label: "What sets you apart from competitors?", required: true },
  { key: "benefits", label: "What benefits do customers gain from choosing you?", required: true },
  { key: "cta", label: "What action do you want readers to take after reading your description?", required: true },
  { key: "competitors", label: "Specific competitors to differentiate from? (optional)" },
  { key: "marketingBudget", label: "Current marketing & budget? (optional, partner record only)" },
  { key: "marketingPainPoints", label: "Pain points with your current marketing? (optional, partner record only)" },
];

export default function AboutStep() {
  const { state, patch, goNext, mode } = useWizard();
  const a = state.about;
  const d = state.descriptions;

  const requiredKeys = PROMPTS.filter((p) => p.required).map((p) => p.key);
  const valid = requiredKeys.every((k) => (a[k] ?? "").toString().trim()) && d.birdeye.trim();

  const compose = () => {
    const next = composeDescriptions(state.business, a);
    patch((s) => ({ ...s, descriptions: next }));
  };

  return (
    <StepShell
      stepKey="about"
      title="About your business"
      blurb="Tell us your story so we can write your listing descriptions for Google, Apple, Facebook and your microsite. The more specific you are, the better the copy."
      onContinue={() => goNext("about")}
      continueDisabled={!valid}
    >
      <div className="grid gap-5">
        {PROMPTS.map((p) => (
          <Label key={String(p.key)} required={p.required}>
            {p.label}
            <Textarea
              value={(a[p.key] ?? "") as string}
              onChange={(e) =>
                patch((s) => ({ ...s, about: { ...s.about, [p.key]: e.target.value } }))
              }
            />
          </Label>
        ))}
      </div>

      <div className="mt-12 border-t border-line pt-10">
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
          <div>
            <h2 className="font-serif text-2xl text-teal">
              Description previews
              <span className="font-serif italic text-base text-plum ml-2">
                — auto-composed
              </span>
            </h2>
            <p className="text-sm text-ink-muted mt-1">
              {mode === "report"
                ? "Edit each one to taste — they go into your report as-is."
                : "Edit each one to taste — they go into the Birdeye payload as-is."}
            </p>
          </div>
          <Button variant="outline" onClick={compose}>
            <Wand2 className="h-4 w-4" />
            Auto-compose from answers
          </Button>
        </div>
        <div className="grid gap-4">
          <DescField
            label={mode === "report" ? "Full description" : "Birdeye / microsite (≤5000 chars)"}
            value={d.birdeye}
            max={5000}
            onChange={(v) =>
              patch((s) => ({ ...s, descriptions: { ...s.descriptions, birdeye: v } }))
            }
            required
          />
          <DescField
            label={mode === "report" ? "Short description (Google)" : "Google Business Profile (≤750 chars)"}
            value={d.google}
            max={750}
            onChange={(v) =>
              patch((s) => ({ ...s, descriptions: { ...s.descriptions, google: v } }))
            }
          />
          <DescField
            label={mode === "report" ? "One-liner (Facebook)" : "Facebook (≤255 chars)"}
            value={d.facebook}
            max={255}
            onChange={(v) =>
              patch((s) => ({ ...s, descriptions: { ...s.descriptions, facebook: v } }))
            }
          />
          <DescField
            label="Apple Business Connect (≤1000 chars)"
            value={d.apple}
            max={1000}
            onChange={(v) =>
              patch((s) => ({ ...s, descriptions: { ...s.descriptions, apple: v } }))
            }
          />
        </div>
      </div>
    </StepShell>
  );
}

function DescField({
  label,
  value,
  max,
  onChange,
  required,
}: {
  label: string;
  value: string;
  max: number;
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-sans text-sm font-medium text-teal">
          {label} {required ? <span className="text-plum">*</span> : null}
        </span>
        <span
          className={`font-sans text-xs ${value.length > max ? "text-plum" : "text-ink-muted"}`}
        >
          {value.length}/{max}
        </span>
      </div>
      <Textarea
        value={value}
        maxLength={max}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[6rem]"
      />
    </div>
  );
}
