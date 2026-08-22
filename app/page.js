"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ArrowRight,
  Sparkles,
  MessageCircle,
  Rocket,
  Store,
  Zap,
  Shield,
} from "lucide-react";
import { getTenantUrl } from "@/lib/navigation";

export default function Landing() {
  const [tenants, setTenants] = useState([]);
  const heroRef = useRef(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useTransform(my, [-0.5, 0.5], [8, -8]);
  const rotY = useTransform(mx, [-0.5, 0.5], [-12, 12]);

  useEffect(() => {
    fetch("/api/seed", { method: "POST" })
      .then(async (r) => {
        console.log("SEED STATUS:", r.status);
        console.log("SEED RESPONSE:", await r.text());
      })
      .catch((err) => {
        console.error("SEED FETCH ERROR:", err);
      })
      .finally(() => {
        fetch("/api/tenants")
          .then(async (r) => {
            const text = await r.text();
            try {
              const d = JSON.parse(text);
              setTenants(d.tenants || []);
            } catch (e) {
              console.error("TENANTS JSON ERROR:", e);
            }
          })
          .catch((err) => {
            console.error("TENANTS FETCH ERROR:", err);
          });
      });
  }, []);

  const onMove = (e) => {
    const rect = heroRef.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width - 0.5);
    my.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const businesses = [
    { icon: "🎂", label: "Bakeries" },
    { icon: "🌸", label: "Florists" },
    { icon: "🍱", label: "Tiffin services" },
    { icon: "🎁", label: "Gift shops" },
    { icon: "☕", label: "Cafés" },
    { icon: "💼", label: "Coworking" },
    { icon: "🍕", label: "Cloud kitchens" },
    { icon: "👗", label: "Boutiques" },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-x-hidden">
      {/* Glass nav */}
      <nav className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-neutral-950/70 border-b border-white/10">
        <div className="container mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <span className="inline-flex h-10 w-24 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-500 text-white shadow-lg shadow-rose-500/30">
              <img
                src="/indocia.png"
                alt="Indocia"
                className="h-12 w-24 rounded-xl object-cover"
              />
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/login"
              className="text-sm text-white/70 hover:text-white transition"
            >
              Sign in
            </Link>
            <Link href="/signup">
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95"
              >
                Start free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section
        ref={heroRef}
        onMouseMove={onMove}
        className="relative pt-36 pb-24"
      >
        {/* Animated gradient mesh */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-orange-500/30 blur-3xl animate-pulse" />
          <div
            className="absolute top-20 -right-32 h-[500px] w-[500px] rounded-full bg-fuchsia-500/30 blur-3xl animate-pulse"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute bottom-0 left-1/3 h-[400px] w-[400px] rounded-full bg-amber-400/20 blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_60%,rgba(0,0,0,0.4))]" />
        </div>

        {/* Floating emojis */}
        {[
          { e: "🎂", t: "8%", l: "6%", d: 0 },
          { e: "🌸", t: "70%", l: "8%", d: 1.2 },
          { e: "☕", t: "22%", l: "92%", d: 0.7 },
          { e: "🎁", t: "78%", l: "88%", d: 1.8 },
          { e: "💼", t: "55%", l: "4%", d: 2.5 },
        ].map((f, i) => (
          <motion.div
            key={i}
            className="absolute text-4xl md:text-6xl pointer-events-none opacity-40 select-none"
            style={{ top: f.t, left: f.l }}
            animate={{ y: [0, -18, 0], rotate: [-4, 4, -4] }}
            transition={{
              duration: 5 + i,
              repeat: Infinity,
              delay: f.d,
              ease: "easeInOut",
            }}
          >
            {f.e}
          </motion.div>
        ))}

        <div className="container mx-auto px-6 relative">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 backdrop-blur px-3 py-1 text-xs mb-6">
                <Sparkles className="h-3.5 w-3.5 text-amber-400" /> India's
                simplest way to sell on WhatsApp
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95]">
                Your shop.
                <br />
                <span className="bg-gradient-to-r from-orange-400 via-rose-400 to-fuchsia-400 bg-clip-text text-transparent">
                  Online in 60 seconds.
                </span>
              </h1>
              <p className="mt-6 text-lg text-white/70 max-w-lg">
                Beautiful storefronts for bakeries, florists, tiffin services,
                cafés and coworking spaces. Customers browse and customize —
                orders arrive on your WhatsApp.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="h-12 px-6 bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-95 shadow-[0_10px_40px_-10px_rgba(251,113,133,0.6)]"
                  >
                    Start free <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#demos">
                  <Button
                    size="lg"
                    variant="outline"
                    className="h-12 border-white/20 bg-white/5 hover:bg-white/10 text-white hover:text-white"
                  >
                    Live demos
                  </Button>
                </a>
              </div>
              <p className="mt-4 text-xs text-white/50">
                No credit card · Free forever plan · Setup in 60s
              </p>
            </motion.div>

            {/* 3D Phone Mockup */}
            <motion.div
              style={{
                rotateX: rotX,
                rotateY: rotY,
                transformPerspective: 1200,
                transformStyle: "preserve-3d",
              }}
              className="relative mx-auto hidden md:block"
            >
              <div className="relative h-[580px] w-[290px]">
                {/* Glow behind phone */}
                <div className="absolute -inset-10 bg-gradient-to-br from-orange-500/40 via-rose-500/30 to-fuchsia-500/30 blur-3xl rounded-full" />
                {/* Phone */}
                <div className="relative h-full w-full rounded-[48px] bg-gradient-to-b from-neutral-800 to-neutral-950 shadow-2xl border-4 border-neutral-800 p-2">
                  <div className="h-full w-full rounded-[38px] overflow-hidden relative bg-gradient-to-b from-amber-50 to-white">
                    <div
                      className="h-36 w-full relative"
                      style={{
                        backgroundImage:
                          "url(https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80)",
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                      <div className="absolute bottom-2 left-3 text-white">
                        <div className="text-xs font-bold">Royal Bakery</div>
                        <div className="text-[9px] opacity-80">
                          Handcrafted cakes
                        </div>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="flex gap-1.5 overflow-hidden">
                        <span className="text-[9px] bg-amber-700 text-white px-2 py-0.5 rounded-full whitespace-nowrap">
                          🎂 Cakes
                        </span>
                        <span className="text-[9px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          🥐 Pastries
                        </span>
                        <span className="text-[9px] bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                          🍞 Breads
                        </span>
                      </div>
                      <div className="rounded-lg overflow-hidden shadow-sm border border-neutral-200">
                        <div
                          className="h-20 w-full bg-cover"
                          style={{
                            backgroundImage:
                              "url(https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400)",
                          }}
                        />
                        <div className="p-2">
                          <div className="text-[10px] font-bold text-neutral-900">
                            Chocolate Truffle
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <div className="text-[10px] font-bold text-amber-800">
                              ₹1,199
                            </div>
                            <button className="text-[8px] bg-amber-700 text-white px-2 py-0.5 rounded-full">
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg overflow-hidden shadow-sm border border-neutral-200">
                        <div
                          className="h-16 w-full bg-cover"
                          style={{
                            backgroundImage:
                              "url(https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400)",
                          }}
                        />
                        <div className="p-2">
                          <div className="text-[10px] font-bold text-neutral-900">
                            Butter Croissant
                          </div>
                          <div className="flex items-center justify-between mt-0.5">
                            <div className="text-[10px] font-bold text-amber-800">
                              ₹120
                            </div>
                            <button className="text-[8px] bg-amber-700 text-white px-2 py-0.5 rounded-full">
                              + Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 rounded-full bg-amber-700 text-white text-[10px] font-bold px-3 py-2 flex justify-between shadow-lg">
                      <span>2 items</span>
                      <span>Checkout →</span>
                    </div>
                  </div>
                  <div className="absolute top-3 left-1/2 -translate-x-1/2 h-5 w-24 rounded-full bg-neutral-950" />
                </div>
                {/* Floating WhatsApp message */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0, y: [0, -8, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -right-24 top-32 hidden lg:block"
                >
                  <div className="rounded-2xl rounded-tr-none bg-green-500 text-white p-3 shadow-2xl w-56">
                    <div className="text-[10px] opacity-90 flex items-center gap-1">
                      <MessageCircle className="h-2.5 w-2.5" />
                      New order · just now
                    </div>
                    <div className="mt-1 text-xs font-bold">
                      🎂 Chocolate Truffle × 1
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-90">
                      Deliver at 6 PM · ₹1,199
                    </div>
                  </div>
                </motion.div>
                {/* Floating badge */}
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [-2, 2, -2] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -left-12 top-16 hidden lg:block"
                >
                  <div className="rounded-2xl bg-white text-neutral-900 p-3 shadow-2xl">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                        ✨
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500">
                          Setup time
                        </div>
                        <div className="text-sm font-bold">60 seconds</div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="py-6 border-y border-white/10 overflow-hidden bg-black/40">
        <div className="flex gap-10 whitespace-nowrap animate-marquee">
          {[...businesses, ...businesses, ...businesses].map((b, i) => (
            <div
              key={i}
              className="inline-flex items-center gap-2 text-base text-white/50 shrink-0"
            >
              <span className="text-2xl">{b.icon}</span>
              <span className="font-medium">{b.label}</span>
              <span className="ml-6 text-white/20">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-6 py-24">
        <h2 className="text-4xl md:text-5xl font-black text-center leading-tight">
          From click to WhatsApp,
          <br />
          <span className="bg-gradient-to-r from-orange-400 to-fuchsia-400 bg-clip-text text-transparent">
            effortlessly.
          </span>
        </h2>
        <div className="mt-16 grid md:grid-cols-4 gap-5">
          {[
            {
              n: "01",
              icon: Rocket,
              title: "Sign up",
              desc: "Pick your business type. Go live.",
            },
            {
              n: "02",
              icon: Store,
              title: "Add products",
              desc: "Photos, prices, add-ons, variants.",
            },
            {
              n: "03",
              icon: Zap,
              title: "Share your link",
              desc: "Instagram bio, WhatsApp, QR code.",
            },
            {
              n: "04",
              icon: MessageCircle,
              title: "Get orders",
              desc: "Straight into your WhatsApp.",
            },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -10, rotateX: 6, rotateY: -4 }}
              style={{
                transformPerspective: 800,
                transformStyle: "preserve-3d",
              }}
            >
              <Card className="p-6 h-full bg-white/5 border-white/10 backdrop-blur-md hover:border-white/30 transition-all">
                <div className="text-5xl font-black bg-gradient-to-b from-orange-400 to-rose-500 bg-clip-text text-transparent">
                  {s.n}
                </div>
                <s.icon className="h-7 w-7 mt-4 text-orange-400" />
                <div className="mt-3 text-lg font-bold text-white">
                  {s.title}
                </div>
                <div className="mt-1 text-sm text-white/60">{s.desc}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* WhatsApp Demo */}
      <section className="container mx-auto px-6 py-24">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-black leading-tight">
              Every order arrives
              <br />
              ready to confirm.
            </h2>
            <p className="mt-4 text-white/70 text-lg">
              No more asking "what size?", "delivery time?". Every WhatsApp
              message includes it all. Just reply — "Confirmed. Delivering by 6
              PM 🚀".
            </p>
            <ul className="mt-6 space-y-3 text-white/80">
              <li className="flex gap-2">
                <Shield className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                Keep using WhatsApp — no new app to learn
              </li>
              <li className="flex gap-2">
                <Shield className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                Customers see prices, discounts and availability upfront
              </li>
              <li className="flex gap-2">
                <Shield className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
                Fewer missed enquiries, cleaner order details
              </li>
            </ul>
          </div>
          <motion.div
            whileHover={{ rotateY: -6, rotateX: 4 }}
            style={{
              transformPerspective: 1000,
              transformStyle: "preserve-3d",
            }}
            className="relative"
          >
            <div className="absolute -inset-6 bg-gradient-to-br from-green-500/30 to-emerald-400/10 blur-3xl rounded-full" />
            <Card className="relative p-5 bg-white text-neutral-900 shadow-2xl border-0">
              <div className="flex items-center gap-2 pb-3 border-b">
                <div className="h-9 w-9 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                  RB
                </div>
                <div>
                  <div className="font-semibold text-sm">Royal Bakery</div>
                  <div className="text-xs text-neutral-500">
                    WhatsApp Business
                  </div>
                </div>
              </div>
              <div className="mt-3 whitespace-pre-wrap text-xs text-neutral-700 font-mono leading-relaxed">
                {`*New Order — Royal Bakery*
Order ID: 8A2F91

*Customer:* Aarav Sharma
*Phone:* +91 98xxxx1234
*Address:* 12, Rose Lane, Bengaluru
*Mode:* 🚚 Delivery
*Scheduled:* Sat 6:00 PM
*Occasion:* Birthday
*Cake message:* Happy Bday Aarav!

*Items:*
  • 1 × Chocolate Truffle Cake
    (Size: 1 kg | Candles)
    — ₹1,199

*Total:* ₹1,199`}
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Demos */}
      <section id="demos" className="container mx-auto px-6 py-24">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black">See it in action.</h2>
          <p className="mt-3 text-white/70">
            Real storefronts running on Indocia right now.
          </p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {tenants.slice(0, 4).map((t) => (
            <motion.div
              key={t.slug}
              whileHover={{ y: -8, rotateY: -4 }}
              style={{
                transformPerspective: 800,
                transformStyle: "preserve-3d",
              }}
            >
              <Link href={getTenantUrl(t.slug)}>
                <Card className="overflow-hidden cursor-pointer bg-white/5 border-white/10 hover:border-white/40 transition-all">
                  <div
                    className="h-44 relative"
                    style={{
                      backgroundImage: `url(${t.banner})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-[10px] uppercase tracking-wider opacity-70">
                        {t.slug}.indocia.in
                      </div>
                      <div className="text-lg font-bold">{t.name}</div>
                    </div>
                  </div>
                  <div className="p-4 text-xs text-white/60 flex items-center justify-between">
                    <span className="line-clamp-1">{t.tagline}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-60" />
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-24">
        <motion.div
          whileHover={{ rotateX: 2, scale: 1.01 }}
          style={{ transformPerspective: 1000 }}
        >
          <Card className="p-14 text-center bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-500 text-white border-0 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-black/20 blur-3xl" />
            <div className="relative">
              <motion.div
                animate={{ y: [0, -8, 0], rotate: [-4, 4, -4] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                🚀
              </motion.div>
              <h2 className="text-4xl md:text-5xl font-black">
                Your storefront. In 60 seconds.
              </h2>
              <p className="mt-3 opacity-90 text-lg">
                Free forever plan. No credit card. Cancel anytime.
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="mt-8 h-14 px-8 text-base bg-white text-neutral-900 hover:bg-white/90 shadow-2xl"
                >
                  Create my storefront <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </motion.div>
      </section>

      <footer className="border-t border-white/10 py-8 text-center text-xs text-white/40">
        Indocia · Built for local businesses across India · WhatsApp-first
        commerce
      </footer>

      <style jsx global>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.333%);
          }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
