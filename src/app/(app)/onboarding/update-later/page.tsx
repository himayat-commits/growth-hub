import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SectionLabel,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/brand/Logo";

export default function UpdateLater() {
  return (
    <main className="min-h-screen">
      <header className="bg-eggshell/85 border-b border-teal/10 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-5">
          <Logo />
        </div>
      </header>
      <section className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <Card>
          <CardHeader>
            <SectionLabel>After provisioning</SectionLabel>
            <CardTitle className="font-serif text-3xl mt-3">
              Updating an existing Birdeye account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-ink-muted leading-relaxed">
              This onboarding flow handles first-time provisioning only. To
              update something later — new hours, fresh photos, additional
              service areas — sign in to your Birdeye dashboard directly, or
              email your Growth Hub partner with the change and we&apos;ll
              handle it.
            </p>
            <div className="mt-7 flex gap-3">
              <Link href="https://app.birdeye.com" target="_blank">
                <Button>Open Birdeye dashboard</Button>
              </Link>
              <Link href="/portal">
                <Button variant="outline">Back to portal</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
