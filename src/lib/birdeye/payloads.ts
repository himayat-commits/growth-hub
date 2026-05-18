// Pure functions that turn wizard state into the exact JSON bodies the
// Birdeye reseller API expects. Every field here corresponds to a Birdeye
// API parameter from the supplied blueprint, and every value comes from a
// wizard field — nothing fabricated.
//
// All endpoints share host `https://api.birdeye.com/resources` with header
// `x-api-key: <BIRDEYE_API_KEY>`, applied server-side only.

import type { WizardState } from "@/lib/wizard/state";

const hhmm = (s: string) => s; // Birdeye accepts "HH:MM" strings as-is

// --- 1. Create sub-account ------------------------------------------------

export type CreateSubaccountRequest = {
  method: "POST";
  url: string;
  body: {
    businessName: string;
    zip: string;
    type: "Business";
    phone: string;
    countryCode: "AU";
    aggrOptions: 1;
  };
};

export function buildCreateSubaccountPayload(
  state: WizardState,
  resellerId: string,
  apiHost: string
): CreateSubaccountRequest {
  const url = `${apiHost}/v1/signup/reseller/subaccount?rid=${encodeURIComponent(
    resellerId
  )}&email_id=${encodeURIComponent(state.adminUser.email)}`;
  return {
    method: "POST",
    url,
    body: {
      businessName: state.business.name,
      zip: state.address.zip,
      type: "Business",
      phone: state.address.phone,
      countryCode: state.address.countryCode,
      aggrOptions: 1,
    },
  };
}

// --- 2. Update business profile -------------------------------------------

export type UpdateBusinessRequest = {
  method: "PUT";
  url: string;
  body: Record<string, unknown>;
};

export function buildUpdateBusinessPayload(
  state: WizardState,
  businessId: string,
  apiHost: string
): UpdateBusinessRequest {
  const a = state.address;
  const b = state.business;
  const t = state.taxonomy;
  const d = state.descriptions;
  const s = state.social;
  const assets = state.assets;
  const h = state.hours;

  const body: Record<string, unknown> = {
    name: b.name,
    alias: b.alias,
    isAddressHidden: a.isAddressHidden ? 1 : 0,
    location: {
      address1: a.address1,
      address2: a.address2,
      subLocality: a.subLocality,
      city: a.city,
      state: a.state,
      countryCode: "AU",
      zip: a.zip,
    },
    emailId: a.emailId,
    phone: a.phone,
    fax: a.fax,
    websiteUrl: a.websiteUrl,
    establishedYear: b.establishedYear,
    timezone: b.timezone,
    languages: b.languages,
    isServiceAreaProvider: a.isServiceAreaProvider ? "Yes" : "No",
    serviceAreas: a.serviceAreas.map((description) => ({ description })),
    working24x7: h.is24x7 ? 1 : 0,
    hoursOfOperations: h.weekly.map((day) => ({
      day: day.index,
      isOpen: day.isOpen ? 1 : 0,
      workingHours: day.windows.map((w) => ({
        startHour: hhmm(w.start),
        endHour: hhmm(w.end),
      })),
      comment: day.comment ?? "",
    })),
    specialHours: h.special.map((sp) => ({
      specialDate: sp.date,
      startHour: sp.start ?? "",
      endHour: sp.end ?? "",
      isOpen: sp.isOpen ? 1 : 0,
    })),
    businessStatus: h.status,
    reopenDate: h.reopenDate,
    services: t.services,
    keywords: t.keywords,
    products: t.products,
    appointmentLink: t.appointmentLink,
    reservationLink: t.reservationLink,
    menuLink: t.menuLink,
    orderAheadLink: t.orderAheadLink,
    payment: t.payment.join(", "),
    localPhoneNumber: a.localPhoneNumber,
    tollFreePhoneNumber: a.tollFreePhoneNumber,
    logoUrl: assets.logoUrl,
    coverImageUrl: assets.birdeyeCoverUrl,
    gmbCover: assets.googleCoverUrl,
    facebookCover: assets.facebookCoverUrl,
    coverBusinessInfoLayout: "In grid cover image, business info overlay",
    internalListing: {
      description: d.birdeye,
      category: t.birdeyeCategory,
      subcategory1: t.birdeyeSubs[0],
      subcategory2: t.birdeyeSubs[1],
      subcategory3: t.birdeyeSubs[2],
      displayCategory: t.birdeyeCategory,
    },
    facebookListing: {
      category1Fb: t.fbCategories[0],
      category2Fb: t.fbCategories[1],
      category3Fb: t.fbCategories[2],
      facebookDescription: d.facebook,
      facebookPhoneNumber: a.phone,
    },
    gmbListing: {
      googleWebsiteUrl: a.websiteUrl,
      primaryCategoryGmb: t.gmbPrimary,
      additionalCategory1Gmb: t.gmbAdditional[0],
      additionalCategory2Gmb: t.gmbAdditional[1],
      additionalCategory3Gmb: t.gmbAdditional[2],
      additionalCategory4Gmb: t.gmbAdditional[3],
      additionalCategory5Gmb: t.gmbAdditional[4],
      additionalCategory6Gmb: t.gmbAdditional[5],
      additionalCategory7Gmb: t.gmbAdditional[6],
      additionalCategory8Gmb: t.gmbAdditional[7],
      additionalCategory9Gmb: t.gmbAdditional[8],
      googleDescription: d.google,
      googlePhoneNumber: a.phone,
    },
    socialProfileURLs: {
      googleUrl: s.google,
      facebookUrl: s.facebook,
      twitterUrl: s.x,
      linkedinUrl: s.linkedin,
      youTubeUrl: s.youtube,
      instagramUrl: s.instagram,
      pintrestUrl: s.pinterest,
    },
    isSEOEnabled: "true",
    externalReferenceId: state.onboardingId,
    customFields: b.abn
      ? [{ fieldName: "ABN", type: "text", fieldValue: b.abn, id: 0 }]
      : [],
  };

  return {
    method: "PUT",
    url: `${apiHost}/v1/business/${encodeURIComponent(businessId)}`,
    body,
  };
}

