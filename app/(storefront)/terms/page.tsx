export const metadata = { title: "Terms" };

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Terms of service</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          By requesting a booking, you agree to return rented items in the condition they were
          provided, by the agreed end date. A refundable security deposit is held for each
          rental and returned after inspection.
        </p>
        <p>
          Late returns, damage, or loss may result in additional charges deducted from your
          deposit, as communicated by your store at the time of booking.
        </p>
        <p>
          Bookings are confirmed by the store after your request is submitted — availability is
          not guaranteed until confirmed.
        </p>
        <p className="text-xs">This is placeholder terms text — replace it with your business&apos;s actual terms before going live.</p>
      </div>
    </div>
  );
}
