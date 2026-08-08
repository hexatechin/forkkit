'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Store, Sparkles, ShieldCheck, Smartphone, LayoutDashboard } from 'lucide-react'

export default function Landing() {
  const [tenants, setTenants] = useState([])

  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).finally(() => {
      fetch('/api/tenants').then(r=>r.json()).then(d=>setTenants(d.tenants||[]))
    })
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-white">🍴</span>
          ForkKit
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground">Admin login</Link>
        </div>
      </nav>

      <section className="container mx-auto px-6 pt-10 pb-16 md:pt-20 md:pb-24 text-center">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6}}>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Multi-tenant food ordering, powered by WhatsApp
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-b from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
            Every restaurant, its own storefront.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Launch beautiful, branded ordering websites for bakeries, cafés and cloud kitchens. Customers browse, customize, and check out — orders land directly in WhatsApp.
          </p>
        </motion.div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
          {tenants.map((t, i) => (
            <motion.div key={t.slug} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay: 0.1*i, duration:0.5}}>
              <Link href={`/t/${t.slug}`}>
                <Card className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all border-2">
                  <div className="h-40 w-full relative" style={{ backgroundImage: `url(${t.banner})`, backgroundSize:'cover', backgroundPosition:'center'}}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                      <div>
                        <div className="text-xs uppercase tracking-wider opacity-80">{t.slug}.forkkit.app</div>
                        <div className="text-xl font-bold">{t.name}</div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition"><ArrowRight className="h-5 w-5" /></div>
                    </div>
                  </div>
                  <div className="p-4 text-left">
                    <p className="text-sm text-muted-foreground">{t.tagline}</p>
                    <div className="mt-2 text-xs font-medium" style={{color:t.primaryColor}}>Visit storefront →</div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-4 max-w-4xl mx-auto text-left">
          {[
            { icon: Store, title:'Branded storefront', desc:'Own logo, banner, colors and content per tenant.' },
            { icon: Smartphone, title:'WhatsApp checkout', desc:'Orders arrive as formatted WhatsApp messages.' },
            { icon: LayoutDashboard, title:'Admin dashboard', desc:'Manage products, orders and settings.' },
            { icon: ShieldCheck, title:'Role-based access', desc:'Owner, Manager, Staff — safe by default.' }
          ].map((f,i)=>(
            <div key={i} className="rounded-xl border bg-white/60 backdrop-blur p-4">
              <f.icon className="h-5 w-5 text-orange-600" />
              <div className="mt-2 font-semibold">{f.title}</div>
              <div className="text-sm text-muted-foreground">{f.desc}</div>
            </div>
          ))}
        </div>

        <div className="mt-14">
          <Link href="/admin/login"><Button size="lg" variant="outline">Try the admin panel <ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">Demo login: <code className="px-1 rounded bg-neutral-100">owner@royalbakery.com</code> / <code className="px-1 rounded bg-neutral-100">password123</code></p>
      </section>
    </div>
  )
}
