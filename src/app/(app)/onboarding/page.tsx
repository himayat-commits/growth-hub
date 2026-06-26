// /onboarding entry — start at the first step for the user's mode. Paid
// users begin at `confirm` (provision flow); free users begin at `business`
// (report flow — the `confirm` package step doesn't apply to them).
import { redirect } from "next/navigation";
import { getSubscription, isActive } from "@/lib/subscription";

export default async function OnboardingIndex() {
  const sub = await getSubscription();
  redirect(isActive(sub) ? "/onboarding/confirm" : "/onboarding/business");
}
