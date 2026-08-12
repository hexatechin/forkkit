"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ShoppingBag,
  Star,
  Clock,
  MapPin,
  Phone,
  Instagram,
  Plus,
  Facebook,
  Minus,
} from "lucide-react";
import { useCart } from "@/lib/cart-store";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

const detectDiet = (product) => {
  if (product.diet) return product.diet;
  const text =
    `${product.name || ""} ${product.description || ""}`.toLowerCase();
  if (
    /non[- ]?veg|nonveg|non veg|chicken|mutton|fish|prawns|prawn|meat/.test(
      text,
    )
  )
    return "nonveg";
  if (/veg|vegetarian|vegan|plant-based/.test(text)) return "veg";
  return "all";
};

const getCategoryName = (product, categories) =>
  categories?.find((c) => c.id === product.categoryId)?.name || "";
const getSizeLabel = (product) => {
  const sizeVariant =
    (product.variants || []).find((v) => /size|weight/i.test(v.name)) ||
    product.variants?.[0];
  return sizeVariant?.options?.[0]?.label || null;
};
const getDiscountPercent = (product) => {
  if (!product.discountPrice || !product.price) return null;
  return Math.round(100 - (product.discountPrice / product.price) * 100);
};

export default function StorefrontPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [q, setQ] = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const [dietFilter, setDietFilter] = useState("all");
  const catRefs = useRef({});
  const { items, setTenant, addItem, removeItem, updateQty } = useCart();

  useEffect(() => {
    fetch(`/api/tenant/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setTenant(slug);
        if (d.categories?.[0]) setActiveCat(d.categories[0].id);
      });
  }, [slug]);

  const filtered = useMemo(() => {
    if (!data) return {};
    const byCat = {};
    data.categories.forEach((c) => (byCat[c.id] = []));
    data.products.forEach((p) => {
      if (
        q &&
        !p.name.toLowerCase().includes(q.toLowerCase()) &&
        !p.description?.toLowerCase().includes(q.toLowerCase())
      )
        return;
      const diet = detectDiet(p);
      if (dietFilter === "veg" && diet !== "veg") return;
      if (dietFilter === "nonveg" && diet !== "nonveg") return;
      if (byCat[p.categoryId]) byCat[p.categoryId].push(p);
    });
    return byCat;
  }, [data, q, dietFilter]);

  const cartCounts = useMemo(() => {
    return items.reduce((acc, item) => {
      acc[item.productId] = (acc[item.productId] || 0) + item.qty;
      return acc;
    }, {});
  }, [items]);

  if (!data)
    return (
      <div className="min-h-screen bg-neutral-50">
        <Skeleton className="h-72 w-full" />
        <div className="container mx-auto p-6 space-y-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );

  const t = data.tenant;
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const scrollToCat = (cid) => {
    setActiveCat(cid);
    catRefs.current[cid]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };
  const quickAdd = (p) => {
    const unitPrice = p.discountPrice || p.price;
    addItem({
      productId: p.id,
      name: p.name,
      image: p.images?.[0],
      qty: 1,
      unitPrice,
      variantLabel: null,
      addons: [],
      diet: p.diet || "veg",
    });
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: t.accentColor || "#fafafa" }}
    >
      <div
        className="relative h-64 md:h-80 w-full"
        style={{
          backgroundImage: `url(${t.banner})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-center gap-3">
          <div className="flex flex-row gap-2">
            <div className="flex shrink-0 gap-3">
              {t.logo && (
                <img
                  src={t.logo}
                  alt={t.name}
                  className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover"
                />
              )}
            </div>
            <div className="min-w-0">
              <h1
                className="text-3xl md:text-4xl font-black drop-shadow"
                style={{ color: t.primaryColor }}
              >
                {t.name}
              </h1>
              <p className="text-sm md:text-base opacity-90 text-white">
                {t.tagline?.length > 175
                  ? `${t.tagline.slice(0, 175)}...`
                  : t.tagline}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/90 rounded-full p-1 shadow-sm">
              {["all", "veg", "nonveg"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setDietFilter(filter)}
                  className={`whitespace-nowrap px-3 py-2 rounded-full text-sm font-medium transition ${dietFilter === filter ? "text-white" : "bg-transparent text-neutral-800 hover:bg-neutral-100"}`}
                  style={
                    dietFilter === filter ? { background: t.primaryColor } : {}
                  }
                >
                  {filter === "all"
                    ? "All"
                    : filter === "veg"
                      ? "Veg"
                      : "Non-veg"}
                </button>
              ))}
            </div>
            <Link href={`//cart`}>
              <div className="relative bg-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg">
                <ShoppingBag
                  className="h-5 w-5"
                  style={{ color: t.primaryColor }}
                />
                {totalItems > 0 && (
                  <span
                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold text-white flex items-center justify-center"
                    style={{ background: t.primaryColor }}
                  >
                    {totalItems}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>
        <div className="absolute bottom-8 left-6 right-6 text-white">
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur rounded-full px-3 py-1">
              <Clock className="h-3 w-3" /> {t.businessHours?.open}-
              {t.businessHours?.close}
            </span>
            {t.address && (
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur rounded-full px-3 py-1">
                <MapPin className="h-3 w-3" /> {t.address}
              </span>
            )}
            {t.phone && (
              <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur rounded-full px-3 py-1">
                <Phone className="h-3 w-3" />
                <Link href={`tel:+91-${t.phone}`}>+91-{t.phone}</Link>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2">
          <Search className="h-5 w-5 text-neutral-400 ml-2" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="border-0 focus-visible:ring-0 shadow-none"
          />
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b mt-6">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center gap-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {data.categories.map((c) => (
              <button
                key={c.id}
                onClick={() => scrollToCat(c.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${activeCat === c.id ? "text-white shadow" : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"}`}
                style={activeCat === c.id ? { background: t.primaryColor } : {}}
              >
                <span className="mr-1">{c.icon}</span>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10 pb-32">
        {data.categories.map((c) => {
          const prods = filtered[c.id] || [];
          if (!prods.length) return null;
          return (
            <section key={c.id} ref={(el) => (catRefs.current[c.id] = el)}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <span>{c.icon}</span>
                {c.name}
              </h2>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {prods.map((p, i) => {
                    const discountPercent = getDiscountPercent(p);
                    const isBestseller = p.badges?.some((b) =>
                      /bestseller|popular/i.test(b),
                    );
                    const displayDiet = detectDiet(p);
                    return (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.03 * i }}
                      >
                        <Card className="overflow-hidden rounded-[18px] border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-[4px] hover:shadow-xl">
                          <div className="grid h-full min-h-[210px] gap-3 p-[10px] grid-cols-[160px_minmax(0,1fr)] items-center">
                            <Link
                              href={`//product/${p.id}`}
                              className="group relative block h-[160px] w-[160px] overflow-hidden rounded-xl bg-slate-100 transition duration-300 hover:scale-[1.03]"
                            >
                              <div className="relative h-full w-full">
                                {p.images?.[0] ? (
                                  <img
                                    loading="lazy"
                                    src={p.images[0]}
                                    alt={p.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";

                                      const fallback =
                                        e.currentTarget.parentElement?.querySelector(
                                          ".image-fallback",
                                        );

                                      if (fallback) {
                                        fallback.classList.remove("hidden");
                                        fallback.classList.add("flex");
                                      }
                                    }}
                                  />
                                ) : null}

                                <div
                                  className={`image-fallback absolute inset-0 items-center justify-center bg-slate-100 text-slate-400 text-4xl ${
                                    p.images?.[0] ? "hidden" : "flex"
                                  }`}
                                >
                                  🍽️
                                </div>
                              </div>
                              <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                                <span
                                  className={`h-2.5 w-2.5 rounded-full ${displayDiet === "nonveg" ? "bg-rose-600" : "bg-emerald-500"}`}
                                />
                                {displayDiet === "nonveg" ? "Non-Veg" : "Veg"}
                              </div>
                              {isBestseller && (
                                <span className="absolute bottom-4 left-4 rounded-full bg-amber-500 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm">
                                  BESTSELLER
                                </span>
                              )}
                            </Link>

                            <div className="flex h-full flex-col justify-center gap-3">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                  <Link
                                    href={`//product/${p.id}`}
                                    className="min-w-0 text-[15px] font-semibold leading-[1.3] text-slate-900 line-clamp-2 hover:underline"
                                  >
                                    {p.name}
                                  </Link>
                                </div>
                                <p className="text-[15px] leading-6 text-slate-500 line-clamp-2">
                                  {p.description}
                                </p>
                                <div className="flex flex-col justify-between sm:flex-row">
                                  {/* Price + Discount */}
                                  <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-start sm:gap-2">
                                    <div className="text-[15px] font-bold text-slate-900">
                                      {inr(p.discountPrice || p.price)}
                                    </div>

                                    {p.discountPrice && discountPercent && (
                                      <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-white shadow-sm">
                                        {discountPercent}% OFF
                                      </span>
                                    )}
                                  </div>

                                  {/* Customize Button */}
                                  {p.variants?.length ||
                                  p.addons?.length ||
                                  p.isEggOption ? (
                                    <Link href={`//product/${p.id}`}>
                                      <Button
                                        className="w-full mt-2"
                                        size="sm"
                                        style={{
                                          background: t.primaryColor,
                                          color: "white",
                                        }}
                                      >
                                        Customize →
                                      </Button>
                                    </Link>
                                  ) : (
                                    <>
                                      {cartCounts[p.id] > 0 ? (
                                        <div
                                          className="flex md:w-1/2 mt-2 h-8 items-center rounded-lg border overflow-hidden"
                                          style={{
                                            borderColor: t.primaryColor,
                                          }}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const item = items.find(
                                                (i) =>
                                                  i.productId === p.id &&
                                                  !i.variantLabel,
                                              );

                                              if (item) {
                                                if (item.qty > 1) {
                                                  updateQty(
                                                    item.lineId,
                                                    item.qty - 1,
                                                  );
                                                } else {
                                                  removeItem(item.lineId);
                                                }
                                              }
                                            }}
                                            className="flex grid-col-1 h-full w-1/3 items-center justify-center hover:bg-neutral-100"
                                          >
                                            <Minus className="h-4 w-4" />
                                          </button>

                                          <span className="flex w-1/3 h-full min-w-8 items-center justify-center px-1 text-sm font-bold">
                                            {cartCounts[p.id]}
                                          </span>

                                          <button
                                            type="button"
                                            onClick={() => quickAdd(p)}
                                            className="flex h-full w-1/3 items-center justify-center text-white"
                                            style={{
                                              background: t.primaryColor,
                                            }}
                                          >
                                            <Plus className="h-4 w-4" />
                                          </button>
                                        </div>
                                      ) : (
                                        <Button
                                          className="mt-2"
                                          size="sm"
                                          disabled={!p.available}
                                          onClick={() => quickAdd(p)}
                                          style={{
                                            background: t.primaryColor,
                                            color: "white",
                                          }}
                                        >
                                          <Plus className="h-4 w-4 mr-1" />
                                          Add
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </section>
          );
        })}
      </div>

      {totalItems > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 z-30"
        >
          <Link href={`//cart`}>
            <div
              className="rounded-2xl shadow-2xl px-5 py-3 flex items-center justify-between text-white cursor-pointer"
              style={{ background: t.primaryColor }}
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                <span className="font-semibold">
                  {totalItems} item{totalItems !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="font-bold">View cart →</div>
            </div>
          </Link>
        </motion.div>
      )}

      <footer className="border-t bg-white/60 pt-10">
        <div className="container mx-auto px-4 grid gap-6 md:grid-cols-3 text-sm text-muted-foreground">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              {t.name}
            </h3>
            <p className="mt-2 text-sm">{t.tagline}</p>
            {t.address && (
              <p className="mt-3 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {t.address}
              </p>
            )}
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Contact</h3>
            <div className="mt-3 space-y-2">
              {t.whatsappNumber && (
                <a
                  href={`https://wa.me/${t.whatsappNumber}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Phone className="h-4 w-4" />
                  WhatsApp: {t.whatsappNumber}
                </a>
              )}
              {t.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  {t.phone}
                </div>
              )}
              {t.email && (
                <a
                  href={`mailto:${t.email}`}
                  className="flex items-center gap-2 hover:underline"
                >
                  <span className="h-4 w-4 grid place-items-center">📧</span>
                  {t.email}
                </a>
              )}
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Follow</h3>
            <div className="mt-3 space-y-2">
              {t.socialLinks?.instagram && (
                <a
                  href={t.socialLinks.instagram}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Instagram className="h-4 w-4" />
                  Instagram
                </a>
              )}
              {t.socialLinks?.facebook && (
                <a
                  href={t.socialLinks.facebook}
                  className="flex items-center gap-2 hover:underline"
                >
                  <Facebook className="h-4 w-4" />
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>
        <div
          className="px-4 py-5 text-center mt-8 border-t border-white/20"
          style={{ backgroundColor: t.primaryColor }}
        >
          <p className="text-xs text-white/80">
            🇮🇳 Made with <span className="text-red-300">❤️</span> in India
            <span className="mx-2 text-white/30">·</span>
            Powered by{" "}
            <a
              href="https://indocia.in"
              className="font-semibold text-white hover:opacity-80 transition-opacity"
            >
              Indocia
            </a>
          </p>

          <p className="mt-2 text-[10px] text-white/50">
            © {new Date().getFullYear()} Indocia · All rights reserved
          </p>
        </div>
      </footer>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none} .no-scrollbar{scrollbar-width:none}`}</style>
    </div>
  );
}
