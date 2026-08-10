"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function AdminSettings() {
  const [t, setT] = useState(null);
  useEffect(() => {
    const token = localStorage.getItem("indocia-token");
    fetch("/api/admin/me", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setT(d.tenant));
  }, []);
  if (!t) return <div>Loading...</div>;

  const save = async () => {
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
    if (res.ok) toast.success("Settings saved");
    else toast.error("Save failed");
  };
  const set = (k, v) => setT({ ...t, [k]: v });
  const setSocial = (k, v) =>
    setT({ ...t, socialLinks: { ...(t.socialLinks || {}), [k]: v } });

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">Business settings</h1>
      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Business name</Label>
            <Input
              value={t.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </div>
          <div>
            <Label>Tagline</Label>
            <Input
              value={t.tagline || ""}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </div>
          <div>
            <Label>WhatsApp number (with country code, digits only)</Label>
            <Input
              type="number"
              value={t.whatsappNumber || ""}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="919812345678"
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              type="number"
              value={t.phone || ""}
              onChange={(e) => set("phone", e.target.value)}
            />
          </div>
          <div>
            <Label>Instagram URL</Label>
            <Input
              value={t.socialLinks?.instagram || ""}
              onChange={(e) => setSocial("instagram", e.target.value)}
              placeholder="https://instagram.com/yourshop"
            />
          </div>
          <div>
            <Label>Facebook URL</Label>
            <Input
              value={t.socialLinks?.facebook || ""}
              onChange={(e) => setSocial("facebook", e.target.value)}
              placeholder="https://facebook.com/yourshop"
            />
          </div>
          <div className="col-span-2">
            <Label>Address</Label>
            <Input
              value={t.address || ""}
              onChange={(e) => set("address", e.target.value)}
            />
          </div>
          <div>
            <Label>Logo URL</Label>
            <Input
              value={t.logo || ""}
              onChange={(e) => set("logo", e.target.value)}
            />
          </div>
          <div>
            <Label>Banner URL</Label>
            <Input
              value={t.banner || ""}
              onChange={(e) => set("banner", e.target.value)}
            />
          </div>
          <div>
            <Label>Primary color</Label>
            <Input
              type="color"
              value={t.primaryColor || "#000000"}
              onChange={(e) => set("primaryColor", e.target.value)}
            />
          </div>
          <div>
            <Label>Accent color</Label>
            <Input
              type="color"
              value={t.accentColor || "#000000"}
              onChange={(e) => set("accentColor", e.target.value)}
            />
          </div>
          <div>
            <Label>Delivery fee (₹)</Label>
            <Input
              type="number"
              value={t.deliveryFee || 0}
              onChange={(e) => set("deliveryFee", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Minimum order (₹)</Label>
            <Input
              type="number"
              value={t.minOrder || 0}
              onChange={(e) => set("minOrder", Number(e.target.value))}
            />
          </div>
          <div>
            <Label>Prep time (mins)</Label>
            <Input
              type="number"
              value={t.prepTimeMins || 0}
              onChange={(e) => set("prepTimeMins", Number(e.target.value))}
            />
          </div>
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
        <Button onClick={save}>Save settings</Button>
      </Card>
    </div>
  );
}
