"use client";

import { redirect } from "next/navigation";
import { useWizard } from "@/components/wizard/WizardContext";
import { StepShell } from "@/components/wizard/StepShell";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Switch, Chip } from "@/components/ui/toggle";
import { AssetUploader } from "@/components/wizard/AssetUploader";

const TEAMS = ["Sales", "Admin", "Support"] as const;

export default function WebchatStep() {
  const { state, patch, goNext } = useWizard();

  if (state.packageId !== "accelerate") {
    if (typeof window !== "undefined") redirect("/onboarding/contacts");
    return null;
  }
  const w = state.webchat!;
  const valid = !!w.agentName && !!w.welcomeMessage;

  return (
    <StepShell
      stepKey="webchat"
      eyebrow="Step 10 — Accelerate only"
      title="Webchat configuration"
      blurb="Your AI agent that captures leads on your website 24/7. We'll generate the embed snippet for you on the success screen."
      onContinue={() => goNext("webchat")}
      continueDisabled={!valid}
    >
      <Label className="mb-7">
        Where will the chat be embedded?
        <Input
          type="url"
          value={w.websiteUrl ?? ""}
          placeholder="https://yourbusiness.com.au"
          onChange={(e) =>
            patch((s) => ({
              ...s,
              webchat: { ...s.webchat!, websiteUrl: e.target.value || undefined },
            }))
          }
        />
      </Label>

      <h2 className="font-serif text-xl text-teal mb-3">Bubble</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <AssetUploader
          label="Bubble icon"
          hint="60 × 60 px, transparent PNG works best."
          kind="webchatIcon"
          onboardingId={state.onboardingId}
          value={w.iconImage}
          onChange={(url) =>
            patch((s) => ({ ...s, webchat: { ...s.webchat!, iconImage: url || undefined } }))
          }
        />
        <div className="grid gap-4">
          <Label>
            Bubble message
            <Input
              value={w.bubbleMessage}
              onChange={(e) =>
                patch((s) => ({ ...s, webchat: { ...s.webchat!, bubbleMessage: e.target.value } }))
              }
            />
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Label>
              Bubble bg
              <Input
                type="color"
                value={w.backgroundColor}
                onChange={(e) =>
                  patch((s) => ({
                    ...s,
                    webchat: { ...s.webchat!, backgroundColor: e.target.value },
                  }))
                }
              />
            </Label>
            <Label>
              Icon color
              <Input
                type="color"
                value={w.iconColor}
                onChange={(e) =>
                  patch((s) => ({ ...s, webchat: { ...s.webchat!, iconColor: e.target.value } }))
                }
              />
            </Label>
          </div>
          <Switch
            checked={w.playSound}
            onCheckedChange={(v) =>
              patch((s) => ({ ...s, webchat: { ...s.webchat!, playSound: v } }))
            }
            label="Play notification sound"
          />
        </div>
      </div>

      <h2 className="mt-9 font-serif text-xl text-teal mb-3">Window</h2>
      <div className="grid gap-4 md:grid-cols-4">
        <Label>
          Header bg
          <Input
            type="color"
            value={w.headerColor}
            onChange={(e) =>
              patch((s) => ({ ...s, webchat: { ...s.webchat!, headerColor: e.target.value } }))
            }
          />
        </Label>
        <Label>
          Header text
          <Input
            type="color"
            value={w.headerTextColor}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                webchat: { ...s.webchat!, headerTextColor: e.target.value },
              }))
            }
          />
        </Label>
        <Label>
          Button bg
          <Input
            type="color"
            value={w.buttonColor}
            onChange={(e) =>
              patch((s) => ({ ...s, webchat: { ...s.webchat!, buttonColor: e.target.value } }))
            }
          />
        </Label>
        <Label>
          Button text
          <Input
            type="color"
            value={w.buttonTextColor}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                webchat: { ...s.webchat!, buttonTextColor: e.target.value },
              }))
            }
          />
        </Label>
        <Label className="md:col-span-2">
          Window size
          <Select
            value={w.windowSize}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                webchat: { ...s.webchat!, windowSize: e.target.value as typeof w.windowSize },
              }))
            }
          >
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </Select>
        </Label>
      </div>

      <h2 className="mt-9 font-serif text-xl text-teal mb-3">Header</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <AssetUploader
          label="Team avatar"
          hint="120 × 120 px works well."
          kind="teamAvatar"
          onboardingId={state.onboardingId}
          value={w.teamAvatar}
          onChange={(url) =>
            patch((s) => ({ ...s, webchat: { ...s.webchat!, teamAvatar: url || undefined } }))
          }
        />
        <div className="grid gap-3">
          <Label required>
            Agent name
            <Input
              value={w.agentName}
              onChange={(e) =>
                patch((s) => ({ ...s, webchat: { ...s.webchat!, agentName: e.target.value } }))
              }
            />
          </Label>
          <Label>
            Header line
            <Input
              value={w.headerLine}
              onChange={(e) =>
                patch((s) => ({ ...s, webchat: { ...s.webchat!, headerLine: e.target.value } }))
              }
            />
          </Label>
          <Label required>
            Welcome message
            <Textarea
              value={w.welcomeMessage}
              onChange={(e) =>
                patch((s) => ({
                  ...s,
                  webchat: { ...s.webchat!, welcomeMessage: e.target.value },
                }))
              }
            />
          </Label>
        </div>
      </div>

      <h2 className="mt-9 font-serif text-xl text-teal mb-3">Routing</h2>
      <Label>Teams enabled</Label>
      <div className="mt-2 flex gap-2">
        {TEAMS.map((t) => {
          const active = w.teamsEnabled.includes(t);
          return (
            <Chip
              key={t}
              active={active}
              onClick={() =>
                patch((s) => ({
                  ...s,
                  webchat: {
                    ...s.webchat!,
                    teamsEnabled: active
                      ? s.webchat!.teamsEnabled.filter((x) => x !== t)
                      : [...s.webchat!.teamsEnabled, t],
                  },
                }))
              }
            >
              {t}
            </Chip>
          );
        })}
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <Label>
          Disclaimer (optional)
          <Textarea
            value={w.disclaimer ?? ""}
            onChange={(e) =>
              patch((s) => ({
                ...s,
                webchat: { ...s.webchat!, disclaimer: e.target.value || undefined },
              }))
            }
          />
        </Label>
        <Label>
          Google Analytics ID (optional)
          <Input
            value={w.gaTrackingId ?? ""}
            placeholder="G-XXXXXXXXXX"
            onChange={(e) =>
              patch((s) => ({
                ...s,
                webchat: { ...s.webchat!, gaTrackingId: e.target.value || undefined },
              }))
            }
          />
        </Label>
      </div>
    </StepShell>
  );
}
