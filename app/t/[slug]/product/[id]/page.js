"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Star, Minus, Plus, ArrowLeft, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { getTenantUrl } from "@/lib/navigation";
import { toast } from "sonner";

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

export default function ProductDetail() {
  const { slug, id, cat } = useParams();
  const searchParams = useSearchParams();
  const catIcon = searchParams.get("cat");
  const router = useRouter();
  const [data, setData] = useState(null);
  const [imgIdx, setImgIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState({});
  const [selectedAddons, setSelectedAddons] = useState({});
  const [cakeMsg, setCakeMsg] = useState("");
  const [qty, setQty] = useState(1);
  const [imageError, setImageError] = useState(false);
  const { addItem, setTenant } = useCart();

  useEffect(() => {
    fetch(`/api/tenant/${slug}/product/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setTenant(slug);
        const init = {};
        d.product?.variants?.forEach((v, i) => {
          const key = v.id || `variant-${i}`;
          init[key] = 0;
        });
        setVariantIdx(init);
      });
  }, [slug, id]);

  if (!data?.product) return <div className="p-10 text-center">Loading...</div>;
  const p = data.product;
  const t = data.tenant;
  const base = p.discountPrice || p.price;
  let variantDelta = 0;
  const variantLabels = [];
  p.variants?.forEach((v, vi) => {
    const key = v.id || `variant-${vi}`;
    const opt = v.options[variantIdx[key] || 0];
    if (opt) {
      variantDelta += opt.priceDelta;
      variantLabels.push(`${v.name}: ${opt.label}`);
    }
  });
  const addonsPicked = (p.addons || []).filter((a, ai) => {
    const key = a.id || `addon-${ai}`;
    return selectedAddons[key];
  });
  const addonSum = addonsPicked.reduce((s, a) => s + a.price, 0);
  const unitPrice = base + variantDelta + addonSum;
  const total = unitPrice * qty;

  const addToCart = () => {
    addItem({
      productId: p.id,
      name: p.name,
      image: p.images?.[0],
      qty,
      unitPrice,
      variantLabel: variantLabels.join(" | ") || null,
      addons: addonsPicked.map((a) => ({ name: a.name, price: a.price })),
      cakeMessage: cakeMsg || null,
      diet: p.diet || "veg",
    });
    toast.success(`${p.name} added to cart`);
    router.push(getTenantUrl(slug, "/"));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-6">
        <Link
          href={getTenantUrl(slug, `/`)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to menu
        </Link>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <motion.div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow">
              {p.images?.[imgIdx] && !imageError ? (
                <img
                  src={p.images[imgIdx]}
                  alt={p.name}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl">
                  {catIcon || "🍽️"}
                </div>
              )}

              {/* Veg / Non-Veg */}
              {p.diet !== "all" && (
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur px-3 py-1 text-xs font-semibold text-slate-900 shadow-sm">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      p.diet === "nonveg" ? "bg-rose-600" : "bg-emerald-500"
                    }`}
                  />
                  {p.diet === "nonveg" ? "Non-Veg" : "Veg"}
                </div>
              )}
            </motion.div>

            {p.images?.length > 1 && (
              <div className="mt-3 flex gap-2">
                {p.images.map((im, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setImgIdx(i);
                      setImageError(false);
                    }}
                    className={`h-16 w-16 rounded-lg overflow-hidden border-2 ${
                      imgIdx === i ? "border-black" : "border-transparent"
                    }`}
                  >
                    <img
                      src={im}
                      alt=""
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="flex gap-2 mb-2">
              {p.badges?.map((b) => (
                <Badge
                  key={b}
                  style={{ background: t.primaryColor, color: "white" }}
                >
                  {b}
                </Badge>
              ))}
            </div>
            <h1 className="text-3xl font-black">{p.name}</h1>
            {p.rating && (
              <div className="mt-1 flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                {p.rating} rating
              </div>
            )}
            <p className="mt-3 text-muted-foreground">{p.description}</p>
            <div className="mt-4 text-2xl font-bold">{inr(base)}</div>

            {p.variants?.map((v, vi) => {
              const key = v.id || `variant-${vi}`;
              const selectedIndex = variantIdx[key] ?? 0;
              return (
                <div key={key} className="mt-6">
                  <Label className="text-sm font-semibold">{v.name}</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {v.options.map((o, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setVariantIdx({ ...variantIdx, [key]: i })
                        }
                        className={`px-4 py-2 rounded-full border-2 text-sm transition ${selectedIndex === i ? "text-white" : "bg-white text-neutral-500"}`}
                        style={
                          selectedIndex === i
                            ? {
                                background: t.primaryColor,
                                borderColor: t.primaryColor,
                              }
                            : { borderColor: "#D1D5DB" }
                        }
                      >
                        {o.label}
                        {i > 0 && o.priceDelta
                          ? ` (+${inr(o.priceDelta)})`
                          : ""}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {p.addons?.length > 0 && (
              <div className="mt-6">
                <Label className="text-sm font-semibold">Add-ons</Label>
                <div className="mt-2 space-y-2">
                  {p.addons.map((a, ai) => {
                    const key = a.id || `addon-${ai}`;
                    return (
                      <label
                        key={key}
                        className="flex items-center justify-between bg-white rounded-lg border p-3 cursor-pointer hover:border-neutral-400"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!selectedAddons[key]}
                            onChange={(e) =>
                              setSelectedAddons({
                                ...selectedAddons,
                                [key]: e.target.checked,
                              })
                            }
                          />
                          <span>{a.name}</span>
                        </div>
                        <span className="text-sm font-medium">
                          +{inr(a.price)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {p.allowCakeMessage && (
              <div className="mt-6">
                <Label className="text-sm font-semibold">
                  Message on cake / card (optional)
                </Label>
                <Textarea
                  value={cakeMsg}
                  onChange={(e) => setCakeMsg(e.target.value)}
                  placeholder="e.g. Happy Birthday, Aarav!"
                  maxLength={40}
                  className="mt-2"
                />
              </div>
            )}

            <div className="mt-8 flex items-center gap-4">
              <div className="flex items-center gap-2 border-2 rounded-full px-2 py-1">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="h-8 w-8 rounded-full hover:bg-neutral-100"
                >
                  <Minus className="h-4 w-4 mx-auto" />
                </button>
                <span className="w-6 text-center font-bold">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="h-8 w-8 rounded-full hover:bg-neutral-100"
                >
                  <Plus className="h-4 w-4 mx-auto" />
                </button>
              </div>
              <Button
                className="flex-1 h-12 text-base font-semibold"
                style={{ background: t.primaryColor, color: "white" }}
                onClick={addToCart}
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Add to cart — {inr(total)}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
