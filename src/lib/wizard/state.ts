// The single source of truth for what the wizard collects.
// Every Birdeye payload field in lib/birdeye/payloads.ts traces back here.
//
// Validation note: the schema is permissive (empty strings allowed) because
// the wizard saves partial state continuously. Step-level "is this complete
// enough to continue?" lives in `isStepComplete` (lib/initial-state.ts) and
// the per-step `valid` booleans in each page component.

import { z } from "zod";

const urlOpt = z.string().optional();
const phoneOpt = z.string().max(40).optional();

// --- Step 1: package + users ----------------------------------------------

export const userSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  phone: z.string(),
  role: z.enum(["admin", "owner"]).default("admin"),
});
export type WizardUser = z.infer<typeof userSchema>;

// --- Step 2: business identity --------------------------------------------

export const AU_TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Adelaide",
  "Australia/Perth",
  "Australia/Darwin",
  "Australia/Hobart",
] as const;

export const AU_STATES = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"] as const;

export const businessSchema = z.object({
  name: z.string().max(250),
  alias: z.string().max(120).optional(),
  abn: z.string().optional(),
  establishedYear: z.coerce
    .number()
    .int()
    .min(1800)
    .max(new Date().getFullYear())
    .optional(),
  timezone: z.enum(AU_TIMEZONES).default("Australia/Sydney"),
  languages: z.array(z.string()).default(["English"]),
});

// --- Step 3: address & service area ---------------------------------------

export const addressSchema = z.object({
  address1: z.string(),
  address2: z.string().optional(),
  subLocality: z.string().optional(),
  city: z.string(),
  state: z.enum(AU_STATES),
  zip: z.string(),
  countryCode: z.literal("AU").default("AU"),
  phone: z.string(),
  localPhoneNumber: phoneOpt,
  tollFreePhoneNumber: phoneOpt,
  fax: phoneOpt,
  emailId: z.string(),
  websiteUrl: z.string(),
  isAddressHidden: z.boolean().default(false),
  isServiceAreaProvider: z.boolean().default(false),
  serviceAreas: z.array(z.string()).max(12).default([]),
});

// --- Step 4: hours of operation -------------------------------------------

const timeStr = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/u, "HH:MM");

export const hoursWindowSchema = z.object({ start: timeStr, end: timeStr });

export const hoursDaySchema = z.object({
  /** 0=Mon … 6=Sun, per Birdeye blueprint */
  index: z.number().int().min(0).max(6),
  label: z.string(),
  isOpen: z.boolean().default(true),
  windows: z.array(hoursWindowSchema).default([{ start: "09:00", end: "17:00" }]),
  comment: z.string().optional(),
});

export const specialHoursSchema = z.object({
  /** "MM/DD/YYYY" per Birdeye blueprint — UI nudges users toward this format */
  date: z.string(),
  isOpen: z.boolean().default(false),
  start: z.string().optional(),
  end: z.string().optional(),
  description: z.string().optional(),
});

export const hoursSchema = z.object({
  is24x7: z.boolean().default(false),
  weekly: z.array(hoursDaySchema).length(7),
  special: z.array(specialHoursSchema).default([]),
  status: z
    .enum(["Open", "Temporarily Closed", "Opening Soon", "Permanently Closed"])
    .default("Open"),
  reopenDate: z.string().optional(),
});

export const defaultWeekly = (): z.infer<typeof hoursDaySchema>[] => [
  { index: 0, label: "Monday", isOpen: true, windows: [{ start: "09:00", end: "17:00" }] },
  { index: 1, label: "Tuesday", isOpen: true, windows: [{ start: "09:00", end: "17:00" }] },
  { index: 2, label: "Wednesday", isOpen: true, windows: [{ start: "09:00", end: "17:00" }] },
  { index: 3, label: "Thursday", isOpen: true, windows: [{ start: "09:00", end: "17:00" }] },
  { index: 4, label: "Friday", isOpen: true, windows: [{ start: "09:00", end: "17:00" }] },
  { index: 5, label: "Saturday", isOpen: false, windows: [{ start: "10:00", end: "14:00" }] },
  { index: 6, label: "Sunday", isOpen: false, windows: [{ start: "10:00", end: "14:00" }] },
];

