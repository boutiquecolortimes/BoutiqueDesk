"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createOrganization, type OnboardingActionState } from "@/lib/actions/onboarding";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/header";
import { MarketingFooter } from "@/components/marketing/footer";

export default function GetStartedPage() {
  const [state, formAction, pending] = useActionState<OnboardingActionState, FormData>(
    createOrganization,
    {}
  );

  useEffect(() => {
    if (state.success && state.loginUrl) {
      toast.success("Your BoutiqueDesk is ready — redirecting you to sign in.");
      window.location.href = state.loginUrl;
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="flex min-h-dvh flex-col">
      <MarketingHeader />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Free for 1 day</p>
          <h1 className="mt-2 text-2xl font-semibold">Start your BoutiqueDesk</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Set up your business, invite your team, and start taking bookings today.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create your business</CardTitle>
            <CardDescription>
              Already have an account? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={formAction} className="flex flex-col gap-4">
              <div>
                <Label htmlFor="businessName" className="mb-1.5 block">Business name</Label>
                <Input id="businessName" name="businessName" placeholder="e.g. Meera's Boutique" required />
              </div>
              <div>
                <Label htmlFor="ownerName" className="mb-1.5 block">Your name</Label>
                <Input id="ownerName" name="ownerName" required />
              </div>
              <div>
                <Label htmlFor="email" className="mb-1.5 block">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div>
                <Label htmlFor="phone" className="mb-1.5 block">Phone (optional)</Label>
                <Input id="phone" name="phone" />
              </div>
              <div>
                <Label htmlFor="password" className="mb-1.5 block">Password</Label>
                <Input id="password" name="password" type="password" required />
              </div>
              <Button type="submit" disabled={pending} className="mt-2">
                {pending ? "Setting up your boutique…" : "Start my free trial"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                1 day free, no card required. Then choose a plan that fits.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
      <MarketingFooter />
    </div>
  );
}
