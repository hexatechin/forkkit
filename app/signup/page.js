"use client";

import { useEffect, useState } from "react";
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
  Utensils,
  Store,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  Check,
  Leaf,
  Loader2,
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
    id: "restaurant",
    label: "Restaurant",
    icon: Utensils,
    color: "#b91c1c",
    accent: "#fca5a5",
    tint: "#fef2f2",
  },
  {
    id: "fresh_market",
    label: "Fruits & Vegetables",
    icon: Leaf,
    color: "#16a34a",
    accent: "#93dfa4",
    tint: "#f0fdf4",
  },

  // {
  //   id: "florist",
  //   label: "Florist",
  //   icon: Flower2,
  //   color: "#db2777",
  //   accent: "#fbcfe8",
  //   tint: "#fdf2f8",
  // },

  // {
  //   id: "gift_shop",
  //   label: "Gift shop",
  //   icon: Gift,
  //   color: "#7c3aed",
  //   accent: "#ddd6fe",
  //   tint: "#faf5ff",
  // },

  // {
  //   id: "office_space",
  //   label: "Office space",
  //   icon: Briefcase,
  //   color: "#1e40af",
  //   accent: "#bfdbfe",
  //   tint: "#eff6ff",
  // },
];

const INITIAL_FORM = {
  template: "bakery",
  businessName: "",
  slug: "",
  tagline: "",
  ownerName: "",
  email: "",
  password: "",
  confirmPassword: "",
  whatsappNumber: "",
  phone: "",
  address: "",
};

const DRAFT_KEY = "indocia-signup-draft";
const STEP_KEY = "indocia-signup-step";

