"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminSettings() {
  const [t, setT] = useState(null);
  const [uploading, setUploading] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("indocia-token");

    fetch("/api/admin/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((d) => setT(d.tenant))
      .catch(() => {
        toast.error("Failed to load settings");
      });
  }, []);

  if (!t) {
    return <div>Loading...</div>;
  }

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
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB");
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
        console.log(res);
        console.log(data);

        throw new Error(data.error || "Upload failed");
      }

      // Cloudinary URL
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

  const save = async () => {
    try {
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

      if (res.ok) {
        toast.success("Settings saved");
      } else {
        toast.error("Save failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Business settings</h1>

      <Card className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business name */}
          <div>
            <Label>Business name</Label>
            <Input
              value={t.name || ""}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>

          {/* Tagline */}
          <div>
            <Label>Tagline</Label>
            <Input
              value={t.tagline || ""}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </div>

          {/* WhatsApp */}
          <div>
            <Label>WhatsApp number (with country code, digits only)</Label>
            <Input
              type="number"
              value={t.whatsappNumber || ""}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="919812345678"
            />
          </div>

          {/* Phone */}
          <div>
            <Label>Phone</Label>
            <Input
              type="number"
              value={t.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>

          {/* Instagram */}
          <div>
            <Label>Instagram URL</Label>
            <Input
              value={t.socialLinks?.instagram || ""}
              onChange={(e) => setSocial("instagram", e.target.value)}
              placeholder="https://instagram.com/yourshop"
            />
          </div>

          {/* Facebook */}
          <div>
            <Label>Facebook URL</Label>
            <Input
              value={t.socialLinks?.facebook || ""}
              onChange={(e) => setSocial("facebook", e.target.value)}
              placeholder="https://facebook.com/yourshop"
            />
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <Label>Address</Label>
            <Input
              value={t.address || ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>

          {/* ================= LOGO ================= */}

          <div className="md:col-span-2">
            <Label>Business Logo</Label>

            <div className="mt-2 flex flex-col sm:flex-row gap-4">
              <div className="w-28 h-28 rounded-xl border bg-white overflow-hidden flex items-center justify-center shrink-0">
                {t.logo ? (
                  <img
                    src={t.logo}
                    alt="Business logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-muted-foreground">No logo</span>
                )}
              </div>

              <div className="flex-1 space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  disabled={uploading === "logo"}
                  onChange={(e) => uploadImage(e, "logo")}
                />

                <Input
                  value={t.logo || ""}
                  onChange={(e) => set("logo", e.target.value)}
                  placeholder="Cloudinary logo URL"
                />

                {uploading === "logo" && (
                  <p className="text-sm text-muted-foreground">
                    Uploading logo...
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ================= BANNER ================= */}

          <div className="md:col-span-2">
            <Label>Business Banner</Label>

            <div className="mt-2 space-y-3">
              <div className="w-full h-48 rounded-xl border overflow-hidden bg-muted">
                {t.banner ? (
                  <img
                    src={t.banner}
                    alt="Business banner"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                    No banner
                  </div>
                )}
              </div>

              <Input
                type="file"
                accept="image/*"
                disabled={uploading === "banner"}
                onChange={(e) => uploadImage(e, "banner")}
              />

              <Input
                value={t.banner || ""}
                onChange={(e) => set("banner", e.target.value)}
                placeholder="Cloudinary banner URL"
              />

              {uploading === "banner" && (
                <p className="text-sm text-muted-foreground">
                  Uploading banner...
                </p>
              )}
            </div>
          </div>

          {/* Primary color */}
          <div>
            <Label>Primary color</Label>
            <Input
              type="color"
              value={t.primaryColor || "#000000"}
              onChange={(e) => set("primaryColor", e.target.value)}
            />
          </div>

          {/* Accent color */}
          <div>
            <Label>Accent color</Label>
            <Input
              type="color"
              value={t.accentColor || "#000000"}
              onChange={(e) => set("accentColor", e.target.value)}
            />
          </div>

          {/* Delivery fee */}
          <div>
            <Label>Delivery fee (₹)</Label>
            <Input
              type="number"
              value={t.deliveryFee || 0}
              onChange={(e) => set("deliveryFee", Number(e.target.value))}
            />
          </div>

          {/* Minimum order */}
          <div>
            <Label>Minimum order (₹)</Label>
            <Input
              type="number"
              value={t.minOrder || 0}
              onChange={(e) => set("minOrder", Number(e.target.value))}
            />
          </div>

          {/* Prep time */}
          <div>
            <Label>Prep time (mins)</Label>
            <Input
              type="number"
              value={t.prepTimeMins || 0}
              onChange={(e) => set("prepTimeMins", Number(e.target.value))}
            />
          </div>

          {/* Hours open */}
          <div>
            <Label>Hours open</Label>
            <Input
              value={t.businessHours?.open || ""}
              onChange={(e) =>
                set("businessHours", {
                  ...(t.businessHours || {}),
                  open: e.target.value,
                })
              }
            />
          </div>

          {/* Hours close */}
          <div>
            <Label>Hours close</Label>
            <Input
              value={t.businessHours?.close || ""}
              onChange={(e) =>
                set("businessHours", {
                  ...(t.businessHours || {}),
                  close: e.target.value,
                })
              }
            />
          </div>
        </div>

        <Button onClick={save} disabled={uploading !== null}>
          {uploading ? "Uploading..." : "Save settings"}
        </Button>
      </Card>
    </div>
  );
}
