'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowRight, Sparkles, MessageCircle, Rocket, Store, Zap, Shield, Cake, Flower2, UtensilsCrossed, Gift, ChefHat, Briefcase } from 'lucide-react'

export default function Landing() {
  const [tenants, setTenants] = useState([])
  useEffect(() => {
    fetch('/api/seed', { method: 'POST' }).finally(() => {
      fetch('/api/tenants').then(r=>r.json()).then(d=>setTenants(d.tenants||[]))
    })
  }, [])

  const businesses = [
    { icon: Cake, label: 'Bakeries' },
    { icon: ChefHat, label: 'Home bakers' },
    { icon: Flower2, label: 'Florists' },
    { icon: Gift, label: 'Gift shops' },
    { icon: UtensilsCrossed, label: 'Tiffin services' },
    { icon: Store, label: 'Cloud kitchens' },
    { icon: Briefcase, label: 'Coworking spaces' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-white to-white">
      <nav className="container mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-rose-500 text-white">🍴</span>
          ForkKit
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/login" className="text-sm text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link href="/signup"><Button size="sm" className="bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-90">Start free</Button></Link>
        </div>
      </nav>

      <section className="container mx-auto px-6 pt-10 pb-16 md:pt-20 md:pb-24 text-center">
        <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} transition={{duration:0.6}}>
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700 mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Digital storefront + WhatsApp ordering for local businesses
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight bg-gradient-to-b from-neutral-900 to-neutral-600 bg-clip-text text-transparent">
            Turn online visitors into<br/>ready-to-confirm WhatsApp orders.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Beautiful mobile-friendly storefronts for bakeries, home bakers, florists, tiffin services and gift shops. Customers browse and customize — orders arrive as a perfectly formatted WhatsApp message.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup"><Button size="lg" className="bg-gradient-to-r from-orange-500 to-rose-500 hover:opacity-90 shadow-lg">Create your storefront <ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
            <a href="#demos"><Button size="lg" variant="outline">See live examples</Button></a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Free — no credit card. Setup in under 60 seconds.</p>
        </motion.div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {businesses.map((b,i) => (
            <div key={i} className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1.5 text-xs text-neutral-700">
              <b.icon className="h-3.5 w-3.5 text-orange-500"/>{b.label}
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Discover → Browse → Customize → Order → WhatsApp</h2>
        <div className="grid gap-6 md:grid-cols-4 max-w-5xl mx-auto">
          {[
            { icon: Rocket, title: '1. Sign up', desc: 'Enter your business name and WhatsApp — storefront is live in seconds.' },
            { icon: Store, title: '2. Add products', desc: 'Photos, prices, variants, add-ons. Or pick a starter template.' },
            { icon: Zap, title: '3. Share the link', desc: 'Add to Instagram bio, Google profile, or share directly.' },
            { icon: MessageCircle, title: '4. Get WhatsApp orders', desc: 'Orders land in your WhatsApp with all details — you just confirm.' },
          ].map((s,i)=>(
            <motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.08}}>
              <Card className="p-5 h-full border-neutral-200/60">
                <s.icon className="h-6 w-6 text-orange-500"/>
                <div className="mt-3 font-semibold">{s.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.desc}</div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sample WhatsApp message */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
          <div>
            <h2 className="text-3xl font-bold">Every order arrives ready to confirm.</h2>
            <p className="mt-3 text-muted-foreground">No more back-and-forth. Every WhatsApp message includes customer details, product options, pickup/delivery choice, scheduled time, and total — automatically.</p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex gap-2"><Shield className="h-4 w-4 text-green-600 mt-0.5"/>You keep using WhatsApp — no new app to learn</li>
              <li className="flex gap-2"><Shield className="h-4 w-4 text-green-600 mt-0.5"/>Customers see prices, discounts and availability upfront</li>
              <li className="flex gap-2"><Shield className="h-4 w-4 text-green-600 mt-0.5"/>Fewer missed enquiries, cleaner order details</li>
            </ul>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-emerald-50 rounded-3xl blur-2xl" />
            <Card className="relative p-5 shadow-xl border-green-200">
              <div className="flex items-center gap-2 pb-3 border-b">
                <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">RB</div>
                <div>
                  <div className="font-semibold text-sm">Royal Bakery</div>
                  <div className="text-xs text-muted-foreground">WhatsApp Business</div>
                </div>
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-xs text-neutral-700 font-mono leading-relaxed">
{`*New Order — Royal Bakery*
Order ID: 8A2F91

*Customer:* Anna
*Phone:* +91 98xxxx1234
*Address:* 12, Rose Lane
*Mode:* 🚚 Delivery
*Scheduled:* Sat 6:00 PM
*Occasion:* Birthday
*Cake message:* Happy Bday Aarav!

*Items:*
  • 1 × Chocolate Truffle Cake
    (Size: 2 kg | Eggless | Candles)
  — ₹1,180.00

*Total:* ₹1,180.00`}
              </pre>
            </Card>
          </div>
        </div>
      </section>

      {/* Demos */}
      <section id="demos" className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center">Live demo storefronts</h2>
        <p className="text-center text-muted-foreground mt-2">See how it looks before you build yours.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
          {tenants.map((t) => (
            <Link key={t.slug} href={`/t/${t.slug}`}>
              <Card className="group overflow-hidden cursor-pointer hover:shadow-xl transition-all">
                <div className="h-40 w-full relative" style={{ backgroundImage: `url(${t.banner})`, backgroundSize:'cover', backgroundPosition:'center'}}>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="text-xs uppercase tracking-wider opacity-80">{t.slug}.forkkit.app</div>
                    <div className="text-xl font-bold">{t.name}</div>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t.tagline}</p>
                  <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition"/>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-20">
        <Card className="p-10 md:p-14 text-center bg-gradient-to-br from-orange-500 to-rose-500 text-white border-0">
          <h2 className="text-3xl md:text-4xl font-black">Your storefront in under 60 seconds.</h2>
          <p className="mt-3 opacity-90">Free forever plan. Upgrade when you grow.</p>
          <Link href="/signup"><Button size="lg" variant="secondary" className="mt-6">Get started — free <ArrowRight className="ml-2 h-4 w-4"/></Button></Link>
        </Card>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">Powered by ForkKit · Built for local businesses</footer>
    </div>
  )
}
