export const metadata = { title: "Testimonials" };

const TESTIMONIALS = [
  {
    quote: "Rented a lehenga for my sister's wedding and it looked brand new. Saved me so much compared to buying.",
    name: "Priya S.",
  },
  {
    quote: "The team helped me pick the right size over WhatsApp before I even placed the booking. Great service.",
    name: "Arjun M.",
  },
  {
    quote: "Loved that I could return it right after the event — no storage, no dry cleaning to worry about.",
    name: "Neha K.",
  },
];

export default function TestimonialsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Kind words</p>
      <h1 className="mt-2 text-3xl font-semibold">What our customers say</h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {TESTIMONIALS.map((t) => (
          <div key={t.name} className="rounded-lg border border-border p-5 text-sm">
            <p className="text-muted-foreground">&ldquo;{t.quote}&rdquo;</p>
            <p className="mt-3 font-medium">— {t.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
