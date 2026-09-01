import Image from "next/image";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";

export const metadata = { title: "Gallery" };

export default async function GalleryPage() {
  let images: { src: string; alt: string }[] = [];
  try {
    await connectToDatabase();
    const products = await Product.find({ isPubliclyVisible: true, "images.0": { $exists: true } })
      .select("name images")
      .limit(24)
      .sort({ createdAt: -1 });
    images = products.flatMap((p) => p.images.slice(0, 1).map((src) => ({ src, alt: p.name })));
  } catch {
    // degrade gracefully
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Lookbook</p>
      <h1 className="mt-2 text-3xl font-semibold">Gallery</h1>
      <p className="mt-2 text-sm text-muted-foreground">A peek at what&apos;s in the collection.</p>

      {images.length === 0 ? (
        <p className="mt-12 text-center text-sm text-muted-foreground">Photos coming soon.</p>
      ) : (
        <div className="mt-8 columns-2 gap-3 sm:columns-3 md:columns-4 [&>*]:mb-3">
          {images.map((img, i) => (
            <div key={i} className="relative overflow-hidden rounded-lg bg-muted">
              <Image src={img.src} alt={img.alt} width={400} height={500} className="w-full object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
