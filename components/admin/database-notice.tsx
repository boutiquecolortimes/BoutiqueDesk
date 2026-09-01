import { DatabaseZap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export function DatabaseNotice({ message }: { message: string }) {
  return (
    <Card className="mx-auto mt-12 max-w-lg">
      <CardHeader className="items-center text-center">
        <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-secondary">
          <DatabaseZap className="size-5" />
        </div>
        <CardTitle>Database not connected</CardTitle>
        <CardDescription>
          Add <code className="rounded bg-muted px-1 py-0.5">MONGODB_URI</code> to your
          environment variables to see live data here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-xs text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
