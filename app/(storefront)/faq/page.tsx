export const metadata = { title: "FAQ" };

const FAQS = [
  {
    q: "How does renting work?",
    a: "Browse the collection, pick your size and dates, and submit a request. Our team confirms availability and collects the deposit before your pickup or delivery.",
  },
  {
    q: "What if the item doesn't fit?",
    a: "Let us know as soon as it arrives — most stores offer a size exchange if the replacement is available for your dates.",
  },
  {
    q: "Is the security deposit refundable?",
    a: "Yes. It's refunded once the item is returned in its original condition, minus any cleaning or damage charges if applicable.",
  },
  {
    q: "How long can I keep an item?",
    a: "Rental periods are flexible — set your own start and end dates when requesting a booking. Extensions can be arranged directly with your store.",
  },
  {
    q: "Do you deliver?",
    a: "Delivery availability depends on your store — ask when confirming your booking, or check with them directly.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Help</p>
      <h1 className="mt-2 text-3xl font-semibold">Frequently asked questions</h1>
      <div className="mt-8 flex flex-col divide-y divide-border rounded-lg border border-border">
        {FAQS.map((item) => (
          <details key={item.q} className="group p-4">
            <summary className="cursor-pointer list-none text-sm font-medium marker:content-none">
              {item.q}
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
