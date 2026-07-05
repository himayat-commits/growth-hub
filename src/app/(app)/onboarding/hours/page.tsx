"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Input, Label, Select } from "@/components/ui/input";
import { Switch } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

export default function HoursStep() {
  const { state, patch, goNext } = useWizard();
  const h = state.hours;
  const valid = h.is24x7 || h.weekly.some((d) => d.isOpen);

  return (
    <StepShell
      stepKey="hours"
      title="Hours of operation"
      blurb="Your hours appear on Google, Apple Maps, Facebook and Bing. Get them right once here, and they update everywhere."
      onContinue={() => goNext("hours")}
      continueDisabled={!valid}
    >
      <div className="mb-6 flex flex-wrap gap-6 items-center">
        <Switch
          checked={h.is24x7}
          onCheckedChange={(v) =>
            patch((s) => ({ ...s, hours: { ...s.hours, is24x7: v } }))
          }
          label="We're open 24/7"
        />
        <Label className="ml-auto">
          Status
          <Select
            value={h.status}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                hours: { ...s.hours, status: e.target.value as typeof h.status },
              }))
            }
          >
            <option>Open</option>
            <option>Temporarily Closed</option>
            <option>Opening Soon</option>
            <option>Permanently Closed</option>
          </Select>
        </Label>
      </div>

      {!h.is24x7 ? (
        <ul className="space-y-3 border border-line rounded-2xl p-5 bg-white">
          {h.weekly.map((day, i) => (
            <li key={day.label} className="flex items-start gap-4 flex-wrap">
              <div className="w-32 flex items-center gap-2">
                <Switch
                  checked={day.isOpen}
                  onCheckedChange={(v) =>
                    patch((s) => {
                      const next = [...s.hours.weekly];
                      next[i] = { ...next[i], isOpen: v };
                      return { ...s, hours: { ...s.hours, weekly: next } };
                    })
                  }
                />
                <span className="font-sans text-sm font-medium text-teal">
                  {day.label}
                </span>
              </div>
              {day.isOpen ? (
                <div className="flex-1 flex flex-wrap gap-2 items-center">
                  {day.windows.map((w, wi) => (
                    <div key={wi} className="flex items-center gap-1">
                      <Input
                        type="time"
                        value={w.start}
                        className="w-28"
                        onChange={(e) =>
                          patch((s) => {
                            const weekly = [...s.hours.weekly];
                            const windows = [...weekly[i].windows];
                            windows[wi] = { ...windows[wi], start: e.target.value };
                            weekly[i] = { ...weekly[i], windows };
                            return { ...s, hours: { ...s.hours, weekly } };
                          })
                        }
                      />
                      <span className="text-ink-muted text-xs">–</span>
                      <Input
                        type="time"
                        value={w.end}
                        className="w-28"
                        onChange={(e) =>
                          patch((s) => {
                            const weekly = [...s.hours.weekly];
                            const windows = [...weekly[i].windows];
                            windows[wi] = { ...windows[wi], end: e.target.value };
                            weekly[i] = { ...weekly[i], windows };
                            return { ...s, hours: { ...s.hours, weekly } };
                          })
                        }
                      />
                      {day.windows.length > 1 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            patch((s) => {
                              const weekly = [...s.hours.weekly];
                              weekly[i] = {
                                ...weekly[i],
                                windows: weekly[i].windows.filter((_, j) => j !== wi),
                              };
                              return { ...s, hours: { ...s.hours, weekly } };
                            })
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      ) : null}
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      patch((s) => {
                        const weekly = [...s.hours.weekly];
                        weekly[i] = {
                          ...weekly[i],
                          windows: [...weekly[i].windows, { start: "13:00", end: "17:00" }],
                        };
                        return { ...s, hours: { ...s.hours, weekly } };
                      })
                    }
                  >
                    <Plus className="h-3.5 w-3.5" /> Add window
                  </Button>
                </div>
              ) : (
                <span className="text-sm text-ink-muted font-sans">Closed</span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-2xl border border-lime bg-lime-soft p-5 text-sm text-teal font-sans">
          ✓ Open 24 hours a day, 7 days a week.
        </div>
      )}

      <h3 className="mt-10 font-serif text-xl text-teal">Special hours (public holidays)</h3>
      <p className="text-xs text-ink-muted mt-1 mb-3">Date format: MM/DD/YYYY (per Birdeye).</p>
      <ul className="space-y-2">
        {h.special.map((sp, i) => (
          <li key={i} className="grid grid-cols-12 gap-2 items-center">
            <Input
              className="col-span-3"
              placeholder="12/25/2026"
              value={sp.date}
              onChange={(e) =>
                patch((s) => {
                  const sps = [...s.hours.special];
                  sps[i] = { ...sps[i], date: e.target.value };
                  return { ...s, hours: { ...s.hours, special: sps } };
                })
              }
            />
            <div className="col-span-2">
              <Switch
                checked={sp.isOpen}
                onCheckedChange={(v) =>
                  patch((s) => {
                    const sps = [...s.hours.special];
                    sps[i] = { ...sps[i], isOpen: v };
                    return { ...s, hours: { ...s.hours, special: sps } };
                  })
                }
                label={sp.isOpen ? "Open" : "Closed"}
              />
            </div>
            <Input
              className="col-span-2"
              type="time"
              disabled={!sp.isOpen}
              value={sp.start ?? ""}
              onChange={(e) =>
                patch((s) => {
                  const sps = [...s.hours.special];
                  sps[i] = { ...sps[i], start: e.target.value };
                  return { ...s, hours: { ...s.hours, special: sps } };
                })
              }
            />
            <Input
              className="col-span-2"
              type="time"
              disabled={!sp.isOpen}
              value={sp.end ?? ""}
              onChange={(e) =>
                patch((s) => {
                  const sps = [...s.hours.special];
                  sps[i] = { ...sps[i], end: e.target.value };
                  return { ...s, hours: { ...s.hours, special: sps } };
                })
              }
            />
            <Input
              className="col-span-2"
              placeholder="Description"
              value={sp.description ?? ""}
              onChange={(e) =>
                patch((s) => {
                  const sps = [...s.hours.special];
                  sps[i] = { ...sps[i], description: e.target.value };
                  return { ...s, hours: { ...s.hours, special: sps } };
                })
              }
            />
            <Button
              size="sm"
              variant="ghost"
              className="col-span-1"
              onClick={() =>
                patch((s) => ({
                  ...s,
                  hours: {
                    ...s.hours,
                    special: s.hours.special.filter((_, j) => j !== i),
                  },
                }))
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </li>
        ))}
      </ul>
      <Button
        variant="outline"
        className="mt-3"
        onClick={() =>
          patch((s) => ({
            ...s,
            hours: {
              ...s.hours,
              special: [...s.hours.special, { date: "", isOpen: false }],
            },
          }))
        }
      >
        <Plus className="h-4 w-4" /> Add special date
      </Button>

      {(h.status === "Temporarily Closed" || h.status === "Opening Soon") && (
        <div className="mt-7">
          <Label required>
            Re-open / open date
            <Input
              type="date"
              value={h.reopenDate ?? ""}
              onChange={(e) =>
                patch((s) => ({ ...s, hours: { ...s.hours, reopenDate: e.target.value } }))
              }
            />
          </Label>
        </div>
      )}
    </StepShell>
  );
}
