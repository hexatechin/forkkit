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
            {/* <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              disabled={loading}
              onClick={handleGoogleLogin}
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M21.35 12.27c0-.79-.07-1.55-.2-2.27H12v4.3h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.42z"
                />
                <path
                  fill="#34A853"
                  d="M12 21.5c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.93-3.31.93-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.54 13.6a5.85 5.85 0 0 1 0-3.72V7.35H3.3a9.76 9.76 0 0 0 0 8.78l3.24-2.53z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.85c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 2.89 14.63 2 12 2a9.74 9.74 0 0 0-8.7 5.35l3.24 2.53C7.31 7.57 9.46 5.85 12 5.85z"
                />
              </svg>
              Continue with Google
            </Button> */}

            <div id="google-login" className="flex justify-center" />
          </form>
        </Card>
      </div>
    </>
  );
}
