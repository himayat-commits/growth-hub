"use client";

import * as React from "react";
import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Input, Label, Textarea } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ClipboardPaste } from "lucide-react";

export default function ContactsStep() {
  const { state, patch, goNext } = useWizard();
  const [csv, setCsv] = React.useState("");

  const importCsv = () => {
    const lines = csv.split(/\r?\n/u).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) return;
    const headerLike = /first\s*name|email|phone/i.test(lines[0]);
    const rows = headerLike ? lines.slice(1) : lines;
    const next = rows.slice(0, 50 - state.contacts.length).map((line) => {
      const [firstName = "", lastName = "", email = "", phone = ""] = line
        .split(/[,\t]/u)
        .map((c) => c.trim());
      return {
        firstName,
        lastName,
        email,
        phone,
        permissions: ["email", "text"] as ("email" | "text")[],
        tags: [] as string[],
      };
    });
    patch((s) => ({ ...s, contacts: [...s.contacts, ...next].slice(0, 50) }));
    setCsv("");
  };

  return (
    <StepShell
      stepKey="contacts"
      eyebrow="Step 11 — optional"
      title="Initial contacts"
      blurb="Want to start by collecting reviews from customers you've already served? Add up to 50 contacts here, or skip and bulk-import later."
      onContinue={() => goNext("contacts")}
    >
      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full text-sm font-sans">
          <thead className="bg-eggshell-warm/60 text-ink-muted">
            <tr>
              <th className="text-left px-3 py-2.5 font-medium">First</th>
              <th className="text-left px-3 py-2.5 font-medium">Last</th>
              <th className="text-left px-3 py-2.5 font-medium">Email</th>
              <th className="text-left px-3 py-2.5 font-medium">Mobile</th>
              <th className="text-left px-3 py-2.5 font-medium">Email opt-in</th>
              <th className="text-left px-3 py-2.5 font-medium">Text opt-in</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {state.contacts.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-ink-muted text-sm">
                  Nothing here yet — add your first one below or paste a CSV.
                </td>
              </tr>
            ) : null}
            {state.contacts.map((c, i) => (
              <tr key={i} className="border-t border-line">
                <td className="px-2 py-1.5">
                  <Input
                    className="h-8"
                    value={c.firstName}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.contacts];
                        next[i] = { ...next[i], firstName: e.target.value };
                        return { ...s, contacts: next };
                      })
                    }
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-8"
                    value={c.lastName}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.contacts];
                        next[i] = { ...next[i], lastName: e.target.value };
                        return { ...s, contacts: next };
                      })
                    }
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="email"
                    className="h-8"
                    value={c.email ?? ""}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.contacts];
                        next[i] = { ...next[i], email: e.target.value };
                        return { ...s, contacts: next };
                      })
                    }
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    className="h-8"
                    value={c.phone ?? ""}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.contacts];
                        next[i] = { ...next[i], phone: e.target.value };
                        return { ...s, contacts: next };
                      })
                    }
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <Checkbox
                    checked={c.permissions.includes("email")}
                    onCheckedChange={(v) =>
                      patch((s) => {
                        const next = [...s.contacts];
                        const set = new Set(next[i].permissions);
                        if (v) set.add("email");
                        else set.delete("email");
                        next[i] = {
                          ...next[i],
                          permissions: Array.from(set) as ("email" | "text")[],
                        };
                        return { ...s, contacts: next };
                      })
                    }
                  />
                </td>
                <td className="px-2 py-1.5 text-center">
                  <Checkbox
                    checked={c.permissions.includes("text")}
                    onCheckedChange={(v) =>
                      patch((s) => {
                        const next = [...s.contacts];
                        const set = new Set(next[i].permissions);
                        if (v) set.add("text");
                        else set.delete("text");
                        next[i] = {
                          ...next[i],
                          permissions: Array.from(set) as ("email" | "text")[],
                        };
                        return { ...s, contacts: next };
                      })
                    }
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patch((s) => ({
                        ...s,
                        contacts: s.contacts.filter((_, j) => j !== i),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 items-center">
        {state.contacts.length < 50 ? (
          <Button
            variant="outline"
            onClick={() =>
              patch((s) => ({
                ...s,
                contacts: [
                  ...s.contacts,
                  {
                    firstName: "",
                    lastName: "",
                    email: "",
                    phone: "",
                    permissions: ["email", "text"],
                    tags: [],
                  },
                ],
              }))
            }
          >
            <Plus className="h-4 w-4" /> Add row
          </Button>
        ) : null}
        <span className="font-sans text-xs text-ink-muted">
          {state.contacts.length} / 50
        </span>
      </div>

      <div className="mt-7">
        <Label hint="Paste rows like: First, Last, email, phone — one per line.">
          Or paste a CSV
        </Label>
        <Textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className="font-mono text-xs min-h-32"
        />
        <Button variant="outline" className="mt-2" onClick={importCsv}>
          <ClipboardPaste className="h-4 w-4" /> Import pasted rows
        </Button>
      </div>
    </StepShell>
  );
}
