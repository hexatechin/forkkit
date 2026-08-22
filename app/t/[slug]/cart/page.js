"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Trash2,
  Minus,
  Plus,
  ArrowLeft,
  MessageCircle,
  ShoppingBag,
  CircleCheckBig,
  ExternalLink,
} from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { toast } from "sonner";
import { getTenantUrl } from "@/lib/navigation";

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

export default function CartPage() {
  const { slug } = useParams();

  const [tenant, setTenantData] = useState(null);

  const { items, updateQty, removeItem, clear } = useCart();

  const [mode, setMode] = useState("pickup");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    tableNumber: "",
    notes: "",
    occasion: "",
    scheduledAt: "",
  });

  const [placing, setPlacing] = useState(false);
  const [imageError, setImageError] = useState(false);

  // =========================================================
  // ORDER SUCCESS STATE
  // =========================================================

  const [orderSuccess, setOrderSuccess] = useState(null);

  // =========================================================
  // STORAGE KEY
  //
  // Each tenant gets its own saved order summary.
  // Example:
  // indocia-order-success-sodhi
  // =========================================================

  const orderStorageKey = slug ? `indocia-order-success-${String(slug)}` : null;

  // =========================================================
  // LOAD TENANT
  // =========================================================

  useEffect(() => {
    if (!slug) return;

    fetch(`/api/tenant/${slug}`)
      .then((r) => r.json())
      .then((d) => setTenantData(d.tenant))
      .catch(() => {
        toast.error("Failed to load store");
      });
  }, [slug]);

  // =========================================================
  // RESTORE ORDER SUMMARY AFTER PAGE REFRESH
  // =========================================================

  useEffect(() => {
    if (!orderStorageKey) return;

    try {
      const saved = localStorage.getItem(orderStorageKey);

      if (!saved) return;

      const parsed = JSON.parse(saved);

      if (parsed?.order) {
        setOrderSuccess(parsed);

        // Restore the mode/form that belonged to this order
        if (parsed.mode) {
          setMode(parsed.mode);
        }

        if (parsed.form) {
          setForm(parsed.form);
        }
      }
    } catch (error) {
      console.error("Failed to restore order summary:", error);

      // Remove corrupted data so it doesn't keep causing errors
      try {
        localStorage.removeItem(orderStorageKey);
      } catch {}
    }
  }, [orderStorageKey]);

  // =========================================================
  // SAVE ORDER SUMMARY WHEN IT CHANGES
  //
  // This makes sure the summary remains available even after
  // a browser refresh.
  // =========================================================

  useEffect(() => {
    if (!orderStorageKey || !orderSuccess) return;

    try {
      localStorage.setItem(
        orderStorageKey,
        JSON.stringify({
          ...orderSuccess,
          mode,
          form,
        }),
      );
    } catch (error) {
      console.error("Failed to save order summary:", error);
    }
  }, [orderSuccess, mode, form, orderStorageKey]);

  // =========================================================
  // CLEAR SAVED ORDER SUMMARY
  // =========================================================

  const clearSavedOrderSummary = () => {
    if (!orderStorageKey) return;

    try {
      localStorage.removeItem(orderStorageKey);
    } catch (error) {
      console.error("Failed to clear saved order summary:", error);
    }

    setOrderSuccess(null);

    setForm({
      name: "",
      phone: "",
      address: "",
      tableNumber: "",
      notes: "",
      occasion: "",
      scheduledAt: "",
    });

    setMode("pickup");
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (!tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  /*
   * =========================================================
   * ORDER SUCCESS / SUMMARY SCREEN
   * =========================================================
   */

  if (orderSuccess) {
    const order = orderSuccess.order;

    // Use the saved mode/form from the order if available.
    // This is important after a page refresh.
    const successMode = orderSuccess.mode || mode;

    const successForm = orderSuccess.form || form;

    const orderId = order?.id || order?.orderId || orderSuccess.orderId || null;

    const orderItems = order?.items?.length > 0 ? order.items : [];

    const orderSubtotal =
      order?.subtotal ??
      orderItems.reduce(
        (sum, item) =>
          sum + Number(item.unitPrice || 0) * Number(item.qty || 0),
        0,
      );

    const orderDeliveryFee =
      order?.deliveryFee ??
      (successMode === "delivery" ? tenant.deliveryFee || 0 : 0);

    const orderTotal =
      order?.total ?? orderSubtotal + Number(orderDeliveryFee || 0);

    return (
      <div
        className="min-h-screen"
        style={{
          background: tenant.bgTint || "#fafafa",
        }}
      >
        <div className="container mx-auto max-w-2xl px-4 py-8 sm:py-12">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.4,
            }}
          >
            <Card className="overflow-hidden">
              {/* =================================================
                  SUCCESS HEADER
              ================================================= */}

              <div
                className="px-6 py-10 text-center text-white sm:px-10"
                style={{
                  background: `linear-gradient(135deg, ${"#0c9a40"}, ${"#48c268"})`,
                }}
              >
                <motion.div
                  initial={{
                    scale: 0.5,
                    opacity: 0,
                  }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15,
                  }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20 backdrop-blur"
                >
                  <CircleCheckBig className="h-11 w-11 text-white" />
                </motion.div>

                <h1 className="mt-5 text-3xl font-black">Order Created! 🎉</h1>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/90">
                  Your order has been created successfully. WhatsApp has been
                  opened so you can send your order directly to the store.
                </p>
              </div>

              {/* =================================================
                  ORDER SUMMARY
              ================================================= */}

              <div className="p-5 sm:p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold">Your order</h2>

                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      background: `${tenant.primaryColor || "#f97316"}15`,
                      color: tenant.primaryColor || "#f97316",
                    }}
                  >
                    {successMode === "delivery"
                      ? "🚚 Delivery"
                      : successMode === "dine-in"
                        ? "🍽️ Dine-in"
                        : "🏪 Pickup"}
                  </span>
                </div>

                {/* =================================================
                    ITEMS
                ================================================= */}

                <div className="space-y-4">
                  {orderItems.length > 0 ? (
                    orderItems.map((item, index) => (
                      <div
                        key={`${
                          item.productId || item.name || "item"
                        }-${index}`}
                        className="flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="font-medium text-slate-900">
                            {item.qty} × {item.name}
                          </div>

                          {item.variantLabel && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              {item.variantLabel}
                            </div>
                          )}

                          {item.addons?.length > 0 && (
                            <div className="mt-0.5 text-xs text-muted-foreground">
                              + {item.addons.map((a) => a.name).join(", ")}
                            </div>
                          )}

                          {item.cakeMessage && (
                            <div className="mt-0.5 text-xs italic text-muted-foreground">
                              “{item.cakeMessage}”
                            </div>
                          )}
                        </div>

                        <div className="shrink-0 font-semibold">
                          {inr(
                            Number(item.unitPrice || 0) * Number(item.qty || 0),
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl bg-slate-50 p-4 text-center text-sm text-muted-foreground">
                      Your order items have been successfully added.
                    </div>
                  )}
                </div>

                {/* =================================================
                    TOTALS
                ================================================= */}

                <div className="mt-6 space-y-2 border-t pt-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>

                    <span>{inr(orderSubtotal)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {successMode === "delivery"
                        ? "Delivery"
                        : successMode === "dine-in"
                          ? "Dine-in"
                          : "Pickup"}
                    </span>

                    <span>{inr(orderDeliveryFee)}</span>
                  </div>

                  <div className="flex justify-between border-t pt-3 text-base font-black">
                    <span>Total</span>

                    <span>{inr(orderTotal)}</span>
                  </div>
                </div>

                {/* =================================================
                    CUSTOMER / ORDER DETAILS
                ================================================= */}

                <div className="mt-6 rounded-xl bg-slate-50 p-4">
                  <h3 className="mb-3 text-sm font-bold">Order details</h3>

                  <div className="space-y-2 text-sm">
                    {successForm.phone && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Phone</span>

                        <span className="font-medium">{successForm.phone}</span>
                      </div>
                    )}

                    {successMode === "delivery" && successForm.address && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Address</span>

                        <span className="max-w-[65%] text-right font-medium">
                          {successForm.address}
                        </span>
                      </div>
                    )}

                    {successMode === "dine-in" && successForm.tableNumber && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">
                          Table number
                        </span>

                        <span className="font-medium">
                          {successForm.tableNumber}
                        </span>
                      </div>
                    )}

                    {successForm.scheduledAt && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Scheduled</span>

                        <span className="max-w-[65%] text-right font-medium">
                          {new Date(successForm.scheduledAt).toLocaleString(
                            "en-IN",
                          )}
                        </span>
                      </div>
                    )}

                    {successForm.notes && (
                      <div className="flex justify-between gap-4">
                        <span className="text-muted-foreground">Notes</span>

                        <span className="max-w-[65%] text-right font-medium">
                          {successForm.notes}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* =================================================
                    WHATSAPP AGAIN
                ================================================= */}

                {orderSuccess.whatsappUrl && (
                  <Button
                    onClick={() => {
                      window.open(orderSuccess.whatsappUrl, "_blank");
                    }}
                    className="mt-6 h-12 w-full text-base font-bold"
                    style={{
                      background: "#25D366",
                      color: "white",
                    }}
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Open WhatsApp Again
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                )}

                <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                  Please send the WhatsApp message to confirm your order with
                  the store.
                </p>

                {/* =================================================
                    CONTINUE SHOPPING
                ================================================= */}

                <Link
                  href={getTenantUrl(slug, "/")}
                  onClick={() => {
                    clearSavedOrderSummary();
                  }}
                  className="mt-4 block"
                >
                  <Button
                    variant="outline"
                    className="w-full"
                    style={{
                      borderColor: tenant.primaryColor,
                      color: tenant.primaryColor,
                    }}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Continue shopping
                  </Button>
                </Link>
              </div>
            </Card>

            {/* =================================================
                THANK YOU
            ================================================= */}

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Thank you for ordering from{" "}
                <span className="font-semibold text-foreground">
                  {tenant.name}
                </span>{" "}
                ❤️
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * CART CALCULATIONS
   * =========================================================
   */

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);

  const deliveryFee = mode === "delivery" ? tenant.deliveryFee || 0 : 0;

  const total = subtotal + deliveryFee;

  const belowMin = subtotal < (tenant.minOrder || 0) && mode === "delivery";

  /*
   * =========================================================
   * PLACE ORDER
   * =========================================================
   */

  const placeOrder = async () => {
    if (!items.length) {
      return toast.error("Cart is empty");
    }

    if (!form.phone) {
      return toast.error("Phone number is required");
    }

    if (!/^\d{10}$/.test(form.phone)) {
      return toast.error("Please enter a valid 10 digit phone number");
    }

    if (mode === "delivery" && !form.address) {
      return toast.error("Delivery address is required");
    }

    if (mode === "dine-in" && !form.tableNumber) {
      return toast.error("Table number is required");
    }

    if (belowMin) {
      return toast.error(`Minimum order is ${inr(tenant.minOrder)}`);
    }

    setPlacing(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          tenantSlug: slug,

          customer: {
            name: form.name,
            phone: form.phone,
            address: form.address,
            tableNumber: mode === "dine-in" ? form.tableNumber : "",
          },

          mode,

          scheduledAt: form.scheduledAt,
          occasion: form.occasion,
          notes: form.notes,

          cakeMessage: items.find((i) => i.cakeMessage)?.cakeMessage || null,

          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
            variantLabel: i.variantLabel,
            addons: i.addons,
            cakeMessage: i.cakeMessage,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create order");
      }

      /*
       * =====================================================
       * BUILD ORDER SUMMARY
       * =====================================================
       */

      const createdOrder = {
        ...(data.order || {}),

        items:
          data.order?.items ||
          items.map((i) => ({
            productId: i.productId,
            name: i.name,
            qty: i.qty,
            unitPrice: i.unitPrice,
            variantLabel: i.variantLabel,
            addons: i.addons,
            cakeMessage: i.cakeMessage,
          })),

        subtotal: data.order?.subtotal ?? subtotal,

        deliveryFee: data.order?.deliveryFee ?? deliveryFee,

        total: data.order?.total ?? total,

        id: data.order?.id || data.orderId || data.id || null,
      };

      /*
       * =====================================================
       * CREATE COMPLETE SUCCESS OBJECT
       *
       * IMPORTANT:
       * We store mode + form together with the order so that
       * after refresh the exact same summary can be restored.
       * =====================================================
       */

      const successData = {
        order: createdOrder,

        orderId: data.order?.id || data.orderId || data.id || null,

        whatsappUrl: data.whatsappUrl || null,

        mode,

        form: {
          ...form,
        },
      };

      /*
       * =====================================================
       * SAVE TO LOCAL STORAGE FIRST
       *
       * This is intentionally done BEFORE setOrderSuccess().
       * Therefore even if the page refreshes immediately after
       * order creation, the summary is already persisted.
       * =====================================================
       */

      if (orderStorageKey) {
        try {
          localStorage.setItem(orderStorageKey, JSON.stringify(successData));
        } catch (storageError) {
          console.error("Failed to persist order summary:", storageError);
        }
      }

      /*
       * =====================================================
       * SET SUCCESS STATE
       * =====================================================
       */

      setOrderSuccess(successData);

      /*
       * =====================================================
       * CLEAR CART
       * =====================================================
       */

      clear();

      toast.success("Order created successfully!");

      /*
       * =====================================================
       * OPEN WHATSAPP
       *
       * This is intentionally done immediately after the
       * user's button click so browsers are less likely to
       * block the popup.
       * =====================================================
       */

      if (data.whatsappUrl) {
        window.open(data.whatsappUrl, "_blank");
      }
    } catch (e) {
      console.error(e);

      toast.error(e.message || "Failed to create order");
    } finally {
      setPlacing(false);
    }
  };

  /*
   * =========================================================
   * EMPTY CART
   * =========================================================
   */

  return (
    <div
      className="min-h-screen"
      style={{
        background: tenant.bgTint || "#fafafa",
      }}
    >
      <div className="container mx-auto max-w-5xl px-4 py-6">
        {/* BACK */}

        <Link
          href={getTenantUrl(slug, "/")}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue shopping
        </Link>

        <h1 className="mb-6 text-3xl font-black">Your order</h1>

        {items.length === 0 ? (
          <Card className="p-10 text-center">
            <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300" />

            <p className="mt-4 text-muted-foreground">Your cart is empty</p>

            <Link href={getTenantUrl(slug, "/")}>
              <Button
                className="mt-4"
                style={{
                  background: tenant.primaryColor,
                  color: "white",
                }}
              >
                Browse menu
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {/* =================================================
                CART ITEMS
            ================================================= */}

            <div className="space-y-3 md:col-span-2">
              {items.map((i) => (
                <motion.div
                  key={i.lineId}
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  <Card className="flex gap-4 p-4">
                    {/* IMAGE */}

                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      {!i.image || imageError ? (
                        <div className="flex h-full w-full items-center justify-center text-3xl">
                          {i.catIcon || "🍽️"}
                        </div>
                      ) : (
                        <img
                          src={i.image}
                          alt={i.name}
                          className="h-full w-full object-cover"
                          onError={() => setImageError(true)}
                        />
                      )}

                      {i.diet && i.diet !== "all" && (
                        <div className="absolute left-1 top-1 inline-flex items-center gap-1 rounded-full bg-white/90 px-1 py-1 text-[10px] font-semibold text-slate-900 shadow-sm backdrop-blur">
                          <span
                            className={`h-2 w-2 rounded-full ${
                              i.diet === "nonveg"
                                ? "bg-rose-600"
                                : "bg-emerald-500"
                            }`}
                          />
                        </div>
                      )}
                    </div>

                    {/* DETAILS */}

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold">{i.name}</div>

                      {i.variantLabel && (
                        <div className="text-xs text-muted-foreground">
                          {i.variantLabel}
                        </div>
                      )}

                      {i.addons?.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          + {i.addons.map((a) => a.name).join(", ")}
                        </div>
                      )}

                      {i.cakeMessage && (
                        <div className="text-xs italic text-muted-foreground">
                          “{i.cakeMessage}”
                        </div>
                      )}

                      <div className="mt-2 flex items-center justify-between">
                        {/* QTY */}

                        <div className="flex items-center gap-2 rounded-full border px-2 py-0.5">
                          <button
                            onClick={() => updateQty(i.lineId, i.qty - 1)}
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>

                          <span className="w-6 text-center text-sm font-bold">
                            {i.qty}
                          </span>

                          <button
                            onClick={() => updateQty(i.lineId, i.qty + 1)}
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="font-bold">
                          {inr(i.unitPrice * i.qty)}
                        </div>
                      </div>
                    </div>

                    {/* DELETE */}

                    <button
                      onClick={() => removeItem(i.lineId)}
                      className="self-start text-neutral-400 transition hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </Card>
                </motion.div>
              ))}

              {/* =================================================
                  ORDER DETAILS
              ================================================= */}

              <Card className="mt-6 p-5">
                <h2 className="mb-4 font-bold">Order details</h2>

                {/* MODE */}

                <div className="mb-4 flex gap-2">
                  {["pickup", "delivery", "dine-in"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`flex-1 rounded-lg border-2 py-2 text-sm font-medium capitalize ${
                        mode === m ? "text-white" : "bg-white"
                      }`}
                      style={
                        mode === m
                          ? {
                              background: tenant.primaryColor,
                              borderColor: tenant.primaryColor,
                            }
                          : {}
                      }
                    >
                      {m === "delivery" ? (
                        <span className="flex flex-col items-center leading-tight">
                          <span>🚚 Delivery</span>

                          <span className="text-[10px] opacity-80">
                            (Contact store)
                          </span>
                        </span>
                      ) : m === "dine-in" ? (
                        "🍽️ Dine-in"
                      ) : (
                        "🏪 Pickup"
                      )}
                    </button>
                  ))}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* PHONE */}

                  <div>
                    <Label>Phone*</Label>

                    <Input
                      value={form.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");

                        if (value.length <= 10) {
                          setForm({
                            ...form,
                            phone: value,
                          });
                        }
                      }}
                      maxLength={10}
                      type="tel"
                      placeholder="9876543210"
                    />
                  </div>

                  {/* SCHEDULE */}

                  <div>
                    <Label>Scheduled date/time (optional)</Label>

                    <Input
                      type="datetime-local"
                      value={form.scheduledAt}
                      min={new Date().toISOString().slice(0, 16)}
                      onChange={(e) => {
                        if (new Date() > new Date(e.target.value)) return;

                        setForm({
                          ...form,
                          scheduledAt: e.target.value,
                        });
                      }}
                    />
                  </div>

                  {/* TABLE */}

                  {mode === "dine-in" && (
                    <div>
                      <Label>Table Number*</Label>

                      <Input
                        value={form.tableNumber}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            tableNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. 5"
                        maxLength={10}
                      />
                    </div>
                  )}

                  {/* ADDRESS */}

                  {mode === "delivery" && (
                    <div className="sm:col-span-2">
                      <Label>Address*</Label>

                      <Textarea
                        value={form.address}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            address: e.target.value,
                          })
                        }
                        rows={2}
                        placeholder="Enter your delivery address"
                      />
                    </div>
                  )}

                  {/* NOTES */}

                  <div className="sm:col-span-2">
                    <Label>Special instructions</Label>

                    <Textarea
                      rows={2}
                      value={form.notes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          notes: e.target.value,
                        })
                      }
                      maxLength={100}
                      placeholder="Any special instructions..."
                    />
                  </div>
                </div>
              </Card>
            </div>

            {/* =================================================
                SUMMARY
            ================================================= */}

            <div>
              <Card className="sticky top-4 p-5">
                <h2 className="mb-3 font-bold">Summary</h2>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal</span>

                    <span>{inr(subtotal)}</span>
                  </div>

                  <div className="flex justify-between text-muted-foreground">
                    <span>
                      {mode === "delivery"
                        ? "Delivery"
                        : mode === "dine-in"
                          ? "Dine-in"
                          : "Pickup"}
                    </span>

                    <span>{inr(deliveryFee)}</span>
                  </div>

                  <div className="flex justify-between border-t pt-2 text-base font-bold">
                    <span>Total</span>

                    <span>{inr(total)}</span>
                  </div>
                </div>

                {/* MINIMUM ORDER */}

                {belowMin && (
                  <div className="mt-3 text-xs text-red-600">
                    Minimum order is {inr(tenant.minOrder)}. Add more items.
                  </div>
                )}

                {/* PREP TIME */}

                <div className="mt-3 text-xs text-muted-foreground">
                  Estimated ready in ~{tenant.prepTimeMins} min
                </div>

                {/* PLACE ORDER */}

                <Button
                  disabled={placing || belowMin}
                  onClick={placeOrder}
                  className="mt-4 h-12 w-full font-semibold"
                  style={{
                    background: "#25D366",
                    color: "white",
                  }}
                >
                  {placing ? (
                    <>
                      <span className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Creating order...
                    </>
                  ) : (
                    <>
                      <MessageCircle className="mr-2 h-5 w-5" />
                      Place order via WhatsApp
                    </>
                  )}
                </Button>

                <p className="mt-2 text-center text-xs text-muted-foreground">
                  WhatsApp will open automatically after your order is created.
                </p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
