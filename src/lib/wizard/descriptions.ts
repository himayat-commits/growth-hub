// Auto-compose listing description variants from the step-5 questionnaire.
// Previews are editable on step 5 — these are starting points, not final copy.

import type { z } from "zod";
import type { aboutSchema, businessSchema } from "@/lib/wizard/state";

type About = z.infer<typeof aboutSchema>;
type Business = z.infer<typeof businessSchema>;

const truncate = (s: string, max: number) =>
  s.length <= max ? s : s.slice(0, Math.max(0, max - 1)).trimEnd() + "…";

export function composeDescriptions(business: Business, about: About) {
  const name = business.name || "Our business";

  const birdeye = [
    `${name} — ${about.vision}`.trim(),
    `What we offer: ${about.offerings}`,
    `What makes us different: ${about.usp}`,
    `Who we're for: ${about.idealCustomer}`,
    `Why customers choose us: ${about.benefits}`,
    `Our edge: ${about.competitorEdge}`,
    `Ready to take the next step? ${about.cta}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const googleRaw =
    `${name} — ${about.vision}. We offer ${about.offerings}. ` +
    `${about.usp} ${about.benefits} ${about.cta}`;
  const google = truncate(googleRaw.replace(/\s+/g, " ").trim(), 750);

  const facebookRaw = `${name}: ${about.usp} ${about.cta}`
    .replace(/\s+/g, " ")
    .trim();
  const facebook = truncate(facebookRaw, 255);

  const appleRaw =
    `${name} — ${about.vision}. ${about.offerings}. ` +
    `Why we're different: ${about.usp}. ${about.cta}`;
  const apple = truncate(appleRaw.replace(/\s+/g, " ").trim(), 1000);

  return {
    birdeye: truncate(birdeye, 5000),
    google,
    facebook,
    apple,
  };
}
