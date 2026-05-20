"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Input, Label, Select, FieldError } from "@/components/ui/input";
import { AU_TIMEZONES } from "@/lib/wizard/state";
import { Chip } from "@/components/ui/toggle";

const LANGUAGES = ["English", "Arabic", "Mandarin", "Vietnamese", "Hindi", "Italian", "Greek"];

export default function BusinessStep() {
  const { state, patch, goNext } = useWizard();
  const b = state.business;
  const abnError = b.abn && !/^\d{11}$/.test(b.abn) ? "ABN must be 11 digits" : undefined;
  const valid = b.name.trim().length > 0 && !abnError;

  return (
    <StepShell
      stepKey="business"
      eyebrow="Step 02"
      title="Business identity"
      blurb="The name, ABN and timezone we'll use everywhere — Google, Apple, Facebook, your microsite, all of it."
      onContinue={() => goNext("business")}
      continueDisabled={!valid}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Label required className="md:col-span-2">
          Business name
          <Input
            maxLength={250}
            value={b.name}
            onChange={(e) =>
              patch((s) => ({ ...s, business: { ...s.business, name: e.target.value } }))
            }
            placeholder="e.g. Himayat Disability Services"
          />
        </Label>
        <Label hint="Internal label — not shown publicly">
          Alias (optional)
          <Input
            value={b.alias ?? ""}
            onChange={(e) =>
              patch((s) => ({ ...s, business: { ...s.business, alias: e.target.value } }))
            }
          />
        </Label>
        <Label hint="11 digits, no spaces">
          ABN
          <Input
            value={b.abn ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                business: { ...s.business, abn: e.target.value.replace(/\s+/g, "") },
              }))
            }
            placeholder="12345678901"
          />
          <FieldError message={abnError} />
        </Label>
        <Label>
          Established year
          <Input
            type="number"
            min={1800}
            max={new Date().getFullYear()}
            value={b.establishedYear ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                business: {
                  ...s.business,
                  establishedYear: e.target.value ? Number(e.target.value) : undefined,
                },
              }))
            }
          />
        </Label>
        <Label>
          Timezone
          <Select
            value={b.timezone}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                business: { ...s.business, timezone: e.target.value as typeof b.timezone },
              }))
            }
          >
            {AU_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </Select>
        </Label>
      </div>

      <div className="mt-8">
        <Label>Languages spoken</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {LANGUAGES.map((l) => {
            const active = b.languages.includes(l);
            return (
              <Chip
                key={l}
                active={active}
                onClick={() =>
                  patch((s) => ({
                    ...s,
                    business: {
                      ...s.business,
                      languages: active
                        ? s.business.languages.filter((x) => x !== l)
                        : [...s.business.languages, l],
                    },
                  }))
                }
              >
                {l}
              </Chip>
            );
          })}
        </div>
      </div>
    </StepShell>
  );
}
