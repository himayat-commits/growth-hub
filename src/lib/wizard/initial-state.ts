// Build a fresh wizard state for a brand-new onboarding session.
import {
  defaultWeekly,
  type WizardState,
  type StepKey,
} from "@/lib/wizard/state";
import type { PackageId } from "@/lib/wizard/packages";

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
    webchat:
      args.packageId === "accelerate"
        ? {
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
            welcomeMessage:
              "Questions? We are here to help! Send us a message below.",
            teamsEnabled: ["Sales"],
            disclaimer: undefined,
            gaTrackingId: undefined,
          }
        : undefined,
    contacts: [],
    provisioning: { invitedUsers: [], mediaIds: [] },
  };
}

export function isStepComplete(state: WizardState, key: StepKey): boolean {
  switch (key) {
    case "confirm":
      return Boolean(
        state.adminUser.firstName &&
          state.adminUser.lastName &&
          state.adminUser.email &&
          state.adminUser.phone
      );
    case "business":
      return Boolean(state.business.name);
    case "address":
      return Boolean(
        state.address.address1 &&
          state.address.city &&
          state.address.zip &&
          state.address.phone &&
          state.address.emailId &&
          state.address.websiteUrl
      );
    case "hours":
      return state.hours.is24x7 || state.hours.weekly.some((d) => d.isOpen);
    case "about":
      return Boolean(
        state.about.vision &&
          state.about.offerings &&
          state.about.usp &&
          state.about.idealCustomer &&
          state.about.competitorEdge &&
          state.about.benefits &&
          state.about.cta &&
          state.descriptions.birdeye
      );
    case "taxonomy":
      return Boolean(
        state.taxonomy.gmbPrimary && state.taxonomy.birdeyeCategory
      );
    case "assets":
      return Boolean(state.assets.logoUrl && state.assets.birdeyeCoverUrl);
    case "social":
      return true;
    case "faqs":
      if (state.packageId === "foundations") return true;
      return state.faqs.length >= 1;
    case "webchat":
      if (state.packageId !== "accelerate") return true;
      return Boolean(
        state.webchat?.agentName && state.webchat?.welcomeMessage
      );
    case "contacts":
      return true;
    case "review":
      return state.status === "submitted" || state.status === "provisioned";
  }
}
