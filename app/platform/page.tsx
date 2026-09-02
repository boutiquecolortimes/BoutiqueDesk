import { requirePlatformSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { Organization, ORG_PLANS, ORG_PLAN_STATUSES } from "@/models/Organization";
import { updateOrganizationPlan } from "@/lib/actions/platform";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { ROOT_DOMAIN } from "@/lib/tenant-shared";
import { DatabaseNotice } from "@/components/admin/database-notice";

export const metadata = { title: "Platform" };

export default async function PlatformPage() {
  await requirePlatformSession();

  let orgs: Awaited<ReturnType<typeof Organization.find>> = [];
  try {
    await connectToDatabase();
    orgs = await Organization.find({}).sort({ createdAt: -1 });
  } catch (err) {
    return <DatabaseNotice message={err instanceof Error ? err.message : "Connection failed."} />;
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10">
      <div>
        <h1 className="text-xl font-semibold">Platform — Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Every boutique signed up on BoutiqueDesk. Flip plan/status here until billing is wired up.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {orgs.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No organizations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Business</TableHead>
                  <TableHead>Subdomain</TableHead>
                  <TableHead>Trial ends</TableHead>
                  <TableHead>Plan / Status</TableHead>
                  <TableHead className="text-right">Update</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgs.map((org) => (
                  <TableRow key={String(org._id)}>
                    <TableCell className="font-medium">{org.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.slug}.{ROOT_DOMAIN}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {org.trialEndsAt ? formatDate(String(org.trialEndsAt)) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="mr-1 capitalize">{org.plan}</Badge>
                      <Badge variant={org.planStatus === "active" ? "success" : "secondary"} className="capitalize">
                        {org.planStatus}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <form
                        action={updateOrganizationPlan.bind(null, String(org._id))}
                        className="flex items-center justify-end gap-2"
                      >
                        <select name="plan" defaultValue={org.plan} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                          {ORG_PLANS.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                        <select name="planStatus" defaultValue={org.planStatus} className="rounded-md border border-input bg-background px-2 py-1 text-xs">
                          {ORG_PLAN_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        <button type="submit" className="rounded-md border border-input px-2 py-1 text-xs font-medium hover:bg-secondary">
                          Save
                        </button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
