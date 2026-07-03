"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { AU_STATES } from "@/lib/wizard/state";
import { Plus, Trash2 } from "lucide-react";

export default function AddressStep() {
  const { state, patch, goNext } = useWizard();
  const a = state.address;

  const valid =
    a.address1.trim() &&
    a.city.trim() &&
    a.zip.trim() &&
    a.phone.trim() &&
    /^[^@]+@[^@]+\.[^@]+$/.test(a.emailId) &&
    /^https?:\/\//i.test(a.websiteUrl);

  return (
    <StepShell
      stepKey="address"
      title="Address & contact"
      blurb="Where you are — or where you serve — and how customers reach you. This becomes your NAP (Name, Address, Phone) across every listing network."
      onContinue={() => goNext("address")}
      continueDisabled={!valid}
    >
      <div className="grid gap-4 md:grid-cols-6">
        <Label required className="md:col-span-4">
          Address line 1
          <Input
            value={a.address1}
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, address1: e.target.value } }))
            }
          />
        </Label>
        <Label className="md:col-span-2">
          Address line 2
          <Input
            value={a.address2 ?? ""}
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, address2: e.target.value } }))
            }
          />
        </Label>
        <Label className="md:col-span-2">
          Sub-locality
          <Input
            value={a.subLocality ?? ""}
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, subLocality: e.target.value } }))
            }
          />
        </Label>
        <Label required className="md:col-span-2">
          City
          <Input
            value={a.city}
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, city: e.target.value } }))
            }
          />
        </Label>
        <Label required>
          State
          <Select
            value={a.state}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                address: { ...s.address, state: e.target.value as typeof a.state },
              }))
            }
          >
            {AU_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </Select>
        </Label>
        <Label required>
          Postcode
          <Input
            value={a.zip}
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, zip: e.target.value } }))
            }
          />
        </Label>
        <Label className="md:col-span-3" required>
          Phone
          <Input
            value={a.phone}
            placeholder="+61 2 1234 5678"
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, phone: e.target.value } }))
            }
          />
        </Label>
        <Label className="md:col-span-3">
          Local phone (optional)
          <Input
            value={a.localPhoneNumber ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                address: { ...s.address, localPhoneNumber: e.target.value },
              }))
            }
          />
        </Label>
        <Label className="md:col-span-3">
          Toll-free (optional)
          <Input
            value={a.tollFreePhoneNumber ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                address: { ...s.address, tollFreePhoneNumber: e.target.value },
              }))
            }
          />
        </Label>
        <Label className="md:col-span-3">
          Fax (optional)
          <Input
            value={a.fax ?? ""}
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, fax: e.target.value } }))
            }
          />
        </Label>
        <Label required className="md:col-span-3">
          Business email
          <Input
            type="email"
            value={a.emailId}
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, emailId: e.target.value } }))
            }
          />
        </Label>
        <Label required className="md:col-span-3">
          Website URL
          <Input
            type="url"
            value={a.websiteUrl}
            placeholder="https://yourbusiness.com.au"
            onChange={(e) =>
              patch((s) => ({ ...s, address: { ...s.address, websiteUrl: e.target.value } }))
            }
          />
        </Label>
      </div>

      <div className="mt-10 grid gap-4">
        <Switch
          checked={a.isAddressHidden}
          onCheckedChange={(v) =>
            patch((s) => ({ ...s, address: { ...s.address, isAddressHidden: v } }))
          }
          label="Hide my address (I run a service-area-only business)"
        />
        <Switch
          checked={a.isServiceAreaProvider}
          onCheckedChange={(v) =>
            patch((s) => ({
              ...s,
              address: {
                ...s.address,
                isServiceAreaProvider: v,
                serviceAreas: v ? s.address.serviceAreas : [],
              },
            }))
          }
          label="I serve customers at their location (service-area provider)"
        />
      </div>

      {a.isServiceAreaProvider ? (
        <div className="mt-7">
          <h3 className="font-serif text-lg text-teal mb-2">Service areas</h3>
          <p className="text-xs text-ink-muted mb-3">
            Up to 12 areas — one per line, e.g. &quot;Parramatta, Sydney, NSW, 2150&quot;.
          </p>
          <ul className="space-y-2">
            {a.serviceAreas.map((sa, i) => (
              <li key={i} className="flex gap-2">
                <Input
                  value={sa}
                  onChange={(e) =>
                    patch((s) => {
                      const next = [...s.address.serviceAreas];
                      next[i] = e.target.value;
                      return { ...s, address: { ...s.address, serviceAreas: next } };
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    patch((s) => ({
                      ...s,
                      address: {
                        ...s.address,
                        serviceAreas: s.address.serviceAreas.filter((_, j) => j !== i),
                      },
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
          {a.serviceAreas.length < 12 ? (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() =>
                patch((s) => ({
                  ...s,
                  address: { ...s.address, serviceAreas: [...s.address.serviceAreas, ""] },
                }))
              }
            >
              <Plus className="h-4 w-4" /> Add area
            </Button>
          ) : null}
        </div>
      ) : null}
    </StepShell>
  );
}