// --- 3. Add showcase media ------------------------------------------------

export type AddMediaRequest = {
  method: "POST";
  url: string;
  body: {
    media: Array<{
      url: string;
      mediaCategory: "EXTERIOR" | "INTERIOR" | "TEAMS" | "ADDITIONAL";
      description: string;
      mediaFormat: "PHOTO" | "VIDEO";
    }>;
  };
};

export function buildAddMediaPayload(
  state: WizardState,
  businessNumber: string,
  apiHost: string
): AddMediaRequest | null {
  if (!state.assets.showcase.length) return null;
  return {
    method: "POST",
    url: `${apiHost}/v1/business/${encodeURIComponent(businessNumber)}/upload/media`,
    body: {
      media: state.assets.showcase.map((m) => ({
        url: m.publicUrl,
        mediaCategory: m.category,
        description: m.description,
        mediaFormat: m.kind === "video" ? "VIDEO" : "PHOTO",
      })),
    },
  };
}

// --- 4. Create additional users -------------------------------------------

export type CreateUserRequest = {
  method: "POST";
  url: string;
  headers: { "x-business-number": string };
  body: {
    firstName: string;
    lastName: string;
    userEmailId: string;
    phone: string;
    userRole: "admin" | "owner";
    sendInvite: true;
  };
};

export function buildCreateUserPayloads(
  state: WizardState,
  businessNumber: string,
  apiHost: string
): CreateUserRequest[] {
  return state.additionalUsers.map((u) => ({
    method: "POST",
    url: `${apiHost}/v1/user/signup/v2`,
    headers: { "x-business-number": businessNumber },
    body: {
      firstName: u.firstName,
      lastName: u.lastName,
      userEmailId: u.email,
      phone: u.phone,
      userRole: u.role,
      sendInvite: true,
    },
  }));
}

