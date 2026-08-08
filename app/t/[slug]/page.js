'use client'
import { useEffect, useState, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, ShoppingBag, Star, Clock, MapPin, Phone, Instagram, Plus } from 'lucide-react'
import { useCart } from '@/lib/cart-store'

export default function StorefrontPage() {
  const { slug } = useParams()
  const router = useRouter()
  const [data, setData] = useState(null)
  const [q, setQ] = useState('')
  const [activeCat, setActiveCat] = useState(null)
  const catRefs = useRef({})
  const { items, setTenant, addItem } = useCart()

  useEffect(() => {
    fetch(`/api/tenant/${slug}`).then(r=>r.json()).then(d=>{
      setData(d); setTenant(slug); if (d.categories?.[0]) setActiveCat(d.categories[0].id)
    })
  }, [slug])

  const filtered = useMemo(() => {
    if (!data) return {}
    const byCat = {}
    data.categories.forEach(c => byCat[c.id] = [])
    data.products.forEach(p => {
      if (q && !p.name.toLowerCase().includes(q.toLowerCase()) && !p.description?.toLowerCase().includes(q.toLowerCase())) return
      if (byCat[p.categoryId]) byCat[p.categoryId].push(p)
    })
    return byCat
  }, [data, q])

  if (!data) return (
    <div className="min-h-screen bg-neutral-50">
      <Skeleton className="h-72 w-full" />
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-8 w-40" /><Skeleton className="h-32 w-full" /><Skeleton className="h-32 w-full" />
      </div>
    </div>
  )

  const t = data.tenant
  const totalItems = items.reduce((s,i)=>s+i.qty,0)

  const scrollToCat = (cid) => {
    setActiveCat(cid)
    catRefs.current[cid]?.scrollIntoView({ behavior:'smooth', block:'start' })
  }

  const quickAdd = (p) => {
    const unitPrice = p.discountPrice || p.price
    addItem({ productId: p.id, name: p.name, image: p.images?.[0], qty: 1, unitPrice, variantLabel: null, eggChoice: null, addons: [] })
  }

  return (
    <div className="min-h-screen" style={{ background: t.bgTint || '#fafafa' }}>
      {/* Banner */}
      <div className="relative h-64 md:h-80 w-full" style={{ backgroundImage: `url(${t.banner})`, backgroundSize:'cover', backgroundPosition:'center'}}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <Link href="/" className="text-white/90 text-sm bg-black/30 backdrop-blur rounded-full px-3 py-1 hover:bg-black/50">← All storefronts</Link>
          <Link href={`/t/${slug}/cart`}>
            <div className="relative bg-white rounded-full h-10 w-10 flex items-center justify-center shadow-lg">
              <ShoppingBag className="h-5 w-5" style={{color:t.primaryColor}} />
              {totalItems>0 && <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs font-bold text-white flex items-center justify-center" style={{background:t.primaryColor}}>{totalItems}</span>}
            </div>
          </Link>
        </div>
        <div className="absolute bottom-6 left-6 right-6 text-white">
          <div className="flex items-center gap-3">
            {t.logo && <img src={t.logo} alt={t.name} className="h-14 w-14 rounded-full border-2 border-white object-cover" />}
            <div>
              <h1 className="text-3xl md:text-4xl font-black drop-shadow">{t.name}</h1>
              <p className="text-sm md:text-base opacity-90">{t.tagline}</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur rounded-full px-3 py-1"><Clock className="h-3 w-3"/> {t.businessHours?.open}-{t.businessHours?.close}</span>
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur rounded-full px-3 py-1"><MapPin className="h-3 w-3"/> {t.address}</span>
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur rounded-full px-3 py-1"><Phone className="h-3 w-3"/> {t.phone}</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="container mx-auto px-4 -mt-6 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2">
          <Search className="h-5 w-5 text-neutral-400 ml-2" />
          <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search dishes, ingredients..." className="border-0 focus-visible:ring-0 shadow-none" />
        </div>
      </div>

      {/* Sticky category nav */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b mt-6">
        <div className="container mx-auto px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar">
          {data.categories.map(c => (
            <button key={c.id} onClick={()=>scrollToCat(c.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${activeCat===c.id ? 'text-white shadow' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'}`}
              style={activeCat===c.id ? { background: t.primaryColor } : {}}>
              <span className="mr-1">{c.icon}</span>{c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products by category */}
      <div className="container mx-auto px-4 py-8 space-y-10 pb-32">
        {data.categories.map((c, ci) => {
          const prods = filtered[c.id] || []
          if (!prods.length) return null
          return (
            <section key={c.id} ref={el => catRefs.current[c.id] = el}>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><span>{c.icon}</span>{c.name}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                {prods.map((p, i) => (
                  <motion.div key={p.id} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay: 0.03*i}}>
                    <Card className="overflow-hidden hover:shadow-lg transition group border-neutral-200/60">
                      <div className="relative aspect-[4/3] bg-neutral-100 overflow-hidden">
                        <Link href={`/t/${slug}/product/${p.id}`}>
                          <img loading="lazy" src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-105 transition" />
                        </Link>
                        <div className="absolute top-2 left-2 flex gap-1">
                          {p.badges?.map(b => <Badge key={b} className="text-white" style={{background:t.primaryColor}}>{b}</Badge>)}
                          {p.discountPrice && <Badge variant="destructive">Save ${(p.price-p.discountPrice).toFixed(0)}</Badge>}
                        </div>
                        {!p.available && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-semibold">Sold out</div>}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <Link href={`/t/${slug}/product/${p.id}`} className="font-semibold hover:underline">{p.name}</Link>
                          {p.rating && <div className="flex items-center gap-0.5 text-xs bg-green-100 text-green-700 rounded px-1.5 py-0.5"><Star className="h-3 w-3 fill-green-700" />{p.rating}</div>}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            {p.discountPrice ? (
                              <div className="flex items-baseline gap-2">
                                <span className="font-bold">${p.discountPrice}</span>
                                <span className="text-xs text-muted-foreground line-through">${p.price}</span>
                              </div>
                            ) : <span className="font-bold">${p.price}</span>}
                          </div>
                          {(p.variants?.length || p.addons?.length || p.isEggOption) ? (
                            <Link href={`/t/${slug}/product/${p.id}`}>
                              <Button size="sm" style={{background: t.primaryColor, color:'white'}}>Customize</Button>
                            </Link>
                          ) : (
                            <Button size="sm" disabled={!p.available} onClick={()=>quickAdd(p)} style={{background: t.primaryColor, color:'white'}}>
                              <Plus className="h-4 w-4 mr-1"/>Add
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            </section>
          )
        })}
      </div>

      {/* Floating cart bar */}
      {totalItems>0 && (
        <motion.div initial={{y:100}} animate={{y:0}} className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 z-30">
          <Link href={`/t/${slug}/cart`}>
            <div className="rounded-2xl shadow-2xl px-5 py-3 flex items-center justify-between text-white cursor-pointer" style={{ background: t.primaryColor }}>
              <div className="flex items-center gap-2"><ShoppingBag className="h-5 w-5"/><span className="font-semibold">{totalItems} item{totalItems!==1?'s':''}</span></div>
              <div className="font-bold">View cart →</div>
            </div>
          </Link>
        </motion.div>
      )}

      <footer className="border-t bg-white/60 py-8 text-center text-xs text-muted-foreground">
        {t.socialLinks?.instagram && <a href={t.socialLinks.instagram} className="inline-flex items-center gap-1 hover:underline"><Instagram className="h-3 w-3"/>Follow us</a>}
        <div className="mt-2">Powered by ForkKit</div>
      </footer>

      <style>{`.no-scrollbar::-webkit-scrollbar{display:none} .no-scrollbar{scrollbar-width:none}`}</style>
    </div>
  )
}
