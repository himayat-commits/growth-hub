import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function UpdateLater() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-2 pb-12 md:px-6 md:pt-4">
      <PageHeader
        kicker="After provisioning"
        title="Updating an existing Birdeye account"
      />
      <Card>
        <CardContent className="pt-6">
          <p className="leading-relaxed text-ink-muted">
            This onboarding flow handles first-time provisioning only. To
            update something later — new hours, fresh photos, additional
            service areas — sign in to your Birdeye dashboard directly, or
            email your Growth Hub partner with the change and we&apos;ll
            handle it.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="https://app.birdeye.com" target="_blank">
              <Button>Open Birdeye dashboard</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline">Back to dashboard</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
