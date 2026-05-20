"use client";

import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { AssetUploader } from "@/components/wizard/AssetUploader";
import { Input, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export default function AssetsStep() {
  const { state, patch, goNext } = useWizard();
  const a = state.assets;
  const valid = !!a.logoUrl && !!a.birdeyeCoverUrl;

  return (
    <StepShell
      stepKey="assets"
      eyebrow="Step 07"
      title="Brand assets"
      blurb="Your logo, covers and showcase media — sized for every network. We send the URL to Birdeye, never the file bytes."
      onContinue={() => goNext("assets")}
      continueDisabled={!valid}
    >
      <div className="grid gap-6 md:grid-cols-2">
        <AssetUploader
          label="Logo (square)"
          hint="720 × 720 px keeps your logo crisp on Google and Apple. JPG/PNG, 10 KB – 5 MB."
          kind="logo"
          onboardingId={state.onboardingId}
          required
          value={a.logoUrl}
          onChange={(url) =>
            patch((s) => ({ ...s, assets: { ...s.assets, logoUrl: url ?? "" } }))
          }
        />
        <AssetUploader
          label="Birdeye cover photo"
          hint="1110 × 374 px — used at the top of your microsite. Required."
          kind="birdeyeCover"
          onboardingId={state.onboardingId}
          required
          value={a.birdeyeCoverUrl}
          onChange={(url) =>
            patch((s) => ({ ...s, assets: { ...s.assets, birdeyeCoverUrl: url ?? "" } }))
          }
        />
        <AssetUploader
          label="Google cover photo (optional)"
          hint="1024 × 575 px (16:9). Shown on Google Business Profile."
          kind="googleCover"
          onboardingId={state.onboardingId}
          value={a.googleCoverUrl}
          onChange={(url) =>
            patch((s) => ({ ...s, assets: { ...s.assets, googleCoverUrl: url || undefined } }))
          }
        />
        <AssetUploader
          label="Facebook cover photo (optional)"
          hint="851 × 315 px. Shown at the top of your Facebook page."
          kind="facebookCover"
          onboardingId={state.onboardingId}
          value={a.facebookCoverUrl}
          onChange={(url) =>
            patch((s) => ({ ...s, assets: { ...s.assets, facebookCoverUrl: url || undefined } }))
          }
        />
      </div>

      <h2 className="mt-12 font-serif text-2xl text-teal">
        Showcase media
        <span className="font-serif italic text-base text-plum ml-2">— at least 3</span>
      </h2>
      <p className="text-sm text-ink-muted mt-1 mb-5">
        Pick a category and write a short description for each — Birdeye uses both.
      </p>

      <ul className="grid gap-4 md:grid-cols-2">
        {a.showcase.map((m, i) => (
          <li key={i} className="rounded-2xl border border-line bg-white p-4">
            <div className="flex items-start gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.publicUrl}
                alt=""
                className="h-20 w-20 rounded-xl object-cover bg-eggshell-warm"
              />
              <div className="flex-1 grid gap-2">
                <div className="flex items-center gap-2">
                  <Select
                    className="flex-1"
                    value={m.category}
                    onChange={(e) =>
                      patch((s) => {
                        const next = [...s.assets.showcase];
                        next[i] = {
                          ...next[i],
                          category: e.target.value as typeof m.category,
                        };
                        return { ...s, assets: { ...s.assets, showcase: next } };
                      })
                    }
                  >
                    <option value="EXTERIOR">EXTERIOR</option>
                    <option value="INTERIOR">INTERIOR</option>
                    <option value="TEAMS">TEAMS</option>
                    <option value="ADDITIONAL">ADDITIONAL</option>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      patch((s) => ({
                        ...s,
                        assets: {
                          ...s.assets,
                          showcase: s.assets.showcase.filter((_, j) => j !== i),
                        },
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  placeholder="One-line description"
                  value={m.description}
                  onChange={(e) =>
                    patch((s) => {
                      const next = [...s.assets.showcase];
                      next[i] = { ...next[i], description: e.target.value };
                      return { ...s, assets: { ...s.assets, showcase: next } };
                    })
                  }
                />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-5">
        <AssetUploader
          label="Add showcase photo"
          hint="JPG/PNG, 10 KB – 5 MB, 400–3960 px on the long edge."
          kind="showcase"
          onboardingId={state.onboardingId}
          value={undefined}
          onChange={(url) => {
            if (!url) return;
            patch((s) => ({
              ...s,
              assets: {
                ...s.assets,
                showcase: [
                  ...s.assets.showcase,
                  { publicUrl: url, category: "EXTERIOR", description: "", kind: "photo" },
                ],
              },
            }));
          }}
        />
      </div>

      {a.showcase.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line p-5 text-sm font-sans text-ink-muted bg-white/50">
          Nothing here yet — add your first one above.
        </div>
      ) : null}
    </StepShell>
  );
}
