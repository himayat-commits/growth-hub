// /onboarding entry — always start at the first step. The wizard chrome
// (left rail) lets the user jump back to any prior step from there.
import { redirect } from "next/navigation";

export default function OnboardingIndex() {
  redirect("/onboarding/confirm");
}
