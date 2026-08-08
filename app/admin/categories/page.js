'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Plus, Edit, Trash2, FolderTree, Package, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

const COMMON_ICONS = ['🎂','🥐','🍞','🍪','☕','🍳','🥪','🧋','💐','🌷','🌹','🪴','🎁','🎓','✨','🍛','🍝','🍽️','🍕','🍢','🍰','💻','🪑','🏢','🎫']

export default function AdminCategories() {
  const [cats, setCats] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [f, setF] = useState({ name: '', icon: '🍽️' })

  const load = async () => {
    setLoading(true)
    const t = localStorage.getItem('kirano-token')
    const [c, p] = await Promise.all([
      fetch('/api/admin/categories', { headers: { Authorization: `Bearer ${t}` }}).then(r=>r.json()),
      fetch('/api/admin/products', { headers: { Authorization: `Bearer ${t}` }}).then(r=>r.json()),
    ])
    setCats(c.categories || [])
    setProducts(p.products || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing(null); setF({ name: '', icon: '🍽️' }); setOpen(true) }
  const openEdit = (c) => { setEditing(c); setF({ name: c.name, icon: c.icon || '🍽️' }); setOpen(true) }

  const save = async () => {
    if (!f.name.trim()) return toast.error('Category name is required')
    const t = localStorage.getItem('kirano-token')
    const url = editing ? `/api/admin/categories/${editing.id}` : '/api/admin/categories'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers:{'Content-Type':'application/json', Authorization: `Bearer ${t}`}, body: JSON.stringify({ name: f.name.trim(), icon: f.icon }) })
    if (!res.ok) { const d = await res.json(); return toast.error(d.error || 'Failed') }
    toast.success(editing ? 'Category updated' : 'Category added')
    setOpen(false); load()
  }

  const del = async (c) => {
    const count = products.filter(p => p.categoryId === c.id).length
    const msg = count > 0
      ? `"${c.name}" has ${count} product(s). Delete anyway?`
      : `Delete "${c.name}"?`
    if (!confirm(msg)) return
    const t = localStorage.getItem('kirano-token')
    const res = await fetch(`/api/admin/categories/${c.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${t}` }})
    if (!res.ok) { const d = await res.json(); return toast.error(d.error || 'Delete failed') }
    toast.success('Category deleted'); load()
  }

  const countFor = (cid) => products.filter(p => p.categoryId === cid).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-sm text-muted-foreground">Organize your menu into sections</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-2"/>New category</Button>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-muted-foreground">Loading...</Card>
      ) : cats.length === 0 ? (
        <Card className="p-10 text-center">
          <FolderTree className="h-12 w-12 mx-auto text-neutral-300"/>
          <div className="mt-3 font-medium">No categories yet</div>
          <p className="text-sm text-muted-foreground mt-1">Categories help you group products — add one to get started.</p>
          <Button onClick={openNew} className="mt-4"><Plus className="h-4 w-4 mr-2"/>Create first category</Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
          {cats.map((c) => {
            const count = countFor(c.id)
            return (
              <motion.div key={c.id} layout initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,scale:0.95}}>
                <Card className="p-5 hover:shadow-md transition group">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl">{c.icon || '🍽️'}</div>
                      <div>
                        <div className="font-bold">{c.name}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                          <Package className="h-3 w-3"/>{count} product{count!==1?'s':''}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-70 group-hover:opacity-100 transition">
                      <Button size="icon" variant="ghost" onClick={()=>openEdit(c)}><Edit className="h-3.5 w-3.5"/></Button>
                      <Button size="icon" variant="ghost" onClick={()=>del(c)}><Trash2 className="h-3.5 w-3.5 text-red-500"/></Button>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Link href={`/admin/products?category=${c.id}`}>
                      <Button size="sm" variant="outline" className="h-8"><Package className="h-3 w-3 mr-1.5"/>View products</Button>
                    </Link>
                    <Link href={`/admin/products?new=1&category=${c.id}`}>
                      <Button size="sm" className="h-8"><Plus className="h-3 w-3 mr-1.5"/>Add product</Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? 'Edit category' : 'New category'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input placeholder="e.g. Cakes" value={f.name} onChange={e=>setF({...f,name:e.target.value})} autoFocus/>
            </div>
            <div>
              <Label>Icon</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input placeholder="🎂" value={f.icon} onChange={e=>setF({...f,icon:e.target.value})} className="w-20 text-center text-lg" maxLength={4}/>
                <div className="flex flex-wrap gap-1 flex-1">
                  {COMMON_ICONS.map(i => (
                    <button key={i} type="button" onClick={()=>setF({...f,icon:i})} className={`h-8 w-8 rounded-lg text-lg hover:bg-neutral-100 ${f.icon===i ? 'bg-neutral-900 text-white hover:bg-neutral-800' : ''}`}>{i}</button>
                  ))}
                </div>
              </div>
            </div>
            <Button onClick={save} className="w-full">{editing ? 'Save changes' : 'Add category'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
