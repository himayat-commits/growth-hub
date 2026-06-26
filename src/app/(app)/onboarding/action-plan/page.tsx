// Free-tier terminal step. Rendered inside the onboarding WizardProvider, so
// ActionPlanReport can read the wizard answers via useWizard().
import { ActionPlanReport } from "@/components/portal/ActionPlanReport";

export default function ActionPlanPage() {
  return <ActionPlanReport />;
}
