import { Phone, Mail, MapPin } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { Store } from "@/models/Store";
import { ContactForm } from "@/components/storefront/contact-form";

export const metadata = { title: "Contact" };

export default async function ContactPage() {
  let stores: Awaited<ReturnType<typeof Store.find>> = [];
  try {
    await connectToDatabase();
    stores = await Store.find({ isActive: true }).sort({ name: 1 });
  } catch {
    // degrade gracefully
  }

  return (
    <div className="mx-auto grid max-w-4xl gap-10 px-4 py-16 md:grid-cols-2">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Get in touch</p>
        <h1 className="mt-2 text-3xl font-semibold">Contact us</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Questions about sizing, availability, or an upcoming order? Reach out — or drop by one
          of our stores.
        </p>

        <div className="mt-6 flex flex-col gap-4">
          {stores.length === 0 ? (
            <p className="text-sm text-muted-foreground">Store details coming soon.</p>
          ) : (
            stores.map((store) => (
              <div key={String(store._id)} className="rounded-lg border border-border p-4 text-sm">
                <p className="font-medium">{store.name}</p>
                {store.address?.city && (
                  <p className="mt-1 flex items-start gap-1.5 text-muted-foreground">
                    <MapPin className="mt-0.5 size-3.5 shrink-0" />
                    {[store.address.line1, store.address.city, store.address.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {store.phone && (
                  <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="size-3.5 shrink-0" /> {store.phone}
                  </p>
                )}
                {store.email && (
                  <p className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                    <Mail className="size-3.5 shrink-0" /> {store.email}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Send us a message</h2>
        <ContactForm />
      </div>
    </div>
  );
}