// --- 5. Default review sources --------------------------------------------

export type DefaultReviewSourcesRequest = {
  method: "POST";
  url: string;
  body: { resellerId: string; businessIds: [string] };
};

export function buildDefaultReviewSourcesPayload(
  businessNumber: string,
  resellerId: string,
  apiHost: string
): DefaultReviewSourcesRequest {
  return {
    method: "POST",
    url: `${apiHost}/v1/campaign/external/default-review-sources`,
    body: { resellerId, businessIds: [businessNumber] },
  };
}

// --- 6. Initial contacts --------------------------------------------------

export type SaveContactRequest = {
  method: "POST";
  url: string;
  headers: { "x-business-number": string };
  body: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    countryCode: "AU";
    smsOptin: boolean;
    businessIds: [string];
    emailPreferences: { marketingOptin: boolean; feedbackOptin: true; serviceOptin: true };
    smsPreferences: { marketingOptin: boolean; feedbackOptin: true; serviceOptin: true };
  };
};

export function buildContactPayloads(
  state: WizardState,
  businessNumber: string,
  apiHost: string
): SaveContactRequest[] {
  return state.contacts.map((c) => ({
    method: "POST",
    url: `${apiHost}/v1/contact/external/preferences/saveCustomer`,
    headers: { "x-business-number": businessNumber },
    body: {
      firstName: c.firstName,
      lastName: c.lastName,
      email: c.email || undefined,
      phone: c.phone || undefined,
      countryCode: "AU",
      smsOptin: c.permissions.includes("text"),
      businessIds: [businessNumber],
      emailPreferences: {
        marketingOptin: c.permissions.includes("email"),
        feedbackOptin: true,
        serviceOptin: true,
      },
      smsPreferences: {
        marketingOptin: c.permissions.includes("text"),
        feedbackOptin: true,
        serviceOptin: true,
      },
    },
  }));
}

// --- Webchat embed snippet (Accelerate only) ------------------------------

export function buildWebchatEmbedSnippet(businessNumber: string): string {
  return `<script src="https://app.birdeye.com/webchat.js" data-bid="${businessNumber}"></script>`;
}

// --- Master assembly ------------------------------------------------------

export type AssembledRequest =
  | { kind: "create_subaccount"; req: CreateSubaccountRequest }
  | { kind: "update_business"; req: UpdateBusinessRequest }
  | { kind: "add_media"; req: AddMediaRequest }
  | { kind: "create_user"; req: CreateUserRequest }
  | { kind: "default_review_sources"; req: DefaultReviewSourcesRequest }
  | { kind: "save_contact"; req: SaveContactRequest };

export function assembleAllPayloads(
  state: WizardState,
  resellerId: string,
  apiHost: string,
  businessId = "{businessNumber}"
): AssembledRequest[] {
  const reqs: AssembledRequest[] = [];
  reqs.push({
    kind: "create_subaccount",
    req: buildCreateSubaccountPayload(state, resellerId, apiHost),
  });
  reqs.push({
    kind: "update_business",
    req: buildUpdateBusinessPayload(state, businessId, apiHost),
  });
  const media = buildAddMediaPayload(state, businessId, apiHost);
  if (media) reqs.push({ kind: "add_media", req: media });
  for (const u of buildCreateUserPayloads(state, businessId, apiHost)) {
    reqs.push({ kind: "create_user", req: u });
  }
  reqs.push({
    kind: "default_review_sources",
    req: buildDefaultReviewSourcesPayload(businessId, resellerId, apiHost),
  });
  for (const c of buildContactPayloads(state, businessId, apiHost)) {
    reqs.push({ kind: "save_contact", req: c });
  }
  return reqs;
}

export const REQUEST_LABELS: Record<AssembledRequest["kind"], string> = {
  create_subaccount: "Create Birdeye sub-account",
  update_business: "Update business profile",
  add_media: "Upload showcase media",
  create_user: "Invite additional user",
  default_review_sources: "Set default review sources",
  save_contact: "Save customer contact",
};
