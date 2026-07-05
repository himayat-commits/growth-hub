// Build a fresh wizard state for a brand-new onboarding session.
import {
  defaultWeekly,
  stepsFor,
  type StepDef,
  type WizardMode,
  type WizardState,
  type StepKey,
} from "@/lib/wizard/state";
import type { PackageId } from "@/lib/wizard/packages";

/** Webchat defaults, shared between createInitialState (fresh accelerate
 *  signups) and the free→paid reconcile in the onboarding layout (a report-
 *  mode row upgraded to accelerate has no webchat block yet). */
export function defaultWebchat(): NonNullable<WizardState["webchat"]> {
  return {
    websiteUrl: undefined,
    iconImage: undefined,
    bubbleMessage: "Have a question? We're here to help!",
    backgroundColor: "#0D3F48",
    iconColor: "#FFFFFF",
    playSound: true,
    headerColor: "#0D3F48",
    headerTextColor: "#FFFFFF",
    buttonColor: "#E3F29C",
    buttonTextColor: "#0D3F48",
    windowSize: "Medium",
    teamAvatar: undefined,
    agentName: "Team",
    headerLine: "Hi there!",
    welcomeMessage: "Questions? We are here to help! Send us a message below.",
    teamsEnabled: ["Sales"],
    disclaimer: undefined,
    gaTrackingId: undefined,
  };
}

export function createInitialState(args: {
  onboardingId: string;
  packageId: PackageId;
  email: string;
}): WizardState {
  const now = new Date().toISOString();
  return {
    onboardingId: args.onboardingId,
    packageId: args.packageId,
    status: "draft",
    createdAt: now,
    updatedAt: now,
    adminUser: {
      firstName: "",
      lastName: "",
      email: args.email,
      phone: "",
      role: "admin",
    },
    additionalUsers: [],
    business: {
      name: "",
      alias: "",
      abn: "",
      establishedYear: undefined,
      timezone: "Australia/Sydney",
      languages: ["English"],
    },
    address: {
      address1: "",
      address2: "",
      subLocality: "",
      city: "",
      state: "NSW",
      zip: "",
      countryCode: "AU",
      phone: "",
      localPhoneNumber: "",
      tollFreePhoneNumber: "",
      fax: "",
      emailId: args.email,
      websiteUrl: "",
      isAddressHidden: false,
      isServiceAreaProvider: false,
      serviceAreas: [],
    },
    hours: {
      is24x7: false,
      weekly: defaultWeekly(),
      special: [],
      status: "Open",
      reopenDate: undefined,
    },
    about: {
      vision: "",
      offerings: "",
      usp: "",
      idealCustomer: "",
      competitorEdge: "",
      benefits: "",
      cta: "",
      competitors: "",
      marketingBudget: "",
      marketingPainPoints: "",
    },
    descriptions: { birdeye: "", google: "", facebook: "", apple: "" },
    taxonomy: {
      gmbPrimary: "",
      gmbAdditional: [],
      appleCategories: [],
      fbCategories: [],
      birdeyeCategory: "",
      birdeyeSubs: [],
      services: "",
      keywords: "",
      products: "",
      payment: [],
      appointmentLink: undefined,
      reservationLink: undefined,
      menuLink: undefined,
      orderAheadLink: undefined,
    },
    assets: {
      logoUrl: "",
      birdeyeCoverUrl: "",
      googleCoverUrl: undefined,
      facebookCoverUrl: undefined,
      showcase: [],
    },
    social: {
      google: undefined,
      facebook: undefined,
      instagram: undefined,
      x: undefined,
      linkedin: undefined,
      youtube: undefined,
      pinterest: undefined,
    },
    faqs: [],
    webchat: args.packageId === "accelerate" ? defaultWebchat() : undefined,
    contacts: [],
    provisioning: { invitedUsers: [], mediaIds: [] },
  };
}

export function isStepComplete(state: WizardState, key: StepKey): boolean {
  // Optional-chained throughout: onboarding_states rows are read and cast to
  // WizardState WITHOUT re-validation, so a legacy/partial row may be missing
  // nested objects. This must never throw — a throw here would crash any page
  // that computes step progress (notably /services for paid users).
  switch (key) {
    case "confirm":
      return Boolean(
        state.adminUser?.firstName &&
          state.adminUser?.lastName &&
          state.adminUser?.email &&
          state.adminUser?.phone
      );
    case "business":
      return Boolean(state.business?.name);
    case "address":
      return Boolean(
        state.address?.address1 &&
          state.address?.city &&
          state.address?.zip &&
          state.address?.phone &&
          state.address?.emailId &&
          state.address?.websiteUrl
      );
    case "hours":
      return Boolean(state.hours?.is24x7) || Boolean(state.hours?.weekly?.some((d) => d.isOpen));
    case "about":
      return Boolean(
        state.about?.vision &&
          state.about?.offerings &&
          state.about?.usp &&
          state.about?.idealCustomer &&
          state.about?.competitorEdge &&
          state.about?.benefits &&
          state.about?.cta &&
          state.descriptions?.birdeye
      );
    case "taxonomy":
      return Boolean(
        state.taxonomy?.gmbPrimary && state.taxonomy?.birdeyeCategory
      );
    case "assets":
      return Boolean(state.assets?.logoUrl && state.assets?.birdeyeCoverUrl);
    case "social":
      return true;
    case "faqs":
      if (state.packageId === "foundations") return true;
      return (state.faqs?.length ?? 0) >= 1;
    case "webchat":
      if (state.packageId !== "accelerate") return true;
      return Boolean(
        state.webchat?.agentName && state.webchat?.welcomeMessage
      );
    case "contacts":
      return true;
    case "review":
      return state.status === "submitted" || state.status === "provisioned";
    case "action-plan":
      // Terminal report view — always reachable once the user gets there.
      return true;
  }
}

// ── Journey progress helpers ─────────────────────────────────────────────
//
// The single source of truth for "how far through onboarding is this user"
// — used by the dashboard checklist, /services banners and the post-checkout
// bridge, which previously each re-derived it inline. Terminal steps
// (review / action-plan) are excluded: they're destinations, not tasks.

export type WizardProgressSummary = {
  /** Form steps completed (terminal steps excluded). */
  done: number;
  /** Total form steps for this mode/package. */
  total: number;
  /** The first incomplete form step, or null when all are complete. */
  next: StepDef | null;
  /** 1-based position of `next` in the full step list (for "Step N of M"). */
  nextIndex: number | null;
  /** The full mode-aware step list, terminal steps included. */
  steps: StepDef[];
};

export function wizardProgress(
  state: WizardState | null | undefined,
  mode: WizardMode,
  fallbackPkg: PackageId,
): WizardProgressSummary {
  const pkg = state?.packageId ?? fallbackPkg;
  const steps = stepsFor(mode, pkg);
  const formSteps = steps.filter(
    (s) => s.key !== "review" && s.key !== "action-plan",
  );
  const completed = formSteps.filter(
    (s) => state != null && isStepComplete(state, s.key),
  );
  const next =
    formSteps.find((s) => state == null || !isStepComplete(state, s.key)) ??
    null;
  return {
    done: completed.length,
    total: formSteps.length,
    next,
    nextIndex: next ? steps.findIndex((s) => s.key === next.key) + 1 : null,
    steps,
  };
}

/** The first incomplete form step for this user, or null when the form part
 *  of the wizard is complete (send them to the terminal step instead). */
export function firstIncompleteStep(
  state: WizardState | null | undefined,
  mode: WizardMode,
  fallbackPkg: PackageId,
): StepDef | null {
  return wizardProgress(state, mode, fallbackPkg).next;
}