export default function SignupPage() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugError, setSlugError] = useState("");

  const [f, setF] = useState(INITIAL_FORM);

  const [isHydrated, setIsHydrated] = useState(false);

  const t = TEMPLATES.find((x) => x.id === f.template) || TEMPLATES[0];

  // ============================================================
  // SET FIELD
  // ============================================================

  const set = (k, v) => {
    setF((prev) => ({
      ...prev,
      [k]: v,
    }));
  };

  // ============================================================
  // SLUGIFY
  // Allows letters, numbers and "-"
  // ============================================================

  const slugify = (value) => {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
  };

  // ============================================================
  // CHECK SLUG
  // ============================================================

  const checkSlug = async (value) => {
    const slug = slugify(value);

    setF((prev) => ({
      ...prev,
      slug,
    }));

    setSlugAvailable(null);
    setSlugError("");

    if (!slug) {
      setSlugChecking(false);
      return;
    }

    if (slug.length < 3) {
      setSlugAvailable(false);
      setSlugError("Slug must be at least 3 characters");
      setSlugChecking(false);
      return;
    }

    setSlugChecking(true);

    try {
      const res = await fetch(
        `/api/check-slug?slug=${encodeURIComponent(slug)}`,
      );

      const data = await res.json();

      if (!res.ok) {
        setSlugAvailable(false);
        setSlugError(data.error || "Unable to check slug");
        return;
      }

      setSlugAvailable(data.available);
      setSlugError(data.error || "");
    } catch (e) {
      console.error("Slug check error:", e);

      setSlugAvailable(false);
      setSlugError("Unable to check storefront name");
    } finally {
      setSlugChecking(false);
    }
  };

  // ============================================================
  // RESTORE SAVED FORM AFTER REFRESH
  // ============================================================

  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      const savedStep = localStorage.getItem(STEP_KEY);

      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);

        setF({
          ...INITIAL_FORM,
          ...parsed,
        });
      }

      if (savedStep) {
        const parsedStep = Number(savedStep);

        if (parsedStep >= 1 && parsedStep <= 3) {
          setStep(parsedStep);
        }
      }
    } catch (error) {
      console.error("Failed to restore signup draft:", error);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // ============================================================
  // SAVE FORM AUTOMATICALLY
  // ============================================================

  useEffect(() => {
    if (!isHydrated) return;

    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(f));
      localStorage.setItem(STEP_KEY, String(step));
    } catch (error) {
      console.error("Failed to save signup draft:", error);
    }
  }, [f, step, isHydrated]);

  // ============================================================
  // RECHECK SLUG AFTER REFRESH
  // ============================================================

  useEffect(() => {
    if (!isHydrated || !f.slug) return;

    const slug = slugify(f.slug);

    if (!slug || slug.length < 3) {
      return;
    }

    let cancelled = false;

    const timer = setTimeout(async () => {
      if (cancelled) return;

      setSlugChecking(true);
      setSlugAvailable(null);
      setSlugError("");

      try {
        const res = await fetch(
          `/api/check-slug?slug=${encodeURIComponent(slug)}`,
        );

        const data = await res.json();

        if (cancelled) return;

        if (!res.ok) {
          setSlugAvailable(false);
          setSlugError(data.error || "Unable to check slug");
          return;
        }

        setSlugAvailable(data.available);
        setSlugError(data.error || "");
      } catch (error) {
        if (cancelled) return;

        console.error("Slug check error:", error);

        setSlugAvailable(false);
        setSlugError("Unable to check storefront name");
      } finally {
        if (!cancelled) {
          setSlugChecking(false);
        }
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [isHydrated]);

  // ============================================================
  // NEXT VALIDATION
  // ============================================================

  const canNext = () => {
    if (step === 1) {
      return !!f.template;
    }

    if (step === 2) {
      return (
        f.businessName.trim().length > 1 &&
        f.slug.trim().length >= 3 &&
        slugAvailable === true &&
        !slugChecking
      );
    }

    if (step === 3) {
      return (
        f.ownerName.trim().length > 0 &&
        f.email.trim().includes("@") &&
        f.password.length >= 6 &&
        f.confirmPassword.length >= 6 &&
        f.password === f.confirmPassword &&
        f.whatsappNumber.length >= 10 &&
        (f.phone ? f.phone.length >= 10 : true)
      );
    }

    return true;
  };

  // ============================================================
  // SUBMIT
  // ============================================================

  const submit = async () => {
    if (!canNext()) return;

    // Extra password safety check
    if (f.password !== f.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      // Do NOT send confirmPassword to backend
      const { confirmPassword, ...signupData } = f;

      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Signup failed");
      }

      // ========================================================
      // SUCCESS
      // Clear saved signup draft only after successful creation
      // ========================================================

      localStorage.removeItem(DRAFT_KEY);
      localStorage.removeItem(STEP_KEY);

      localStorage.setItem("indocia-token", data.token);
      localStorage.setItem("indocia-user", JSON.stringify(data.user));
      localStorage.setItem("indocia-tenant", JSON.stringify(data.tenant));

      toast.success("Storefront created 🎉");

      router.replace("/admin?welcome=1");
    } catch (e) {
      console.error("Signup error:", e);

      toast.error(
        e?.message || "Something went wrong while creating your storefront",
      );
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // OPTIONAL: Prevent UI flicker while restoring draft
  // ============================================================

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-rose-50 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        {/* =====================================================
            BACK HOME
        ====================================================== */}

        <Link
          href="/"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Back home
        </Link>

        {/* =====================================================
            HEADER
        ====================================================== */}

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

        {/* =====================================================
            PROGRESS
        ====================================================== */}

        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full ${
                s <= step
                  ? "bg-gradient-to-r from-orange-500 to-rose-500"
                  : "bg-neutral-200"
              }`}
            />
          ))}
        </div>

        {/* =====================================================
            CARD
        ====================================================== */}

        <Card className="p-6 md:p-8">
          <AnimatePresence mode="wait">
            {/* =================================================
                STEP 1
            ================================================== */}

            {step === 1 && (
              <motion.div
                key="1"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
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
                      type="button"
                      onClick={() => set("template", x.id)}
                      className={`p-4 rounded-xl border-2 text-left transition ${
                        f.template === x.id
                          ? "shadow-md"
                          : "hover:border-neutral-300"
                      }`}
                      style={
                        f.template === x.id
                          ? {
                              borderColor: x.color,
                              background: x.tint,
                            }
                          : {
                              borderColor: "#e5e5e5",
                            }
                      }
                    >
                      <x.icon
                        className="h-6 w-6"
                        style={{
                          color: x.color,
                        }}
                      />

                      <div className="mt-2 font-semibold text-sm">
                        {x.label}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* =================================================
                STEP 2
            ================================================== */}

            {step === 2 && (
              <motion.div
                key="2"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
              >
                <h2 className="text-xl font-bold mb-1">Business details</h2>

                <p className="text-sm text-muted-foreground mb-5">
                  This will appear on your storefront.
                </p>

                <div className="space-y-4">
                  {/* BUSINESS NAME */}

                  <div>
                    <Label>Business name *</Label>

                    <Input
                      placeholder="e.g. Sweet Crumbs Bakery"
                      value={f.businessName}
                      maxLength={50}
                      onChange={(e) => {
                        set("businessName", e.target.value);
                      }}
                    />
                  </div>

                  {/* SLUG */}

                  <div>
                    <Label>Storefront name *</Label>

                    <div className="flex items-center gap-0">
                      <div className="flex h-10 items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
                        https://
                      </div>

                      <Input
                        className="rounded-l-none rounded-r-none"
                        placeholder="your-shop"
                        value={f.slug}
                        maxLength={40}
                        onChange={(e) => checkSlug(e.target.value)}
                      />

                      <div className="flex h-10 items-center rounded-r-md border border-l-0 bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap">
                        .indocia.in
                      </div>
                    </div>

                    <div className="mt-2 min-h-[20px] text-xs">
                      {slugChecking ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Checking availability...
                        </span>
                      ) : slugAvailable === true ? (
                        <span className="text-green-600">
                          ✓ This storefront name is available
                        </span>
                      ) : slugAvailable === false ? (
                        <span className="text-red-600">{slugError}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          Choose a unique name for your storefront URL.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* TAGLINE */}

                  <div>
                    <Label>Tagline (optional)</Label>

                    <Input
                      placeholder="Handcrafted with love"
                      value={f.tagline}
                      maxLength={250}
                      onChange={(e) => set("tagline", e.target.value)}
                    />
                  </div>

                  {/* ADDRESS */}

                  <div>
                    <Label>Shop address (optional)</Label>

                    <Input
                      placeholder="Street, City"
                      value={f.address}
                      maxLength={150}
                      onChange={(e) => set("address", e.target.value)}
                    />
                  </div>
                </div>

                {/* PREVIEW URL */}

                <div
                  className="mt-6 rounded-lg border p-3 flex items-center gap-3 text-sm"
                  style={{
                    background: t.tint,
                    borderColor: t.color + "40",
                  }}
                >
                  <t.icon
                    className="h-5 w-5"
                    style={{
                      color: t.color,
                    }}
                  />

                  <div>
                    Your storefront will be at{" "}
                    <b>
                      https://
                      {f.slug || "your-shop"}
                      .indocia.in
                    </b>
                  </div>
                </div>
              </motion.div>
            )}

            {/* =================================================
                STEP 3
            ================================================== */}

            {step === 3 && (
              <motion.div
                key="3"
                initial={{
                  opacity: 0,
                  x: 20,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                exit={{
                  opacity: 0,
                  x: -20,
                }}
              >
                <h2 className="text-xl font-bold mb-1">
                  Your login & WhatsApp
                </h2>

                <p className="text-sm text-muted-foreground mb-5">
                  Orders will be sent to this WhatsApp number.
                </p>

                <div className="space-y-4">
                  {/* OWNER NAME */}

                  <div>
                    <Label>Your name *</Label>

                    <Input
                      value={f.ownerName}
                      maxLength={20}
                      onChange={(e) => set("ownerName", e.target.value)}
                    />
                  </div>

                  {/* EMAIL */}

                  <div>
                    <Label>Email *</Label>

                    <Input
                      type="email"
                      value={f.email}
                      maxLength={50}
                      onChange={(e) => set("email", e.target.value)}
                    />
                  </div>

                  {/* PASSWORD */}

                  <div>
                    <Label>Password *</Label>

                    <Input
                      type="password"
                      placeholder="min 6 characters"
                      value={f.password}
                      maxLength={20}
                      onChange={(e) => set("password", e.target.value)}
                    />

                    {f.password && f.password.length < 6 && (
                      <p className="mt-1 text-xs text-red-600">
                        Password must be at least 6 characters
                      </p>
                    )}
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>
                    <Label>Confirm password *</Label>

                    <Input
                      type="password"
                      placeholder="Re-enter your password"
                      value={f.confirmPassword}
                      maxLength={20}
                      onChange={(e) => set("confirmPassword", e.target.value)}
                    />

                    {f.confirmPassword && f.password !== f.confirmPassword && (
                      <p className="mt-1 text-xs text-red-600">
                        Passwords do not match
                      </p>
                    )}

                    {f.confirmPassword &&
                      f.password === f.confirmPassword &&
                      f.password.length >= 6 && (
                        <p className="mt-1 text-xs text-green-600">
                          ✓ Passwords match
                        </p>
                      )}
                  </div>

                  {/* WHATSAPP */}

                  <div>
                    <Label>
                      WhatsApp number *{" "}
                      <span className="text-xs text-muted-foreground">
                        (digits only)
                      </span>
                    </Label>

                    <Input
                      placeholder="9876543210"
                      value={f.whatsappNumber}
                      maxLength={10}
                      onChange={(e) =>
                        set("whatsappNumber", e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>

                  {/* PHONE */}

                  <div>
                    <Label>Phone (optional)</Label>

                    <Input
                      placeholder="9876543210"
                      value={f.phone}
                      maxLength={10}
                      onChange={(e) =>
                        set("phone", e.target.value.replace(/\D/g, ""))
                      }
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ===================================================
              NAVIGATION
          ==================================================== */}

          <div className="mt-8 flex items-center justify-between">
            {/* BACK */}

            {step > 1 ? (
              <Button
                variant="outline"
                type="button"
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {/* CONTINUE */}

            {step < 3 ? (
              <Button
                type="button"
                disabled={!canNext()}
                onClick={() => setStep(step + 1)}
                className="bg-gradient-to-r from-orange-500 to-rose-500"
              >
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              /* CREATE STOREFRONT */

              <Button
                type="button"
                disabled={!canNext() || loading}
                onClick={submit}
                className="bg-gradient-to-r from-orange-500 to-rose-500"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
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

        {/* =====================================================
            LOGIN
        ====================================================== */}

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
