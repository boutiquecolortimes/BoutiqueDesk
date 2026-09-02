import { requireOwnerSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Store } from "@/models/Store";
import { inviteTeamMember, updateTeamMember } from "@/lib/actions/team";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { TeamDialog } from "@/components/admin/team/team-dialog";
import { TeamActiveToggle } from "@/components/admin/team/team-active-toggle";
import { DatabaseNotice } from "@/components/admin/database-notice";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const session = await requireOwnerSession();

  let members: Awaited<ReturnType<typeof User.find>> = [];
  let stores: { id: string; name: string }[] = [];
  try {
    await connectToDatabase();
    const [memberDocs, storeDocs] = await Promise.all([
      User.find({ organization: session.orgId, role: { $in: ["admin", "staff"] } }).sort({ createdAt: -1 }),
      Store.find({ organization: session.orgId, isActive: true }).sort({ name: 1 }),
    ]);
    members = memberDocs;
    stores = storeDocs.map((s) => ({ id: String(s._id), name: s.name }));
  } catch (err) {
    return <DatabaseNotice message={err instanceof Error ? err.message : "Connection failed."} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Team</h1>
          <p className="text-sm text-muted-foreground">Staff and admins across your stores.</p>
        </div>
        <TeamDialog action={inviteTeamMember} mode="create" stores={stores} />
      </div>

      <Card>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No team members yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Stores</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const memberStoreIds = member.storeIds.map((id) => String(id));
                  const memberStoreNames = stores
                    .filter((s) => memberStoreIds.includes(s.id))
                    .map((s) => s.name);
                  return (
                    <TableRow key={String(member._id)}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell className="text-muted-foreground">{member.email}</TableCell>
                      <TableCell className="capitalize">{member.role}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {memberStoreNames.join(", ") || "—"}
                      </TableCell>
                      <TableCell>
                        <TeamActiveToggle userId={String(member._id)} isActive={member.isActive} />
                      </TableCell>
                      <TableCell className="text-right">
                        <TeamDialog
                          mode="edit"
                          action={updateTeamMember.bind(null, String(member._id))}
                          stores={stores}
                          initial={{
                            name: member.name,
                            email: member.email,
                            phone: member.phone ?? "",
                            role: member.role as "admin" | "staff",
                            storeIds: memberStoreIds,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
