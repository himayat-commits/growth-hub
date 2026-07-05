// Config-coherence health check for the provisioning pipeline.
// Auth: an ops user (OPS_EMAILS) OR ?secret= matching HEALTH_SECRET — the
// latter lets an uptime checker hit it headlessly (mirrors /api/revalidate).

import { getOpsUser } from "@/lib/auth/ops";
import { getProvisionMode } from "@/lib/birdeye/client";
import { runProvisioningHealthChecks } from "@/lib/ops/config-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = new URL(req.url).searchParams.get("secret");
  const secretOk = Boolean(process.env.HEALTH_SECRET) && secret === process.env.HEALTH_SECRET;
  if (!secretOk && !(await getOpsUser())) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks = runProvisioningHealthChecks();
  return Response.json({
    ok: checks.every((c) => c.level !== "fail"),
    mode: getProvisionMode(),
    checks,
  });
}
