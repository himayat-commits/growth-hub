// Orchestrates the seven-step Birdeye provisioning sequence and streams
// progress to the browser via Server-Sent Events. The Birdeye API key
// never leaves the server.
//
// Stateless: the wizard state arrives in the request body (Vercel has a
// read-only filesystem). Provisioning logs go to console.log on Vercel,
// or to data/provisioning-log/{id}.json in local dev.

import { z } from "zod";
import { wizardStateSchema } from "@/lib/wizard/state";
import { appendProvisioningLog } from "@/lib/wizard/state-store";
import {
  buildCreateSubaccountPayload,
  buildUpdateBusinessPayload,
  buildAddMediaPayload,
  buildCreateUserPayloads,
  buildDefaultReviewSourcesPayload,
  buildContactPayloads,
  REQUEST_LABELS,
  type AssembledRequest,
} from "@/lib/birdeye/payloads";
import { callBirdeye, getMode } from "@/lib/birdeye/client";

const Body = z.object({ state: wizardStateSchema });

const RESELLER_ID = process.env.BIRDEYE_RESELLER_ID ?? "demo-reseller";
const API_HOST = process.env.BIRDEYE_API_HOST ?? "https://api.birdeye.com/resources";

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request — wizard state required in body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const state = parsed.data.state;
  const onboardingId = state.onboardingId;
  const mode = getMode();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (event: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));

      const total =
        2 +
        (state.assets.showcase.length ? 1 : 0) +
        state.additionalUsers.length +
        1 +
        state.contacts.length;

      let stepCounter = 1;
      const run = async (kind: AssembledRequest["kind"], req: AssembledRequest) => {
        const step = stepCounter++;
        send({
          step,
          total,
          kind,
          label: REQUEST_LABELS[kind],
          status: "running",
        });
        let result = await callBirdeye(req, { onboardingId, mode });
        if (!result.ok && result.status >= 500) {
          await new Promise((r) => setTimeout(r, 500));
          result = await callBirdeye(req, { onboardingId, mode });
        }
        await appendProvisioningLog(onboardingId, {
          step,
          kind,
          payload: req.req,
          response: result.response,
          ok: result.ok,
          error: result.error,
        });
        send({
          step,
          total,
          kind,
          label: REQUEST_LABELS[kind],
          status: result.ok ? "ok" : "error",
          response: result.response,
          error: result.error,
        });
        return result;
      };

      // Step 1: create sub-account
      const createReq = buildCreateSubaccountPayload(state, RESELLER_ID, API_HOST);
      const r1 = await run("create_subaccount", { kind: "create_subaccount", req: createReq });
      if (!r1.ok) {
        send({ status: "error", error: r1.error });
        controller.close();
        return;
      }
      const businessId =
        (r1.response as { businessId?: string; businessNumber?: string })?.businessId ??
        (r1.response as { businessId?: string; businessNumber?: string })?.businessNumber;
      if (!businessId) {
        send({ status: "error", error: "No businessId returned from create_subaccount" });
        controller.close();
        return;
      }
      const businessNumber = String(businessId);

      // Step 2: update business profile
      const updateReq = buildUpdateBusinessPayload(state, businessNumber, API_HOST);
      await run("update_business", { kind: "update_business", req: updateReq });

      // Step 3: showcase media (optional)
      const mediaReq = buildAddMediaPayload(state, businessNumber, API_HOST);
      const mediaIds: string[] = [];
      if (mediaReq) {
        const r = await run("add_media", { kind: "add_media", req: mediaReq });
        if (r.ok) {
          const ids = (r.response as { mediaIds?: string[] }).mediaIds ?? [];
          mediaIds.push(...ids);
        }
      }

      // Step 4: additional users
      const userReqs = buildCreateUserPayloads(state, businessNumber, API_HOST);
      const invitedUsers: string[] = [];
      for (const u of userReqs) {
        const r = await run("create_user", { kind: "create_user", req: u });
        if (r.ok) invitedUsers.push(u.body.userEmailId);
      }

      // Step 5: default review sources
      const reviewReq = buildDefaultReviewSourcesPayload(businessNumber, RESELLER_ID, API_HOST);
      await run("default_review_sources", {
        kind: "default_review_sources",
        req: reviewReq,
      });

      // Step 6: initial contacts
      const contactReqs = buildContactPayloads(state, businessNumber, API_HOST);
      for (const c of contactReqs) {
        await run("save_contact", { kind: "save_contact", req: c });
      }

      // Step 7: notify-ops for module entitlements & Webchat config
      try {
        const origin = req.headers.get("origin") ?? "";
        if (origin) {
          await fetch(`${origin}/api/notify-ops`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              state: {
                ...state,
                provisioning: { businessNumber, invitedUsers, mediaIds },
              },
            }),
          });
        }
      } catch {
        /* non-fatal */
      }

      send({ type: "done", businessNumber, invitedUsers, mediaIds });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
