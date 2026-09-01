"use client";

import * as React from "react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { registerCustomer, type RegisterActionState } from "@/lib/actions/public";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<RegisterActionState, FormData>(registerCustomer, {});

  useEffect(() => {
    if (state.success) {
      toast.success("Account created — welcome!");
      router.push("/account");
      router.refresh();
    } else if (state.error) {
      toast.error(state.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] items-center justify-center px-4 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Already have one? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name" className="mb-1.5 block">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5 block">Email</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="phone" className="mb-1.5 block">Phone</Label>
              <Input id="phone" name="phone" required />
            </div>
            <div>
              <Label htmlFor="password" className="mb-1.5 block">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" disabled={pending} className="mt-2">
              {pending ? "Creating account…" : "Create account"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
