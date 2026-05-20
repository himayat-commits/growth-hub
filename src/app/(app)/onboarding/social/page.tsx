"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Input, Label } from "@/components/ui/input";

const FIELDS: Array<[
  keyof import("@/lib/wizard/state").WizardState["social"],
  string,
  string
]> = [
  ["google", "Google", "https://g.page/your-business"],
  ["facebook", "Facebook", "https://facebook.com/your-page"],
  ["instagram", "Instagram", "https://instagram.com/your-handle"],
  ["x", "X (Twitter)", "https://x.com/your-handle"],
  ["linkedin", "LinkedIn", "https://linkedin.com/company/your-page"],
  ["youtube", "YouTube", "https://youtube.com/@your-channel"],
  ["pinterest", "Pinterest", "https://pinterest.com/your-account"],
];

export default function SocialStep() {
  const { state, patch, goNext } = useWizard();
  const s = state.social;

  return (
    <StepShell
      stepKey="social"
      eyebrow="Step 08"
      title="Social profiles"
      blurb="Existing pages we should link — leave blank what you don't have. We never create new social pages on your behalf."
      onContinue={() => goNext("social")}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {FIELDS.map(([key, label, placeholder]) => (
          <Label key={key}>
            {label}
            <Input
              type="url"
              value={s[key] ?? ""}
              placeholder={placeholder}
              onChange={(e) =>
                patch((st) => ({
                  ...st,
                  social: { ...st.social, [key]: e.target.value || undefined },
                }))
              }
            />
          </Label>
        ))}
      </div>
    </StepShell>
  );
}
