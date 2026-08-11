"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Cake,
  ChefHat,
  Flower2,
  Gift,
  UtensilsCrossed,
  Store,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";

const TEMPLATES = [
  {
    id: "bakery",
    label: "Bakery",
    icon: Cake,
    color: "#a0522d",
    accent: "#d4a373",
    tint: "#fdf6ec",
  },
  {
    id: "home_baker",
    label: "Home baker",
    icon: ChefHat,
    color: "#c2410c",
    accent: "#fed7aa",
    tint: "#fff7ed",
  },
  {
    id: "florist",
    label: "Florist",
    icon: Flower2,
    color: "#db2777",
    accent: "#fbcfe8",
    tint: "#fdf2f8",
  },
  {
    id: "gift_shop",
    label: "Gift shop",
    icon: Gift,
    color: "#7c3aed",
    accent: "#ddd6fe",
    tint: "#faf5ff",
  },
  {
    id: "tiffin",
    label: "Tiffin service",
    icon: UtensilsCrossed,
    color: "#065f46",
    accent: "#a7f3d0",
    tint: "#ecfdf5",
  },
  {
    id: "cloud_kitchen",
    label: "Cloud kitchen",
    icon: Store,
    color: "#0f766e",
    accent: "#99f6e4",
    tint: "#f0fdfa",
  },
  {
    id: "office_space",
    label: "Office space",
    icon: Briefcase,
    color: "#1e40af",
    accent: "#bfdbfe",
    tint: "#eff6ff",
  },
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    template: "bakery",
    businessName: "",
    tagline: "",
    ownerName: "",
    email: "",
    password: "",
    whatsappNumber: "",
    phone: "",
    address: "",
  });
  const t = TEMPLATES.find((x) => x.id === f.template) || TEMPLATES[0];

  const set = (k, v) => setF({ ...f, [k]: v });

  const canNext = () => {
    if (step === 1) return !!f.template;
    if (step === 2) return f.businessName.trim().length > 1;
    if (step === 3)
      return (
        f.ownerName &&
        f.email.includes("@") &&
        f.password.length >= 6 &&
        f.whatsappNumber.length >= 6
      );
    return true;
  };

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(f),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signup failed");
      localStorage.setItem("indocia-token", data.token);
      localStorage.setItem("indocia-user", JSON.stringify(data.user));
      localStorage.setItem("indocia-tenant", JSON.stringify(data.tenant));
      toast.success("Storefront created 🎉");
      router.push("/admin?welcome=1");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:underline"
        >
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
          <h1 className="mt-3 text-3xl font-black">Create your storefront</h1>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-gradient-to-r from-orange-500 to-rose-500" : "bg-neutral-200"}`}
            />
          ))}
        </div>

        <Card className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold mb-1">
                  What kind of business?
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  We'll set up sample categories and a matching theme.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {TEMPLATES.map((x) => (
                    <button
                      key={x.id}
                      onClick={() => set("template", x.id)}
                      className={`p-4 rounded-xl border-2 text-left transition ${f.template === x.id ? "shadow-md" : "hover:border-neutral-300"}`}
                      style={
                        f.template === x.id
                          ? { borderColor: x.color, background: x.tint }
                          : { borderColor: "#e5e5e5" }
                      }
                    >
                      <x.icon className="h-6 w-6" style={{ color: x.color }} />
                      <div className="mt-2 font-semibold text-sm">
                        {x.label}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold mb-1">Business details</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  This will appear on your storefront.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label>Business name *</Label>
                    <Input
                      placeholder="e.g. Sweet Crumbs Bakery"
                      value={f.businessName}
                      onChange={(e) => set("businessName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Tagline (optional)</Label>
                    <Input
                      placeholder="Handcrafted with love"
                      value={f.tagline}
                      onChange={(e) => set("tagline", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Shop address (optional)</Label>
                    <Input
                      placeholder="Street, City"
                      value={f.address}
                      onChange={(e) => set("address", e.target.value)}
                    />
                  </div>
                </div>
                <div
                  className="mt-6 rounded-lg border p-3 flex items-center gap-3 text-sm"
                  style={{ background: t.tint, borderColor: t.color + "40" }}
                >
                  <t.icon className="h-5 w-5" style={{ color: t.color }} />
                  <div>
                    Your storefront will be at{" "}
                    <b>
                      /t/
                      {(f.businessName || "your-shop")
                        .toLowerCase()
                        .replace(/[^a-z0-9]+/g, "-")
                        .replace(/^-|-$/g, "") || "your-shop"}
                    </b>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-xl font-bold mb-1">
                  Your login & WhatsApp
                </h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Orders will be sent to this WhatsApp number.
                </p>
                <div className="space-y-4">
                  <div>
                    <Label>Your name *</Label>
                    <Input
                      value={f.ownerName}
                      onChange={(e) => set("ownerName", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={f.email}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Password *</Label>
                    <Input
                      type="password"
                      placeholder="min 6 characters"
                      value={f.password}
                      onChange={(e) => set("password", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>
                      WhatsApp number *{" "}
                      <span className="text-xs text-muted-foreground">
                        (with country code, digits only)
                      </span>
                    </Label>
                    <Input
                      placeholder="919812345678"
                      value={f.whatsappNumber}
                      onChange={(e) =>
                        set("whatsappNumber", e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                  <div>
                    <Label>Phone (optional)</Label>
                    <Input
                      value={f.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex items-center justify-between">
            {step > 1 ? (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}
            {step < 3 ? (
              <Button
                disabled={!canNext()}
                onClick={() => setStep(step + 1)}
                className="bg-gradient-to-r from-orange-500 to-rose-500"
              >
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                disabled={!canNext() || loading}
                onClick={submit}
                className="bg-gradient-to-r from-orange-500 to-rose-500"
              >
                {loading ? (
                  "Creating..."
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create storefront
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/admin/login" className="underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
