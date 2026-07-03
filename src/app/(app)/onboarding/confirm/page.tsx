"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Card, CardContent, CardHeader, CardTitle, Pill } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PACKAGES } from "@/lib/wizard/packages";
import { Trash2, Plus } from "lucide-react";
import type { WizardUser } from "@/lib/wizard/state";

export default function ConfirmStep() {
  const { state, patch, goNext } = useWizard();
  const pkg = PACKAGES[state.packageId];
  const u = state.adminUser;

  const valid =
    u.firstName.trim() &&
    u.lastName.trim() &&
    /^[^@]+@[^@]+\.[^@]+$/.test(u.email) &&
    u.phone.trim();

  return (
    <StepShell
      stepKey="confirm"
      title="Confirm package & primary contact"
      blurb="Quick check on what you bought and who's running the account. We'll use this email for the Birdeye admin invite."
      framed={false}
      onContinue={() => goNext("confirm")}
      continueDisabled={!valid}
    >
      <Card className="mb-8 bg-eggshell-paper">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-[12px] font-semibold tracking-[0.12em] uppercase text-plum">
                {pkg.tagline}
              </p>
              <CardTitle className="font-serif text-3xl mt-1">{pkg.name}</CardTitle>
            </div>
            <Pill tone="lime">${pkg.pricePerMonth}/mo</Pill>
          </div>
          <p className="mt-4 text-ink-muted leading-relaxed">{pkg.positioning}</p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {pkg.modules.map((m) => (
              <Pill key={m}>{m}</Pill>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 md:p-7">
          <h2 className="font-serif text-2xl text-teal mb-4">Admin user</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Label required>
              First name
              <Input
                value={u.firstName}
                onChange={(e) =>
                  patch((s) => ({
                    ...s,
                    adminUser: { ...s.adminUser, firstName: e.target.value },
                  }))
                }
              />
            </Label>
            <Label required>
              Last name
              <Input
                value={u.lastName}
                onChange={(e) =>
                  patch((s) => ({
                    ...s,
                    adminUser: { ...s.adminUser, lastName: e.target.value },
                  }))
                }
              />
            </Label>
            <Label required>
              Email
              <Input
                type="email"
                value={u.email}
                onChange={(e) =>
                  patch((s) => ({
                    ...s,
                    adminUser: { ...s.adminUser, email: e.target.value },
                  }))
                }
              />
            </Label>
            <Label required>
              Phone
              <Input
                value={u.phone}
                placeholder="04XX XXX XXX"
                onChange={(e) =>
                  patch((s) => ({
                    ...s,
                    adminUser: { ...s.adminUser, phone: e.target.value },
                  }))
                }
              />
            </Label>
          </div>

          <h3 className="mt-12 font-serif text-xl text-teal">
            Add team members
            <span className="font-serif italic text-base text-plum ml-2">— optional</span>
          </h3>
          <p className="text-sm text-ink-muted mt-1 mb-4">
            Up to two extra people who should get a Birdeye login.
          </p>

          <ul className="space-y-3">
            {state.additionalUsers.map((au, i) => (
              <li key={i} className="grid gap-3 md:grid-cols-12 items-end">
                <Label className="md:col-span-3">
                  First
                  <Input
                    value={au.firstName}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.additionalUsers];
                        next[i] = { ...next[i], firstName: e.target.value };
                        return { ...s, additionalUsers: next };
                      })
                    }
                  />
                </Label>
                <Label className="md:col-span-3">
                  Last
                  <Input
                    value={au.lastName}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.additionalUsers];
                        next[i] = { ...next[i], lastName: e.target.value };
                        return { ...s, additionalUsers: next };
                      })
                    }
                  />
                </Label>
                <Label className="md:col-span-3">
                  Email
                  <Input
                    type="email"
                    value={au.email}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.additionalUsers];
                        next[i] = { ...next[i], email: e.target.value };
                        return { ...s, additionalUsers: next };
                      })
                    }
                  />
                </Label>
                <Label className="md:col-span-2">
                  Role
                  <Select
                    value={au.role}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.additionalUsers];
                        next[i] = {
                          ...next[i],
                          role: e.target.value as WizardUser["role"],
                        };
                        return { ...s, additionalUsers: next };
                      })
                    }
                  >
                    <option value="admin">admin</option>
                    <option value="owner">owner</option>
                  </Select>
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:col-span-1"
                  onClick={() =>
                    patch((s) => ({
                      ...s,
                      additionalUsers: s.additionalUsers.filter((_, j) => j !== i),
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>

          {state.additionalUsers.length < 2 ? (
            <Button
              variant="outline"
              className="mt-3"
              onClick={() =>
                patch((s) => ({
                  ...s,
                  additionalUsers: [
                    ...s.additionalUsers,
                    { firstName: "", lastName: "", email: "", phone: "", role: "admin" },
                  ],
                }))
              }
            >
              <Plus className="h-4 w-4" />
              Add team member
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </StepShell>
  );
}
