"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;
const BLANK = {
  name: "",
  description: "",
  categoryId: "",
  price: 0,
  discountPrice: 0,
  images: "",
  available: true,
  badges: "",
  variants: "[]",
  addons: "[]",
};

export default function AdminProducts() {
  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(BLANK);

  const load = () => {
    const t = localStorage.getItem("kirano-token");
    fetch("/api/admin/products", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => {
        setItems(d.products || []);
        setCats(d.categories || []);
      });
  };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setF({ ...BLANK, categoryId: cats[0]?.id || "" });
    setOpen(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setF({
      name: p.name,
      description: p.description || "",
      categoryId: p.categoryId,
      price: p.price,
      discountPrice: p.discountPrice || 0,
      images: (p.images || []).join(","),
      available: p.available !== false,
      badges: (p.badges || []).join(","),
      variants: JSON.stringify(p.variants || [], null, 2),
      addons: JSON.stringify(p.addons || [], null, 2),
    });
    setOpen(true);
  };

  const save = async () => {
    const t = localStorage.getItem("kirano-token");
    const body = {
      ...f,
      price: Number(f.price),
      discountPrice: Number(f.discountPrice) || null,
      images: f.images
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      badges: f.badges
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const url = editing
      ? `/api/admin/products/${editing.id}`
      : "/api/admin/products";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = await res.json();
      return toast.error(d.error || "Failed");
    }
    toast.success("Saved");
    setOpen(false);
    load();
  };
  const del = async (id) => {
    if (!confirm("Delete this product?")) return;
    const t = localStorage.getItem("kirano-token");
    await fetch(`/api/admin/products/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    toast.success("Deleted");
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">
            Manage your menu items
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          New product
        </Button>
      </div>
      <div className="grid gap-3">
        {items.map((p) => {
          const cat = cats.find((c) => c.id === p.categoryId);
          return (
            <Card key={p.id} className="p-4 flex items-center gap-4">
              <img
                src={p.images?.[0]}
                className="h-16 w-16 rounded-lg object-cover bg-neutral-100"
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {cat?.name} · {inr(p.discountPrice || p.price)}{" "}
                  {p.available === false && (
                    <span className="text-red-500">· unavailable</span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => del(p.id)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit product" : "New product"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input
                value={f.name}
                onChange={(e) => setF({ ...f, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={f.description}
                onChange={(e) => setF({ ...f, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={f.categoryId}
                onValueChange={(v) => setF({ ...f, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (₹)</Label>
                <Input
                  type="number"
                  value={f.price}
                  onChange={(e) => setF({ ...f, price: e.target.value })}
                />
              </div>
              <div>
                <Label>Discount price (₹, optional)</Label>
                <Input
                  type="number"
                  value={f.discountPrice}
                  onChange={(e) =>
                    setF({ ...f, discountPrice: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Image URLs (comma-separated)</Label>
              <Textarea
                value={f.images}
                onChange={(e) => setF({ ...f, images: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>Badges (comma-separated)</Label>
              <Input
                value={f.badges}
                onChange={(e) => setF({ ...f, badges: e.target.value })}
                placeholder="Bestseller, New"
              />
            </div>
            <div>
              <Label>Variants (JSON)</Label>
              <Textarea
                value={f.variants}
                onChange={(e) => setF({ ...f, variants: e.target.value })}
                rows={3}
                placeholder='[{"name":"Size","options":[{"label":"Small","priceDelta":0}]}]'
              />
            </div>
            <div>
              <Label>Addons (JSON)</Label>
              <Textarea
                value={f.addons}
                onChange={(e) => setF({ ...f, addons: e.target.value })}
                rows={2}
                placeholder='[{"name":"Candles","price":2}]'
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={f.available}
                onCheckedChange={(v) => setF({ ...f, available: v })}
              />{" "}
              <Label>Available</Label>
            </div>
            <Button onClick={save} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
