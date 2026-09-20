import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">UOCA Admin</CardTitle>
          <CardDescription>Sign in to manage projects, articles, and content.</CardDescription>
        </CardHeader>
        <CardContent>
          {error === "unauthorized" ? (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              That account isn&apos;t registered as an admin yet. Ask a Super Admin
              to grant access, then sign in again.
            </p>
          ) : null}
          {error === "oauth" ? (
            <p className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              Google sign-in failed. Please try again.
            </p>
          ) : null}
          <LoginForm next={next} />
        </CardContent>
      </Card>
    </div>
  );
}