// --- Step 5: about-your-business questionnaire ----------------------------

export const aboutSchema = z.object({
  vision: z.string(),
  offerings: z.string(),
  usp: z.string(),
  idealCustomer: z.string(),
  competitorEdge: z.string(),
  benefits: z.string(),
  cta: z.string(),
  competitors: z.string().optional(),
  marketingBudget: z.string().optional(),
  marketingPainPoints: z.string().optional(),
});

export const descriptionsSchema = z.object({
  birdeye: z.string().max(5000),
  google: z.string().max(750),
  facebook: z.string().max(255),
  apple: z.string().max(1000),
});

// --- Step 6: categories / keywords / payment ------------------------------

export const PAYMENT_OPTIONS = [
  "Visa",
  "Mastercard",
  "Amex",
  "EFTPOS",
  "Cash",
  "PayPal",
  "Apple Pay",
  "Google Pay",
  "Bank Transfer",
] as const;

export const taxonomySchema = z.object({
  gmbPrimary: z.string(),
  gmbAdditional: z.array(z.string()).max(9).default([]),
  appleCategories: z.array(z.string()).max(3).default([]),
  fbCategories: z.array(z.string()).max(3).default([]),
  birdeyeCategory: z.string(),
  birdeyeSubs: z.array(z.string()).max(3).default([]),
  services: z.string().max(1000).default(""),
  keywords: z.string().max(1000).default(""),
  products: z.string().max(1000).default(""),
  payment: z.array(z.enum(PAYMENT_OPTIONS)).default([]),
  appointmentLink: urlOpt,
  reservationLink: urlOpt,
  menuLink: urlOpt,
  orderAheadLink: urlOpt,
});

// --- Step 7: brand assets --------------------------------------------------

export const showcaseItemSchema = z.object({
  publicUrl: z.string(),
  category: z.enum(["EXTERIOR", "INTERIOR", "TEAMS", "ADDITIONAL"]),
  description: z.string().max(200),
  kind: z.enum(["photo", "video"]).default("photo"),
});

export const assetsSchema = z.object({
  logoUrl: z.string(),
  birdeyeCoverUrl: z.string(),
  googleCoverUrl: z.string().optional(),
  facebookCoverUrl: z.string().optional(),
  showcase: z.array(showcaseItemSchema).default([]),
});

// --- Step 8: social profiles ----------------------------------------------

export const socialSchema = z.object({
  google: urlOpt,
  facebook: urlOpt,
  instagram: urlOpt,
  x: urlOpt,
  linkedin: urlOpt,
  youtube: urlOpt,
  pinterest: urlOpt,
});

// --- Step 9: FAQs ----------------------------------------------------------

export const faqSchema = z.object({
  question: z.string(),
  answer: z.string(),
});
export const faqsSchema = z.array(faqSchema).default([]);

// --- Step 10: Webchat (Accelerate only) -----------------------------------

export const webchatSchema = z.object({
  websiteUrl: z.string().optional(),
  iconImage: urlOpt,
  bubbleMessage: z.string().default("Have a question? We're here to help!"),
  backgroundColor: z.string().default("#0D3F48"),
  iconColor: z.string().default("#FFFFFF"),
  playSound: z.boolean().default(true),
  headerColor: z.string().default("#0D3F48"),
  headerTextColor: z.string().default("#FFFFFF"),
  buttonColor: z.string().default("#E3F29C"),
  buttonTextColor: z.string().default("#0D3F48"),
  windowSize: z.enum(["Small", "Medium", "Large"]).default("Medium"),
  teamAvatar: urlOpt,
  agentName: z.string().default("Team"),
  headerLine: z.string().default("Hi there!"),
  welcomeMessage: z
    .string()
    .default("Questions? We are here to help! Send us a message below."),
  teamsEnabled: z.array(z.enum(["Sales", "Admin", "Support"])).default(["Sales"]),
  disclaimer: z.string().optional(),
  gaTrackingId: z.string().optional(),
});

