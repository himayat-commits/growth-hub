"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Chip } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { PAYMENT_OPTIONS } from "@/lib/wizard/state";
import { Plus, Trash2 } from "lucide-react";

export default function TaxonomyStep() {
  const { state, patch, goNext } = useWizard();
  const t = state.taxonomy;
  const valid = t.gmbPrimary.trim() && t.birdeyeCategory.trim();

  return (
    <StepShell
      stepKey="taxonomy"
      eyebrow="Step 06"
      title="Categories, keywords & payment"
      blurb="How the listings networks classify and surface you. Pick a primary Google category that matches what most customers search for first."
      onContinue={() => goNext("taxonomy")}
      continueDisabled={!valid}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Label required className="md:col-span-2">
          Primary Google category
          <Input
            value={t.gmbPrimary}
            placeholder="e.g. Disability services & support organisation"
            onChange={(e) =>
              patch((s) => ({ ...s, taxonomy: { ...s.taxonomy, gmbPrimary: e.target.value } }))
            }
          />
        </Label>
        <Label required>
          Birdeye / microsite category
          <Input
            value={t.birdeyeCategory}
            onChange={(e) =>
              patch((s) => ({ ...s, taxonomy: { ...s.taxonomy, birdeyeCategory: e.target.value } }))
            }
          />
        </Label>
        <Label>
          Birdeye sub-categories (up to 3, comma-separated)
          <Input
            value={t.birdeyeSubs.join(", ")}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                taxonomy: {
                  ...s.taxonomy,
                  birdeyeSubs: e.target.value
                    .split(",")
                    .map((x) => x.trim())
                    .filter(Boolean)
                    .slice(0, 3),
                },
              }))
            }
          />
        </Label>
      </div>

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <RepeaterField
          label="Additional Google categories (up to 9)"
          values={t.gmbAdditional}
          max={9}
          onChange={(next) =>
            patch((s) => ({ ...s, taxonomy: { ...s.taxonomy, gmbAdditional: next } }))
          }
        />
        <RepeaterField
          label="Apple categories (up to 3)"
          values={t.appleCategories}
          max={3}
          onChange={(next) =>
            patch((s) => ({ ...s, taxonomy: { ...s.taxonomy, appleCategories: next } }))
          }
        />
        <RepeaterField
          label="Facebook categories (up to 3)"
          values={t.fbCategories}
          max={3}
          onChange={(next) =>
            patch((s) => ({ ...s, taxonomy: { ...s.taxonomy, fbCategories: next } }))
          }
        />
      </div>

      <div className="mt-9 grid gap-4">
        <Label>
          Services (comma-separated, ≤1000 chars)
          <Textarea
            value={t.services}
            maxLength={1000}
            onChange={(e) =>
              patch((s) => ({ ...s, taxonomy: { ...s.taxonomy, services: e.target.value } }))
            }
          />
        </Label>
        <Label>
          Keywords (comma-separated, ≤1000 chars)
          <Textarea
            value={t.keywords}
            maxLength={1000}
            onChange={(e) =>
              patch((s) => ({ ...s, taxonomy: { ...s.taxonomy, keywords: e.target.value } }))
            }
          />
        </Label>
        <Label>
          Products (comma-separated, ≤1000 chars)
          <Textarea
            value={t.products}
            maxLength={1000}
            onChange={(e) =>
              patch((s) => ({ ...s, taxonomy: { ...s.taxonomy, products: e.target.value } }))
            }
          />
        </Label>
      </div>

      <div className="mt-7">
        <Label>Accepted payment</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PAYMENT_OPTIONS.map((p) => {
            const active = t.payment.includes(p);
            return (
              <Chip
                key={p}
                active={active}
                onClick={() =>
                  patch((s) => ({
                    ...s,
                    taxonomy: {
                      ...s.taxonomy,
                      payment: active
                        ? s.taxonomy.payment.filter((x) => x !== p)
                        : [...s.taxonomy.payment, p],
                    },
                  }))
                }
              >
                {p}
              </Chip>
            );
          })}
        </div>
      </div>

      <div className="mt-9 grid gap-4 md:grid-cols-2">
        <Label>
          Appointment link
          <Input
            type="url"
            value={t.appointmentLink ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                taxonomy: { ...s.taxonomy, appointmentLink: e.target.value || undefined },
              }))
            }
          />
        </Label>
        <Label>
          Reservation link
          <Input
            type="url"
            value={t.reservationLink ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                taxonomy: { ...s.taxonomy, reservationLink: e.target.value || undefined },
              }))
            }
          />
        </Label>
        <Label>
          Menu link
          <Input
            type="url"
            value={t.menuLink ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                taxonomy: { ...s.taxonomy, menuLink: e.target.value || undefined },
              }))
            }
          />
        </Label>
        <Label>
          Order ahead link
          <Input
            type="url"
            value={t.orderAheadLink ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                taxonomy: { ...s.taxonomy, orderAheadLink: e.target.value || undefined },
              }))
            }
          />
        </Label>
      </div>
    </StepShell>
  );
}

function RepeaterField({
  label,
  values,
  max,
  onChange,
}: {
  label: string;
  values: string[];
  max: number;
  onChange: (next: string[]) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <ul className="mt-2 space-y-2">
        {values.map((v, i) => (
          <li key={i} className="flex gap-2">
            <Input
              value={v}
              onChange={(e) => {
                const next = [...values];
                next[i] = e.target.value;
                onChange(next);
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      {values.length < max ? (
        <Button
          size="sm"
          variant="outline"
          className="mt-2"
          onClick={() => onChange([...values, ""])}
        >
          <Plus className="h-4 w-4" />
          Add
        </Button>
      ) : null}
    </div>
  );
}
