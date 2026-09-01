export const metadata = { title: "Blog" };

export default function BlogPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Journal</p>
      <h1 className="mt-2 text-3xl font-semibold">Our blog</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Styling guides, care tips, and stories from our stores are coming soon.
      </p>
    </div>
  );
}