// --- Step 11: Initial contacts --------------------------------------------

export const contactPermissionSchema = z
  .array(z.enum(["email", "text"]))
  .default(["email", "text"]);

export const contactSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().optional(),
  phone: z.string().optional(),
  permissions: contactPermissionSchema,
  tags: z.array(z.string()).default([]),
});
export const contactsSchema = z.array(contactSchema).max(50).default([]);

// --- The full wizard state -------------------------------------------------

export const wizardStateSchema = z.object({
  onboardingId: z.string(),
  packageId: z.enum(["foundations", "growth", "accelerate"]),
  status: z.enum(["draft", "submitted", "provisioned", "failed"]).default("draft"),
  createdAt: z.string(),
  updatedAt: z.string(),

  adminUser: userSchema,
  additionalUsers: z.array(userSchema).max(2).default([]),

  business: businessSchema,
  address: addressSchema,
  hours: hoursSchema,

  about: aboutSchema,
  descriptions: descriptionsSchema,

  taxonomy: taxonomySchema,
  assets: assetsSchema,
  social: socialSchema,
  faqs: faqsSchema,
  webchat: webchatSchema.optional(),
  contacts: contactsSchema,

  /** Populated as a provisioning run progresses. Every field beyond the
   *  original `invitedUsers`/`mediaIds`/`completedAt`/`businessNumber` is
   *  additive + optional, so existing JSONB rows keep parsing untouched.
   *
   *  `runStatus` is the granular per-run state (the top-level `status` stays
   *  the coarse lifecycle). A *partial* run still leaves `status:provisioned`
   *  — the Birdeye account exists — but flags `runStatus:partial` +
   *  `failedSteps` so the UI/ops know some steps need a retry. */
  provisioning: z
    .object({
      /** Internal id Birdeye returns from create_subaccount. */
      businessId: z.string().optional(),
      /** Value threaded into every later call (path, x-business-number,
       *  businessIds). May equal businessId until the live API says otherwise. */
      businessNumber: z.string().optional(),
      /** Idempotency anchor — equals onboardingId. Lets a retry/lookup find
       *  an already-created sub-account instead of duplicating it. */
      externalReferenceId: z.string().optional(),
      runStatus: z
        .enum(["idle", "running", "partial", "provisioned", "failed"])
        .optional(),
      /** Kind of the last step that ran (resume cursor). */
      lastStep: z.string().optional(),
      attempts: z.number().int().nonnegative().optional(),
      failedSteps: z
        .array(z.object({ kind: z.string(), error: z.string() }))
        .optional(),
      invitedUsers: z.array(z.string()).default([]),
      mediaIds: z.array(z.string()).default([]),
      completedAt: z.string().optional(),
      /** Run-lease expiry (ISO). Acquired atomically before any run so a
       *  user Resume, an ops re-run and the retry cron can never execute
       *  concurrently. A crashed run's lease simply expires. */
      lockedUntil: z.string().optional(),
      /** Who started the most recent run — provenance for the ops timeline. */
      lastRunBy: z.enum(["user", "ops", "cron"]).optional(),
    })
    .default({ invitedUsers: [], mediaIds: [] }),
});
export type WizardState = z.infer<typeof wizardStateSchema>;
export type Provisioning = WizardState["provisioning"];

// --- Step list -------------------------------------------------------------

export type StepKey =
  | "confirm"
  | "business"
  | "address"
  | "hours"
  | "about"
  | "taxonomy"
  | "assets"
  | "social"
  | "faqs"
  | "webchat"
  | "contacts"
  | "review"
  | "action-plan";

/** Who's running the wizard:
 *  - `provision` — paid user, terminal step provisions a real Birdeye account.
 *  - `report`    — free user, terminal step renders an action-plan + upgrade CTA.
 *  Derived from the subscription at render time; never persisted (a user can
 *  upgrade mid-flow). */
