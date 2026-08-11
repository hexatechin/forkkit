"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn } from "lucide-react";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("indocia-token", data.token);
      localStorage.setItem("indocia-user", JSON.stringify(data.user));
      localStorage.setItem("indocia-tenant", JSON.stringify(data.tenant));
      toast.success(`Welcome, ${data.user.name}`);
      router.push("/admin");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-rose-50 p-4">
      <Card className="w-full max-w-md p-8 shadow-xl">
        <Link href="/" className="text-xs text-muted-foreground">
          ← Back home
        </Link>
        <div className="mt-4 mb-6 text-center">
          <div className="inline-flex h-12 w-28 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-500 text-white text-xl font-black shadow-lg">
            <img
              src="/indocia.png"
              alt="Indocia"
              className="h-12 w-28 rounded-xl object-cover"
            />
          </div>
          <h1 className="mt-3 text-2xl font-bold">Indocia Admin</h1>
          <p className="text-sm text-muted-foreground">
            Sign in to manage your storefront
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              "Signing in..."
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Sign in
              </>
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
