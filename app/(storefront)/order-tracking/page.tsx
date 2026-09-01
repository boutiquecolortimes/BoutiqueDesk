import { OrderTracker } from "@/components/storefront/order-tracker";

export const metadata = { title: "Track your order" };

export default function OrderTrackingPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Order status</p>
      <h1 className="mt-2 text-3xl font-semibold">Track your booking</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your booking number and the phone number you used to check its status.
      </p>
      <div className="mt-8">
        <OrderTracker />
      </div>
    </div>
  );
}