export type WizardMode = "provision" | "report";

export type StepDef = {
  key: StepKey;
  title: string;
  blurb: string;
  appliesTo?: (pkg: WizardState["packageId"]) => boolean;
};

export const STEPS: StepDef[] = [
  {
    key: "confirm",
    title: "Confirm package",
    blurb: "Quick check on what you bought and who's running the account.",
  },
  {
    key: "business",
    title: "Business identity",
    blurb: "The name, ABN and timezone we'll use everywhere.",
  },
  {
    key: "address",
    title: "Address & contact",
    blurb: "Where you are — or where you serve — and how customers reach you.",
  },
  {
    key: "hours",
    title: "Hours of operation",
    blurb:
      "Your hours appear on Google, Apple Maps, Facebook and Bing. Get them right once, here.",
  },
  {
    key: "about",
    title: "About your business",
    blurb: "Tell us your story so we can write your listing descriptions.",
  },
  {
    key: "taxonomy",
    title: "Categories & keywords",
    blurb: "How the listings networks classify and surface you.",
  },
  {
    key: "assets",
    title: "Brand assets",
    blurb: "Your logo, covers and showcase media — sized for every network.",
  },
  {
    key: "social",
    title: "Social profiles",
    blurb: "Existing pages we should link — leave blank what you don't have.",
  },
  {
    key: "faqs",
    title: "FAQs",
    blurb: "The questions customers ask before they buy.",
  },
  {
    key: "webchat",
    title: "Webchat",
    blurb: "Configure your AI webchat agent.",
    appliesTo: (p) => p === "accelerate",
  },
  {
    key: "contacts",
    title: "Initial contacts",
    blurb:
      "Optional — add up to 50 customers to start collecting reviews from.",
  },
  {
    key: "review",
    title: "Review & launch",
    blurb: "See exactly what we'll send to Birdeye, then go.",
  },
];

export const stepsForPackage = (pkg: WizardState["packageId"]): StepDef[] =>
  STEPS.filter((s) => !s.appliesTo || s.appliesTo(pkg));

// --- Report (free-tier) flow ----------------------------------------------
//
// Free users run a focused subset of the same step pages — the inputs that
// make a meaningful action plan — minus the provisioning-only steps (confirm
// package, assets uploads, webchat, contacts) and the launch step. The
// terminal step is `action-plan` instead of `review`.

const REPORT_STEP_KEYS: StepKey[] = [
  "business",
  "address",
  "hours",
  "about",
  "taxonomy",
  "social",
];

export const ACTION_PLAN_STEP: StepDef = {
  key: "action-plan",
  title: "Your action plan",
  blurb: "Your personalised local-growth plan, built from your answers.",
};

/** The ordered step list for a given mode. Provision mode is unchanged
 *  (`stepsForPackage`); report mode is the focused subset + `action-plan`. */
export const stepsFor = (
  mode: WizardMode,
  pkg: WizardState["packageId"],
): StepDef[] => {
  if (mode === "report") {
    return [
      ...STEPS.filter((s) => REPORT_STEP_KEYS.includes(s.key)),
      ACTION_PLAN_STEP,
    ];
  }
  return stepsForPackage(pkg);
};

/** Report-mode copy overrides. Free users share the paid step pages but never
 *  hear about Birdeye or provisioning — their flow ends in an action plan,
 *  not an account. StepShell resolves these over the page-supplied copy. */
export const REPORT_COPY: Partial<
  Record<StepKey, { title?: string; blurb?: string }>
> = {
  business: { blurb: "The basics we'll build your growth plan around." },
  address: {
    blurb:
      "Where you are — or where you serve — so we can assess your local visibility.",
  },
  hours: {
    blurb:
      "Your opening hours are a ranking signal on Google and Apple Maps — tell us yours.",
  },
  about: { blurb: "Tell us your story — it shapes your personalised recommendations." },
  taxonomy: { blurb: "How customers search for businesses like yours." },
  social: {
    blurb: "Where you already show up online — leave blank what you don't have.",
  },
};
