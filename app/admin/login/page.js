"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
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

  const handleGoogleLogin = async (credential) => {
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/google", {
        method: "POST",
        body: JSON.stringify({
          credential,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error("Google login failed");
      }

      // Same storage as normal login
      localStorage.setItem("indocia-token", data.token);

      localStorage.setItem("indocia-user", JSON.stringify(data.user));

      localStorage.setItem("indocia-tenant", JSON.stringify(data.tenant));

      toast.success(`Welcome, ${data.user.name}`);

      router.push("/admin");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Google login failed",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeGoogle = () => {
      if (!window.google) return;

      const container = document.getElementById("google-login");

      if (!container) return;

      // Prevent duplicate Google buttons
      container.innerHTML = "";

      window.google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,

        callback: (response) => {
          handleGoogleLogin(response.credential);
        },
      });

      window.google.accounts.id.renderButton(container, {
        theme: "outline",
        size: "large",
        width: 400,
        text: "continue_with",
        shape: "rectangular",
      });
    };

    // Google script may already be loaded
    if (window.google) {
      initializeGoogle();
      return;
    }

    // Wait for script
    const timer = setInterval(() => {
      if (window.google) {
        clearInterval(timer);
        initializeGoogle();
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
      />

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
                maxLength={50}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={password}
                maxLength={20}
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
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>

              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <div
              id="google-login"
              className="w-full flex justify-center overflow-hidden"
            />
          </form>
        </Card>
      </div>
    </>
  );
}
