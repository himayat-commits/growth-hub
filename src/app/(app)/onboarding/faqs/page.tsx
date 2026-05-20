"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

const DEFAULT_BIRDEYE_FAQS = [
  "What services do you offer?",
  "Where are you located?",
  "What are your business hours?",
  "How can customers contact you?",
  "What payment methods do you accept?",
  "Do you provide service-area coverage?",
];

export default function FaqsStep() {
  const { state, patch, goNext } = useWizard();
  const requireOne = state.packageId !== "foundations";
  const valid = !requireOne || state.faqs.length >= 1;

  return (
    <StepShell
      stepKey="faqs"
      eyebrow="Step 09"
      title="FAQs"
      blurb="The questions customers ask before they buy. We'll answer them on your microsite and use them to seed Q&A on Google."
      onContinue={() => goNext("faqs")}
      continueDisabled={!valid}
    >
      <Card className="mb-7 bg-eggshell-warm/40 border-line">
        <CardHeader>
          <CardTitle className="font-serif text-lg">
            Six default FAQs are included
          </CardTitle>
          <p className="text-sm text-ink-muted mt-1">
            These will work out-of-the-box from your business info — no action needed.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-1 md:grid-cols-2 text-sm font-sans text-ink-muted">
            {DEFAULT_BIRDEYE_FAQS.map((q) => (
              <li key={q} className="flex gap-1.5">
                <span className="text-plum">·</span>
                {q}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <h2 className="font-serif text-2xl text-teal mb-2">
        Custom FAQs {requireOne ? <span className="text-plum">*</span> : null}
      </h2>
      {requireOne ? (
        <p className="text-sm text-ink-muted mb-4">
          Your package collects reviews and runs campaigns — at least one custom FAQ helps the AI sound like you.
        </p>
      ) : null}

      <ul className="space-y-3">
        {state.faqs.map((f, i) => (
          <li key={i} className="rounded-2xl border border-line bg-white p-5 grid gap-3">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs uppercase tracking-wide text-ink-muted">
                FAQ #{i + 1}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  patch((s) => ({ ...s, faqs: s.faqs.filter((_, j) => j !== i) }))
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Label>
              Question
              <Input
                value={f.question}
                onChange={(e) =>
                  patch((s) => {
                    const next = [...s.faqs];
                    next[i] = { ...next[i], question: e.target.value };
                    return { ...s, faqs: next };
                  })
                }
              />
            </Label>
            <Label>
              Answer
              <Textarea
                value={f.answer}
                onChange={(e) =>
                  patch((s) => {
                    const next = [...s.faqs];
                    next[i] = { ...next[i], answer: e.target.value };
                    return { ...s, faqs: next };
                  })
                }
              />
            </Label>
          </li>
        ))}
      </ul>

      {state.faqs.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted font-sans">
          Nothing here yet — add your first one below.
        </p>
      ) : null}

      {state.faqs.length < 20 ? (
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            patch((s) => ({ ...s, faqs: [...s.faqs, { question: "", answer: "" }] }))
          }
        >
          <Plus className="h-4 w-4" /> Add FAQ
        </Button>
      ) : null}
    </StepShell>
  );
}
