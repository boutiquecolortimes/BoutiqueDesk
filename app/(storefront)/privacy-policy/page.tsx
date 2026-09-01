export const metadata = { title: "Privacy Policy" };

export default function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-2xl font-semibold">Privacy policy</h1>
      <div className="mt-6 flex flex-col gap-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          We collect the information you provide when creating an account or requesting a
          booking — your name, phone number, email, and rental details — to process your
          order and communicate with you about it.
        </p>
        <p>
          We do not sell your personal information to third parties. Your data is used only to
          operate BoutiqueDesk: managing bookings, inventory, and store communication.
        </p>
        <p>
          You can request access to, correction of, or deletion of your personal data at any
          time by contacting the store you rented from.
        </p>
        <p className="text-xs">This is placeholder policy text — replace it with your business&apos;s actual terms before going live.</p>
      </div>
    </div>
  );
}
