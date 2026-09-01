export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Our story</p>
      <h1 className="mt-2 text-3xl font-semibold">About BoutiqueDesk</h1>
      <div className="prose prose-sm mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          We believe great outfits shouldn&apos;t sit in a closet after one wear. BoutiqueDesk
          brings together our boutique&apos;s stores under one roof, so you can browse, reserve,
          and rent pieces you&apos;ll love — without the price tag of buying them outright.
        </p>
        <p>
          Every item is inspected, cleaned, and cared for between rentals. Our team hand-checks
          fit, fabric, and finish before it ever reaches you, and again before it goes back on
          the rack.
        </p>
        <p>
          Whether you&apos;re dressing for a wedding, a festival, or just a night out, our stores
          are here to help you find the right piece for the moment.
        </p>
      </div>
    </div>
  );
}
