import { requireOwnerSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/connect";
import { Store } from "@/models/Store";
import { createStore, updateStore } from "@/lib/actions/stores";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { StoreDialog } from "@/components/admin/stores/store-dialog";
import { StoreActiveToggle } from "@/components/admin/stores/store-active-toggle";
import { DatabaseNotice } from "@/components/admin/database-notice";

export const metadata = { title: "Stores" };

export default async function StoresPage() {
  await requireOwnerSession();

  let stores: Awaited<ReturnType<typeof Store.find>> = [];
  try {
    await connectToDatabase();
    stores = await Store.find({}).sort({ createdAt: -1 });
  } catch (err) {
    return <DatabaseNotice message={err instanceof Error ? err.message : "Connection failed."} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stores</h1>
          <p className="text-sm text-muted-foreground">Every boutique location, in one place.</p>
        </div>
        <StoreDialog action={createStore} mode="create" />
      </div>

      <Card>
        <CardContent className="p-0">
          {stores.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No stores yet — add your first one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stores.map((store) => (
                  <TableRow key={String(store._id)}>
                    <TableCell className="font-medium">{store.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {[store.address?.city, store.address?.state].filter(Boolean).join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {store.phone || store.email || "—"}
                    </TableCell>
                    <TableCell>
                      <StoreActiveToggle storeId={String(store._id)} isActive={store.isActive} />
                    </TableCell>
                    <TableCell className="text-right">
                      <StoreDialog
                        mode="edit"
                        action={updateStore.bind(null, String(store._id))}
                        initial={{
                          name: store.name,
                          phone: store.phone ?? "",
                          email: store.email ?? "",
                          line1: store.address?.line1 ?? "",
                          line2: store.address?.line2 ?? "",
                          city: store.address?.city ?? "",
                          state: store.address?.state ?? "",
                          pincode: store.address?.pincode ?? "",
                        }}
                      />
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
