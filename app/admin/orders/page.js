"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const inr = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  useEffect(() => {
    const t = localStorage.getItem("indocia-token");
    fetch("/api/admin/orders", { headers: { Authorization: `Bearer ${t}` } })
      .then((r) => r.json())
      .then((d) => setOrders(d.orders || []));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Orders</h1>
      {orders.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No orders yet.
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">
                    {`#${o.id.slice(0, 8).toUpperCase()}`}{" "}
                    <span className="text-xs text-muted-foreground">
                      · {o.customer.phone}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(o.createdat).toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{o.mode}</Badge>
                  <Badge variant="outline">{o.status}</Badge>
                  <div className="font-bold text-lg">{inr(o.total)}</div>
                </div>
              </div>
              <div className="mt-3 text-sm">
                {o.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between border-t pt-2">
                    <div>
                      {i.qty} × {i.name}
                      {i.variantLabel ? ` (${i.variantLabel})` : ""}
                    </div>
                    <div>{inr(i.unitPrice * i.qty)}</div>
                  </div>
                ))}
              </div>
              {(o.scheduledAt || o.occasion || o.notes) && (
                <div className="mt-3 text-xs text-muted-foreground space-y-1">
                  {o.scheduledAt && <div>Scheduled: {o.scheduledAt}</div>}
                  {o.occasion && <div>Occasion: {o.occasion}</div>}
                  {o.notes && <div>Notes: {o.notes}</div>}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
