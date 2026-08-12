"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Package,
  ClipboardList,
  IndianRupee,
  Users,
  Copy,
  Share2,
  ExternalLink,
  MessageCircle,
  X,
  Sparkles,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function AdminDashboard() {
  const params = useSearchParams();
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    revenue: 0,
    categories: 0,
  });
  const [recent, setRecent] = useState([]);
  const [analytics, setAnalytics] = useState({ days: [], top: [] });
  const [tenant, setTenant] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (params.get("welcome")) setShowWelcome(true);
    const t = localStorage.getItem("indocia-token");
    Promise.all([
      fetch("/api/admin/products", {
        headers: { Authorization: `Bearer ${t}` },
      }).then((r) => r.json()),
      fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${t}` },
      }).then((r) => r.json()),
      fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${t}` },
      }).then((r) => r.json()),
      fetch("/api/admin/me", {
        headers: { Authorization: `Bearer ${t}` },
      }).then((r) => r.json()),
    ]).then(([p, o, a, m]) => {
      setStats({
        products: (p.products || []).length,
        orders: (o.orders || []).length,
        revenue: (o.orders || []).reduce((s, x) => s + x.total, 0),
        categories: (p.categories || []).length,
      });
      setRecent((o.orders || []).slice(0, 5));
      setAnalytics(a || { days: [], top: [] });
      setTenant(m.tenant);
    });
  }, []);

  const Stat = ({ icon: Icon, label, value, color }) => (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}
        >
          <Icon className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  );

  const storefrontUrl = tenant
    ? `${typeof window !== "undefined" ? (window.location.hostname.includes("indocia") ? `${tenant.slug}.${window.location.hostname}` : window.location.origin) : ""}/t/${tenant.slug}`
    : "";
  const qrUrl = storefrontUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(storefrontUrl)}`
    : "";
  const copyLink = () => {
    navigator.clipboard.writeText(storefrontUrl);
    toast.success("Link copied");
  };
  const shareWA = () =>
    window.open(
      `https://wa.me/?text=${encodeURIComponent(`Order from ${tenant.name}: ${storefrontUrl}`)}`,
      "_blank",
    );

  return (
    <div>
      {showWelcome && (
        <Card className="p-5 mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-rose-50 relative">
          <button
            onClick={() => setShowWelcome(false)}
            className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-lg">
                Your storefront is live! 🎉
              </div>
              <div className="text-sm text-muted-foreground">
                Next steps: add products, then share your link on Instagram bio
                / Google profile / WhatsApp status.
              </div>
              <div className="mt-3 flex gap-2">
                <Link href="/admin/products">
                  <Button
                    size="sm"
                    className="bg-gradient-to-r from-orange-500 to-rose-500"
                  >
                    Add products
                  </Button>
                </Link>
                <Link href="/admin/settings">
                  <Button size="sm" variant="outline">
                    Customize branding
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Card>
      )}

      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {tenant?.name && `Welcome back, ${tenant.name}`}
      </p>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Stat
          icon={Package}
          label="Products"
          value={stats.products}
          color="bg-blue-500"
        />
        <Stat
          icon={ClipboardList}
          label="Orders"
          value={stats.orders}
          color="bg-orange-500"
        />
        <Stat
          icon={IndianRupee}
          label="Revenue"
          value={inr(stats.revenue)}
          color="bg-green-500"
        />
        <Stat
          icon={Users}
          label="Categories"
          value={stats.categories}
          color="bg-rose-500"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="p-5 lg:col-span-1">
          <h3 className="font-bold flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            Share your storefront
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Add to Instagram bio, Google profile, or share directly with
            customers.
          </p>
          {tenant && (
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border p-3 bg-neutral-50 text-xs break-all font-mono">
                {storefrontUrl}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={copyLink}
                  variant="outline"
                  className="flex-1"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy link
                </Button>
                <Button
                  size="sm"
                  onClick={shareWA}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                >
                  <MessageCircle className="h-3.5 w-3.5 mr-1" />
                  WhatsApp
                </Button>
              </div>
              <Link
                href={`${tenant.slug}.${window.location.host}`}
                target="_blank"
                className="block"
              >
                <Button size="sm" variant="ghost" className="w-full">
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Open storefront
                </Button>
              </Link>
              <div className="flex justify-center pt-2">
                <img src={qrUrl} alt="QR" className="rounded-lg border" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Print this QR for your shop counter
              </p>
            </div>
          )}
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h3 className="font-bold mb-1">Last 7 days</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Orders & revenue trend
          </p>
          {analytics.days.length === 0 || stats.orders === 0 ? (
            <div className="h-56 flex items-center justify-center text-sm text-muted-foreground">
              No orders yet. Share your storefront link to start receiving
              orders.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={analytics.days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  formatter={(v, name) => (name === "revenue" ? inr(v) : v)}
                />
                <Line
                  type="monotone"
                  dataKey="orders"
                  stroke="#f97316"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#059669"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="font-bold mb-4">Top products</h3>
          {analytics.top.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={analytics.top}
                layout="vertical"
                margin={{ left: 20 }}
              >
                <XAxis type="number" fontSize={11} />
                <YAxis
                  dataKey="name"
                  type="category"
                  fontSize={11}
                  width={100}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="qty" fill="#f97316" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <h3 className="font-bold mb-4">Recent orders</h3>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between border-b last:border-0 py-2"
                >
                  <div>
                    <div className="font-medium text-sm">
                      {o.customer.name}{" "}
                      <span className="text-xs text-muted-foreground">
                        · {o.mode}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="font-bold text-sm">{inr(o.total)}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
