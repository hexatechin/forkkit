"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Store, Settings } from "lucide-react";

const Required = () => <span className="text-red-500 ml-1">*</span>;

export default function AdminSettings() {
  const [t, setT] = useState(null);
  const [uploading, setUploading] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("business");

  useEffect(() => {
    const token = localStorage.getItem("indocia-token");

    fetch("/api/admin/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error("Failed to load settings");
        }

        return r.json();
      })
      .then((d) => {
        setT(d.tenant);
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to load settings");
      });
  }, []);

  const set = (key, value) => {
    setT((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const setSocial = (key, value) => {
    setT((prev) => ({
      ...prev,
      socialLinks: {
        ...(prev.socialLinks || {}),
        [key]: value,
      },
    }));
  };

  const uploadImage = async (event, type) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
      event.target.value = "";
      return;
    }

    try {
      setUploading(type);

      const token = localStorage.getItem("indocia-token");

      const formData = new FormData();

      formData.append("file", file);
      formData.append("storefrontId", t._id || t.id);
      formData.append("type", type);
      formData.append("folder", "settings");

      const res = await fetch("/api/admin/upload-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      set(type, data.url);

      toast.success(
        `${type === "logo" ? "Logo" : "Banner"} uploaded successfully`,
      );
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Image upload failed");
    } finally {
      setUploading(null);
      event.target.value = "";
    }
  };

  const validateSettings = () => {
    if (!t.name?.trim()) {
      toast.error("Business name is required");
      setActiveTab("business");
      return false;
    }

    if (!t.whatsappNumber?.trim()) {
      toast.error("WhatsApp number is required");
      setActiveTab("business");
      return false;
    }

    if (!/^\d{10}$/.test(t.whatsappNumber.trim())) {
      toast.error("WhatsApp number must contain exactly 10 digits");
      setActiveTab("business");
      return false;
    }

    if (!t.phone?.trim()) {
      toast.error("Phone number is required");
      setActiveTab("business");
      return false;
    }

    if (!/^\d{10}$/.test(t.phone.trim())) {
      toast.error("Phone number must contain exactly 10 digits");
      setActiveTab("business");
      return false;
    }

    if (!t.address?.trim()) {
      toast.error("Address is required");
      setActiveTab("business");
      return false;
    }

    if (!t.logo?.trim()) {
      toast.error("Business logo is required");
      setActiveTab("business");
      return false;
    }

    if (!t.banner?.trim()) {
      toast.error("Business banner is required");
      setActiveTab("business");
      return false;
    }

    if (!t.primaryColor?.trim()) {
      toast.error("Primary color is required");
      setActiveTab("store");
      return false;
    }

    if (!t.accentColor?.trim()) {
      toast.error("Accent color is required");
      setActiveTab("store");
      return false;
    }

    if (!t.businessHours?.open) {
      toast.error("Opening time is required");
      setActiveTab("store");
      return false;
    }

    if (!t.businessHours?.close) {
      toast.error("Closing time is required");
      setActiveTab("store");
      return false;
    }

    return true;
  };

  const save = async () => {
    if (saving || uploading !== null) return;

    if (!validateSettings()) return;

    try {
      setSaving(true);

      const token = localStorage.getItem("indocia-token");

      const { _id, id, slug, ...rest } = t;

      const res = await fetch("/api/admin/tenant", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rest),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || "Save failed");
      }

      toast.success("Settings saved");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!t) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading settings...
        </div>
      </div>
    );
  }

  const isBusy = saving || uploading !== null;

  return (
    <div className="max-w-3xl pb-10">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Business settings</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage how your business appears and operates on Indocia.
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setActiveTab("business")}
          disabled={isBusy}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            activeTab === "business"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Store className="h-4 w-4" />
          Business
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("store")}
          disabled={isBusy}
          className={`flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
            activeTab === "store"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
        >
          <Settings className="h-4 w-4" />
          Store settings
        </button>
      </div>

      <Card className="overflow-hidden">
        {/* ================================================= */}
        {/* BUSINESS TAB */}
        {/* ================================================= */}

        {activeTab === "business" && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Business information</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Information your customers will see on your storefront.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Business name */}
              <div>
                <Label>
                  Business name
                  <Required />
                </Label>

                <Input
                  value={t.name || ""}
                  maxLength={50}
                  required
                  disabled={isBusy}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="Your business name"
                  className="mt-1.5"
                />
              </div>

              {/* Tagline */}
              <div>
                <Label>Tagline</Label>

                <Input
                  value={t.tagline || ""}
                  maxLength={250}
                  disabled={isBusy}
                  onChange={(e) => set("tagline", e.target.value)}
                  placeholder="Fresh food, delivered with love"
                  className="mt-1.5"
                />
              </div>

              {/* WhatsApp */}
              <div>
                <Label>
                  WhatsApp number
                  <Required />
                </Label>

                <Input
                  type="tel"
                  maxLength={10}
                  required
                  disabled={isBusy}
                  value={t.whatsappNumber || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");

                    if (value.length <= 10) {
                      set("whatsappNumber", value);
                    }
                  }}
                  placeholder="9812345678"
                  className="mt-1.5"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  10 digits only
                </p>
              </div>

              {/* Phone */}
              <div>
                <Label>
                  Phone
                  <Required />
                </Label>

                <Input
                  type="tel"
                  maxLength={10}
                  required
                  disabled={isBusy}
                  value={t.phone || ""}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");

                    if (value.length <= 10) {
                      set("phone", value);
                    }
                  }}
                  placeholder="9812345678"
                  className="mt-1.5"
                />
              </div>

              {/* Address */}
              <div className="md:col-span-2">
                <Label>
                  Address
                  <Required />
                </Label>

                <Input
                  value={t.address || ""}
                  maxLength={150}
                  required
                  disabled={isBusy}
                  onChange={(e) => set("address", e.target.value)}
                  placeholder="Shop address"
                  className="mt-1.5"
                />
              </div>

              {/* Instagram */}
              <div>
                <Label>Instagram URL</Label>

                <Input
                  value={t.socialLinks?.instagram || ""}
                  maxLength={100}
                  disabled={isBusy}
                  onChange={(e) => setSocial("instagram", e.target.value)}
                  placeholder="https://instagram.com/yourshop"
                  className="mt-1.5"
                />
              </div>

              {/* Facebook */}
              <div>
                <Label>Facebook URL</Label>

                <Input
                  value={t.socialLinks?.facebook || ""}
                  maxLength={100}
                  disabled={isBusy}
                  onChange={(e) => setSocial("facebook", e.target.value)}
                  placeholder="https://facebook.com/yourshop"
                  className="mt-1.5"
                />
              </div>

              {/* ================================================= */}
              {/* LOGO */}
              {/* ================================================= */}

              <div className="md:col-span-2">
                <Label>
                  Business logo
                  <Required />
                </Label>

                <div className="mt-2 flex flex-col gap-4 rounded-xl border bg-slate-50 p-4 sm:flex-row">
                  <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white">
                    {t.logo ? (
                      <img
                        src={t.logo}
                        alt="Business logo"
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No logo
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      disabled={uploading === "logo" || saving}
                      onChange={(e) => uploadImage(e, "logo")}
                    />

                    <Input
                      value={t.logo || ""}
                      maxLength={250}
                      disabled={isBusy}
                      required
                      onChange={(e) => set("logo", e.target.value)}
                      placeholder="Paste business logo URL"
                    />

                    {uploading === "logo" && (
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading logo...
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* ================================================= */}
              {/* BANNER */}
              {/* ================================================= */}

              <div className="md:col-span-2">
                <Label>
                  Business banner
                  <Required />
                </Label>

                <div className="mt-2 space-y-3 rounded-xl border bg-slate-50 p-4">
                  <div className="h-48 w-full overflow-hidden rounded-xl border bg-white">
                    {t.banner ? (
                      <img
                        src={t.banner}
                        alt="Business banner"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                        No banner
                      </div>
                    )}
                  </div>

                  <Input
                    type="file"
                    accept="image/*"
                    disabled={uploading === "banner" || saving}
                    onChange={(e) => uploadImage(e, "banner")}
                  />

                  <Input
                    value={t.banner || ""}
                    maxLength={250}
                    disabled={isBusy}
                    required
                    onChange={(e) => set("banner", e.target.value)}
                    placeholder="Paste business banner URL"
                  />

                  {uploading === "banner" && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading banner...
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* STORE SETTINGS TAB */}
        {/* ================================================= */}

        {activeTab === "store" && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">Store settings</h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Configure your store timings, colors and ordering rules.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Primary color */}
              <div>
                <Label>
                  Primary color
                  <Required />
                </Label>

                <div className="mt-1.5 flex gap-3">
                  <Input
                    type="color"
                    required
                    disabled={isBusy}
                    value={t.primaryColor || "#000000"}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer p-1"
                  />

                  <Input
                    value={t.primaryColor || "#000000"}
                    maxLength={20}
                    disabled={isBusy}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Accent color */}
              <div>
                <Label>
                  Accent color
                  <Required />
                </Label>

                <div className="mt-1.5 flex gap-3">
                  <Input
                    type="color"
                    required
                    disabled={isBusy}
                    value={t.accentColor || "#000000"}
                    onChange={(e) => set("accentColor", e.target.value)}
                    className="h-10 w-14 cursor-pointer p-1"
                  />

                  <Input
                    value={t.accentColor || "#000000"}
                    maxLength={20}
                    disabled={isBusy}
                    onChange={(e) => set("accentColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Delivery fee */}
              <div>
                <Label>Delivery fee (₹)</Label>

                <Input
                  type="number"
                  min={0}
                  max={99999}
                  value={t.deliveryFee ?? 0}
                  disabled={isBusy}
                  onChange={(e) => {
                    const value = Number(e.target.value);

                    if (value < 0 || value > 99999) return;

                    set("deliveryFee", value);
                  }}
                  className="mt-1.5"
                />
              </div>

              {/* Minimum order */}
              <div>
                <Label>Minimum order (₹)</Label>

                <Input
                  type="number"
                  min={0}
                  max={99999}
                  value={t.minOrder ?? 0}
                  disabled={isBusy}
                  onChange={(e) => {
                    const value = Number(e.target.value);

                    if (value < 0 || value > 99999) return;

                    set("minOrder", value);
                  }}
                  className="mt-1.5"
                />
              </div>

              {/* Prep time */}
              <div>
                <Label>Prep time (mins)</Label>

                <Input
                  type="number"
                  min={0}
                  max={999}
                  value={t.prepTimeMins ?? 0}
                  disabled={isBusy}
                  onChange={(e) => {
                    const value = Number(e.target.value);

                    if (value < 0 || value > 999) return;

                    set("prepTimeMins", value);
                  }}
                  className="mt-1.5"
                />
              </div>

              {/* Opening */}
              <div>
                <Label>
                  Hours open
                  <Required />
                </Label>

                <Input
                  type="time"
                  step="60"
                  required
                  disabled={isBusy}
                  value={t.businessHours?.open || ""}
                  onChange={(e) =>
                    set("businessHours", {
                      ...(t.businessHours || {}),
                      open: e.target.value,
                    })
                  }
                  className="mt-1.5"
                />
              </div>

              {/* Closing */}
              <div>
                <Label>
                  Hours close
                  <Required />
                </Label>

                <Input
                  type="time"
                  step="60"
                  required
                  disabled={isBusy}
                  value={t.businessHours?.close || ""}
                  onChange={(e) =>
                    set("businessHours", {
                      ...(t.businessHours || {}),
                      close: e.target.value,
                    })
                  }
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="flex flex-col gap-3 border-t bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            Fields marked with <span className="text-red-500">*</span> are
            required.
          </p>

          <Button onClick={save} disabled={isBusy} className="min-w-[150px]">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Save settings"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
