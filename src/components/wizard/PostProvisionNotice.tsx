import * as React from "react";
import { InlineNotice } from "@/components/ui/notice";

// Shown above every wizard step when the user's Birdeye account is already
// live. Edits made here persist to Neon but do NOT auto-sync to Birdeye —
// honest banner pointing at the support channel.
export function PostProvisionNotice() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-6 md:px-6">
      <InlineNotice tone="warning" title="You're already provisioned.">
        Your Birdeye account is live, so changes you make here won&apos;t
        auto-sync. To update your business info in Birdeye, email{" "}
        <a
          href="mailto:hello@himayat.com.au"
          className="underline underline-offset-2"
        >
          hello@himayat.com.au
        </a>{" "}
        or update directly in your Birdeye dashboard.
      </InlineNotice>
    </div>
  );
}
