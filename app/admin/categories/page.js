"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  FolderTree,
  Package,
  X,
  Settings2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const COMMON_ICONS = [
  "🎂",
  "🥐",
  "🍞",
  "🍪",
  "☕",
  "🍳",
  "🥪",
  "🧋",
  "💐",
  "🌷",
  "🌹",
  "🪴",
  "🎁",
  "🎓",
  "✨",
  "🍛",
  "🍝",
  "🍽️",
  "🍕",
  "🍢",
  "🍰",
  "💻",
  "🪑",
  "🏢",
  "🎫",
  "🥤",
  "🌯",
  "🥗",
  "🍔",
  "🌮",
  "🥟",
  "🥩",
  "🍤",
  "🍣",
];

const FLAG_DEFS = [
  {
    key: "allowCakeMessage",
    label: "Custom message",
    hint: "Let customers add a personal message (e.g. on a cake or card)",
  },
];

const emptyCategory = {
  name: "",
  icon: "🍽️",
  customVariants: [],
  customAddons: [],
  customFlags: {},
};

export default function AdminCategories() {
  const [cats, setCats] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [f, setF] = useState(emptyCategory);

  const load = async () => {
    setLoading(true);
    const t = localStorage.getItem("indocia-token");
    const [c, p] = await Promise.all([
      fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${t}` },
      }).then((r) => r.json()),
      fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${t}` },
      }).then((r) => r.json()),
    ]);
    setCats(c.categories || []);
    setProducts(p.products || []);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setF({ ...emptyCategory });
    setOpen(true);
  };
  const openEdit = (c) => {
    setEditing(c);
    setF({
      name: c.name,
      icon: c.icon || "🍽️",
      customVariants: (c.customVariants || []).map((v) => ({
        name: v.name,
        options: (v.options || []).map((o) => ({ label: o.label })),
      })),
      customAddons: (c.customAddons || []).map((a) => ({ name: a.name })),
      customFlags: c.customFlags || {},
    });
    setOpen(true);
  };

  const save = async () => {
    if (!f.name.trim()) return toast.error("Category name is required");
    // Clean out empty rows
    const customVariants = (f.customVariants || [])
      .map((v) => ({
        name: v.name?.trim(),
        options: (v.options || [])
          .map((o) => ({ label: o.label?.trim() }))
          .filter((o) => o.label),
      }))
      .filter((v) => v.name && v.options.length);
    const customAddons = (f.customAddons || [])
      .map((a) => ({ name: a.name?.trim() }))
      .filter((a) => a.name);
    const cleanFlags = { ...(f.customFlags || {}) };
    delete cleanFlags.diet;
    const t = localStorage.getItem("indocia-token");
    const url = editing
      ? `/api/admin/categories/${editing.id}`
      : "/api/admin/categories";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${t}`,
      },
      body: JSON.stringify({
        name: f.name.trim(),
        icon: f.icon,
        customVariants,
        customAddons,
        customFlags: cleanFlags,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      return toast.error(d.error || "Failed");
    }
    toast.success(editing ? "Category updated" : "Category added");
    setOpen(false);
    load();
  };

  const del = async (c) => {
    const count = products.filter((p) => p.categoryId === c.id).length;
    if (count > 0)
      return toast.error(
        `"${c.name}" has ${count} product(s). Delete or move them first.`,
      );
    if (!confirm(`Delete "${c.name}"?`)) return;
    const t = localStorage.getItem("indocia-token");
    const res = await fetch(`/api/admin/categories/${c.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${t}` },
    });
    if (!res.ok) {
      const d = await res.json();
      return toast.error(d.error || "Delete failed");
    }
    toast.success("Category deleted");
    load();
  };

  const countFor = (cid) => products.filter((p) => p.categoryId === cid).length;

  // --- Custom template editor helpers ---
  const addVariant = () => {
    if ((f.customVariants || []).length > 0) return;
    setF({
      ...f,
      customVariants: [
        ...(f.customVariants || []),
        { name: "", options: [{ label: "" }] },
      ],
    });
  };
  const removeVariant = (i) =>
    setF({
      ...f,
      customVariants: f.customVariants.filter((_, idx) => idx !== i),
    });
  const updateVariant = (i, patch) =>
    setF({
      ...f,
      customVariants: f.customVariants.map((v, idx) =>
        idx === i ? { ...v, ...patch } : v,
      ),
    });
  const addOption = (vi) =>
    updateVariant(vi, {
      options: [...f.customVariants[vi].options, { label: "" }],
    });
  const removeOption = (vi, oi) =>
    updateVariant(vi, {
      options: f.customVariants[vi].options.filter((_, idx) => idx !== oi),
    });
  const updateOption = (vi, oi, patch) =>
    updateVariant(vi, {
      options: f.customVariants[vi].options.map((o, idx) =>
        idx === oi ? { ...o, ...patch } : o,
      ),
    });
  const addAddon = () =>
    setF({ ...f, customAddons: [...(f.customAddons || []), { name: "" }] });
  const removeAddon = (i) =>
    setF({ ...f, customAddons: f.customAddons.filter((_, idx) => idx !== i) });
  const updateAddon = (i, patch) =>
    setF({
      ...f,
      customAddons: f.customAddons.map((a, idx) =>
        idx === i ? { ...a, ...patch } : a,
      ),
    });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Group your menu and define which options products in each category
            will offer
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 mr-2" />
          New category
        </Button>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-muted-foreground">
          Loading...
        </Card>
      ) : cats.length === 0 ? (
        <Card className="p-10 text-center">
          <FolderTree className="h-12 w-12 mx-auto text-neutral-300" />
          <div className="mt-3 font-medium">No categories yet</div>
          <p className="text-sm text-muted-foreground mt-1">
            Categories group products and define shared customization options.
          </p>
          <Button onClick={openNew} className="mt-4">
            <Plus className="h-4 w-4 mr-2" />
            Create first category
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {cats.map((c) => {
              const count = countFor(c.id);
              const hasTemplate =
                (c.customVariants?.length || 0) +
                  (c.customAddons?.length || 0) +
                  Object.values(c.customFlags || {}).filter(Boolean).length >
                0;
              return (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className="p-5 hover:shadow-md transition group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl">
                          {c.icon || "🍽️"}
                        </div>
                        <div>
                          <div className="font-bold">{c.name}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {count} product{count !== 1 ? "s" : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEdit(c)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => del(c)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    {hasTemplate && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {c.customVariants?.map((v, i) => (
                          <span
                            key={"v" + i}
                            className="text-[10px] bg-blue-50 text-blue-700 rounded-full px-2 py-0.5"
                          >
                            {v.name}: {v.options?.length || 0} opts
                          </span>
                        ))}
                        {c.customAddons?.length > 0 && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 rounded-full px-2 py-0.5">
                            {c.customAddons.length} add-on
                            {c.customAddons.length !== 1 ? "s" : ""}
                          </span>
                        )}
                        {c.customFlags?.allowCakeMessage && (
                          <span className="text-[10px] bg-pink-50 text-pink-700 rounded-full px-2 py-0.5">
                            Custom message
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/products?category=${c.id}`}
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8"
                        >
                          <Package className="h-3 w-3 mr-1.5" />
                          Products
                        </Button>
                      </Link>
                      <Link
                        href={`/admin/products?new=1&category=${c.id}`}
                        className="flex-1"
                      >
                        <Button size="sm" className="w-full h-8">
                          <Plus className="h-3 w-3 mr-1.5" />
                          Add product
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit category" : "New category"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5">
            {/* Basics */}
            <div className="grid grid-cols-[1fr,auto] gap-3">
              <div>
                <Label>Name *</Label>
                <Input
                  placeholder="e.g. Cakes, Bouquets, Meeting Rooms"
                  value={f.name}
                  onChange={(e) => setF({ ...f, name: e.target.value })}
                  autoFocus
                  maxLength={30}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <Input
                  value={f.icon}
                  onChange={(e) => setF({ ...f, icon: e.target.value })}
                  className="w-20 text-center text-lg"
                  maxLength={4}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {COMMON_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setF({ ...f, icon: i })}
                  className={`h-8 w-8 rounded-lg text-lg hover:bg-neutral-100 ${f.icon === i ? "bg-neutral-900 text-white hover:bg-neutral-800" : ""}`}
                >
                  {i}
                </button>
              ))}
            </div>
            {/* Customization template */}
            <div className="border rounded-xl p-4 bg-gradient-to-br from-amber-50/50 to-rose-50/30">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="h-4 w-4 text-orange-500" />
                <div className="font-semibold text-sm">
                  Product customization template
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                These options will be pre-filled when you add a new product to
                this category. You can still tweak per product.
              </p>

              {/* Boolean flags */}
              <div className="space-y-2 mb-5">
                {FLAG_DEFS.map((fd) => (
                  <label
                    key={fd.key}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-white cursor-pointer"
                  >
                    <Switch
                      checked={!!f.customFlags?.[fd.key]}
                      onCheckedChange={(v) =>
                        setF({
                          ...f,
                          customFlags: {
                            ...(f.customFlags || {}),
                            [fd.key]: v,
                          },
                        })
                      }
                    />
                    <div>
                      <div className="text-sm font-medium">{fd.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {fd.hint}
                      </div>
                    </div>
                  </label>
                ))}
              </div>

              {/* Variants */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">
                    Variants (size, style, etc.)
                  </Label>
                  {(f.customVariants || []).length === 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addVariant}
                      className="h-7"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add variant
                    </Button>
                  )}
                </div>
                <div className="space-y-3">
                  {(f.customVariants || []).map((v, vi) => (
                    <Card key={vi} className="p-3 bg-white">
                      <div className="flex gap-2 items-center mb-2">
                        <Input
                          placeholder="Variant name (e.g. Size, Duration)"
                          value={v.name}
                          maxLength={30}
                          onChange={(e) =>
                            updateVariant(vi, { name: e.target.value })
                          }
                          className="flex-1 h-8 text-sm"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeVariant(vi)}
                          className="h-8 w-8"
                        >
                          <X className="h-3.5 w-3.5 text-red-500" />
                        </Button>
                      </div>
                      <div className="space-y-1.5 pl-2 border-l-2 border-neutral-100">
                        {v.options.map((o, oi) => (
                          <div key={oi} className="flex gap-2 items-center">
                            <Input
                              placeholder="Option label (e.g. 1 kg)"
                              value={o.label}
                              maxLength={30}
                              onChange={(e) =>
                                updateOption(vi, oi, { label: e.target.value })
                              }
                              className="flex-1 h-8 text-sm"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeOption(vi, oi)}
                              className="h-7 w-7"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => addOption(vi)}
                          className="h-6 text-xs"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add option
                        </Button>
                      </div>
                    </Card>
                  ))}
                  {(f.customVariants || []).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No variants — products in this category will not offer
                      size/style choices.
                    </p>
                  )}
                </div>
              </div>

              {/* Addons */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">Add-ons</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={addAddon}
                    className="h-7"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add-on
                  </Button>
                </div>
                <div className="space-y-1.5">
                  {(f.customAddons || []).map((a, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <Input
                        placeholder="Add-on name (e.g. Candles, Extra shot)"
                        value={a.name}
                        maxLength={30}
                        onChange={(e) =>
                          updateAddon(i, { name: e.target.value })
                        }
                        className="flex-1 h-8 text-sm"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeAddon(i)}
                        className="h-7 w-7"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {(f.customAddons || []).length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      No add-ons — products in this category won't have extras.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button onClick={save} className="w-full h-11">
              {editing ? "Save changes" : "Add category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
