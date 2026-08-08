'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Package, ClipboardList, DollarSign, Users } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, categories: 0 })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    const t = localStorage.getItem('forkkit-token')
    Promise.all([
      fetch('/api/admin/products', { headers: { Authorization: `Bearer ${t}` }}).then(r=>r.json()),
      fetch('/api/admin/orders', { headers: { Authorization: `Bearer ${t}` }}).then(r=>r.json())
    ]).then(([p, o]) => {
      const rev = (o.orders||[]).reduce((s,x)=>s+x.total, 0)
      setStats({ products: (p.products||[]).length, orders: (o.orders||[]).length, revenue: rev, categories: (p.categories||[]).length })
      setRecent((o.orders||[]).slice(0,5))
    })
  }, [])

  const Stat = ({icon:Icon, label, value, color}) => (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="h-5 w-5 text-white"/></div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
    </Card>
  )

  return (
    <div>
      <h1 className="text-3xl font-bold mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Overview of your storefront</p>
      <div className="grid gap-4 md:grid-cols-4">
        <Stat icon={Package} label="Products" value={stats.products} color="bg-blue-500" />
        <Stat icon={ClipboardList} label="Orders" value={stats.orders} color="bg-orange-500" />
        <Stat icon={DollarSign} label="Revenue" value={`$${stats.revenue.toFixed(2)}`} color="bg-green-500" />
        <Stat icon={Users} label="Categories" value={stats.categories} color="bg-rose-500" />
      </div>
      <Card className="mt-6 p-5">
        <h2 className="font-bold mb-4">Recent orders</h2>
        {recent.length === 0 ? <p className="text-sm text-muted-foreground">No orders yet. Share your storefront link to receive orders.</p> : (
          <div className="space-y-2">
            {recent.map(o => (
              <div key={o.id} className="flex items-center justify-between border-b last:border-0 py-2">
                <div>
                  <div className="font-medium">{o.customer.name} <span className="text-xs text-muted-foreground">· {o.mode}</span></div>
                  <div className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleString()} · {o.items.length} items</div>
                </div>
                <div className="font-bold">${o.total.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
