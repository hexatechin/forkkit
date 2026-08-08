'use client'
import { useEffect, useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Plus, Edit, Trash2, Search, FolderTree, ChevronRight, Package } from 'lucide-react'
import { toast } from 'sonner'

const inr = (n) => `₹${Number(n||0).toLocaleString('en-IN')}`
const BLANK = { name:'', description:'', categoryId:'', price:'', discountPrice:'', images:'', available:true, badges:'' }

function ProductsInner() {
  const params = useSearchParams()
  const router = useRouter()
  const [items, setItems] = useState([])
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [activeCat, setActiveCat] = useState('all')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [f, setF] = useState(BLANK)

  const load = async () => {
    setLoading(true)
    const t = localStorage.getItem('kirano-token')
    const d = await fetch('/api/admin/products', { headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json())
    setItems(d.products||[])
    setCats(d.categories||[])
    setLoading(false)
    return d.categories || []
  }

  useEffect(() => {
    load().then((loaded) => {
      const preCat = params.get('category')
      const isNew = params.get('new') === '1'
      if (preCat) setActiveCat(preCat)
      if (isNew) {
        setEditing(null)
        setF({...BLANK, categoryId: preCat || loaded[0]?.id || ''})
        setOpen(true)
        // Clean url so refresh doesn't reopen
        router.replace('/admin/products' + (preCat ? `?category=${preCat}` : ''), { scroll:false })
      }
    })
    // eslint-disable-next-line
  }, [])

  const openNew = (categoryId=null) => {
    setEditing(null)
    setF({...BLANK, categoryId: categoryId || (activeCat !== 'all' ? activeCat : (cats[0]?.id || ''))})
    setOpen(true)
  }

  const openEdit = (p) => {
    setEditing(p)
    setF({
      name: p.name, description: p.description||'', categoryId: p.categoryId,
      price: p.price, discountPrice: p.discountPrice||'',
      images: (p.images||[]).join(','),
      available: p.available !== false,
      badges: (p.badges||[]).join(','),
    })
    setOpen(true)
  }

  const save = async () => {
    if (!f.name.trim()) return toast.error('Product name required')
    if (!f.categoryId) return toast.error('Please choose a category')
    if (!f.price) return toast.error('Price required')
    const t = localStorage.getItem('kirano-token')
    const body = {
      ...f,
      price: Number(f.price),
      discountPrice: f.discountPrice ? Number(f.discountPrice) : null,
      images: f.images.split(',').map(s=>s.trim()).filter(Boolean),
      badges: f.badges.split(',').map(s=>s.trim()).filter(Boolean),
    }
    const url = editing ? `/api/admin/products/${editing.id}` : '/api/admin/products'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`}, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); return toast.error(d.error || 'Failed') }
    toast.success(editing ? 'Product updated' : 'Product added')
    setOpen(false); load()
  }

  const del = async (p) => {
    if (!confirm(`Delete "${p.name}"?`)) return
    const t = localStorage.getItem('kirano-token')
    await fetch(`/api/admin/products/${p.id}`, { method:'DELETE', headers:{Authorization:`Bearer ${t}`}})
    toast.success('Deleted'); load()
  }

  const filtered = useMemo(() => {
    let list = items
    if (activeCat !== 'all') list = list.filter(p => p.categoryId === activeCat)
    if (q) {
      const s = q.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(s) || p.description?.toLowerCase().includes(s))
    }
    return list
  }, [items, activeCat, q])

  const countFor = (cid) => items.filter(p => p.categoryId === cid).length

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-sm text-muted-foreground">Manage your menu items</p>
        </div>
        <Button onClick={()=>openNew()}><Plus className="h-4 w-4 mr-2"/>New product</Button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"/>
        <Input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search products..." className="pl-9"/>
      </div>

      {/* Category chips */}
      {cats.length === 0 && !loading ? (
        <Card className="p-8 text-center">
          <FolderTree className="h-10 w-10 mx-auto text-neutral-300"/>
          <div className="mt-3 font-medium">No categories yet</div>
          <p className="text-sm text-muted-foreground mt-1">You need at least one category to add products.</p>
          <Link href="/admin/categories"><Button className="mt-4"><Plus className="h-4 w-4 mr-2"/>Create a category first</Button></Link>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={()=>setActiveCat('all')} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${activeCat==='all' ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white hover:bg-neutral-50'}`}>
              All <span className="opacity-70">({items.length})</span>
            </button>
            {cats.map(c => (
              <button key={c.id} onClick={()=>setActiveCat(c.id)} className={`px-3 py-1.5 rounded-full text-sm font-medium border ${activeCat===c.id ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white hover:bg-neutral-50'}`}>
                <span className="mr-1">{c.icon}</span>{c.name} <span className="opacity-70">({countFor(c.id)})</span>
              </button>
            ))}
            <Link href="/admin/categories" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm text-neutral-500 hover:text-neutral-900 border border-dashed">
              <FolderTree className="h-3.5 w-3.5"/>Manage categories
            </Link>
          </div>

          {/* Show as grouped-by-category when 'all', or flat list when specific category */}
          {activeCat === 'all' ? (
            <div className="space-y-8">
              {cats.map(c => {
                const catProducts = filtered.filter(p => p.categoryId === c.id)
                if (catProducts.length === 0 && q) return null
                return (
                  <section key={c.id}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-lg font-bold flex items-center gap-2">
                        <span className="text-xl">{c.icon}</span>{c.name}
                        <span className="text-sm font-normal text-muted-foreground">({catProducts.length})</span>
                      </h2>
                      <Button size="sm" variant="outline" onClick={()=>openNew(c.id)}><Plus className="h-3.5 w-3.5 mr-1"/>Add to {c.name}</Button>
                    </div>
                    {catProducts.length === 0 ? (
                      <Card className="p-6 text-center text-sm text-muted-foreground border-dashed">
                        No products in this category yet. <button onClick={()=>openNew(c.id)} className="underline">Add one</button>
                      </Card>
                    ) : (
                      <div className="grid gap-2">
                        <AnimatePresence>
                        {catProducts.map(p => <ProductRow key={p.id} p={p} onEdit={openEdit} onDelete={del}/>)}
                        </AnimatePresence>
                      </div>
                    )}
                  </section>
                )
              })}
              {/* Uncategorized safety net */}
              {filtered.filter(p => !cats.find(c => c.id === p.categoryId)).length > 0 && (
                <section>
                  <h2 className="text-lg font-bold mb-3 text-neutral-500">Uncategorized</h2>
                  <div className="grid gap-2">
                    {filtered.filter(p => !cats.find(c => c.id === p.categoryId)).map(p => <ProductRow key={p.id} p={p} onEdit={openEdit} onDelete={del}/>)}
                  </div>
                </section>
              )}
            </div>
          ) : (
            <div className="grid gap-2">
              {filtered.length === 0 ? (
                <Card className="p-6 text-center text-sm text-muted-foreground border-dashed">
                  No products yet. <button onClick={()=>openNew(activeCat)} className="underline">Add one</button>
                </Card>
              ) : (
                <AnimatePresence>
                {filtered.map(p => <ProductRow key={p.id} p={p} onEdit={openEdit} onDelete={del}/>)}
                </AnimatePresence>
              )}
            </div>
          )}
        </>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? 'Edit product' : 'New product'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Category *</Label>
              <Select value={f.categoryId} onValueChange={v=>setF({...f,categoryId:v})}>
                <SelectTrigger><SelectValue placeholder="Choose category"/></SelectTrigger>
                <SelectContent>{cats.map(c => <SelectItem key={c.id} value={c.id}><span className="mr-2">{c.icon}</span>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Name *</Label><Input placeholder="e.g. Chocolate Truffle Cake" value={f.name} onChange={e=>setF({...f,name:e.target.value})} /></div>
            <div><Label>Description</Label><Textarea placeholder="Short mouth-watering description..." value={f.description} onChange={e=>setF({...f,description:e.target.value})} rows={2}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (₹) *</Label><Input type="number" placeholder="499" value={f.price} onChange={e=>setF({...f,price:e.target.value})} /></div>
              <div><Label>Discount price (₹)</Label><Input type="number" placeholder="optional" value={f.discountPrice} onChange={e=>setF({...f,discountPrice:e.target.value})} /></div>
            </div>
            <div><Label>Image URLs (comma-separated)</Label><Textarea placeholder="https://... , https://..." value={f.images} onChange={e=>setF({...f,images:e.target.value})} rows={2}/></div>
            <div><Label>Badges</Label><Input placeholder="Bestseller, New (comma-separated)" value={f.badges} onChange={e=>setF({...f,badges:e.target.value})}/></div>
            <div className="flex items-center gap-3 pt-1"><Switch checked={f.available} onCheckedChange={v=>setF({...f,available:v})}/> <Label>Available for order</Label></div>
            <Button onClick={save} className="w-full h-11 mt-2">{editing ? 'Save changes' : 'Add product'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductRow({ p, onEdit, onDelete }) {
  return (
    <motion.div layout initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.98}}>
      <Card className="p-3 flex items-center gap-3 hover:shadow-sm transition">
        <img src={p.images?.[0]} onError={(e)=>e.currentTarget.style.opacity='0.3'} className="h-14 w-14 rounded-lg object-cover bg-neutral-100"/>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{p.name}</div>
          <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
            <span className="font-medium text-neutral-800">{inr(p.discountPrice||p.price)}</span>
            {p.discountPrice && <span className="line-through text-neutral-400">{inr(p.price)}</span>}
            {p.available===false && <span className="text-red-500">· unavailable</span>}
            {p.badges?.length > 0 && <span>· {p.badges.join(', ')}</span>}
          </div>
        </div>
        <Button size="icon" variant="ghost" onClick={()=>onEdit(p)}><Edit className="h-3.5 w-3.5"/></Button>
        <Button size="icon" variant="ghost" onClick={()=>onDelete(p)}><Trash2 className="h-3.5 w-3.5 text-red-500"/></Button>
      </Card>
    </motion.div>
  )
}

export default function AdminProducts() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-muted-foreground">Loading...</div>}>
      <ProductsInner/>
    </Suspense>
  )
}
