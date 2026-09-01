"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
    toast.success("Thanks — we'll get back to you shortly.");
  }

  if (sent) {
    return <p className="text-sm text-muted-foreground">Your message has been sent. We usually reply within a day.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div>
        <Label htmlFor="name" className="mb-1.5 block">Name</Label>
        <Input id="name" required />
      </div>
      <div>
        <Label htmlFor="email" className="mb-1.5 block">Email</Label>
        <Input id="email" type="email" required />
      </div>
      <div>
        <Label htmlFor="message" className="mb-1.5 block">Message</Label>
        <Textarea id="message" rows={4} required />
      </div>
      <Button type="submit">Send message</Button>
    </form>
  );
}
