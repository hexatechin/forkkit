'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Trash2, Minus, Plus, ArrowLeft, MessageCircle, ShoppingBag } from 'lucide-react'
import { useCart } from '@/lib/cart-store'
import { toast } from 'sonner'

export default function CartPage() {
  const { slug } = useParams()
  const [tenant, setTenantData] = useState(null)
  const { items, updateQty, removeItem, clear } = useCart()
  const [mode, setMode] = useState('delivery')
  const [form, setForm] = useState({ name:'', phone:'', address:'', notes:'', occasion:'', scheduledAt:'' })
  const [placing, setPlacing] = useState(false)

  useEffect(() => {
    fetch(`/api/tenant/${slug}`).then(r=>r.json()).then(d=>setTenantData(d.tenant))
  }, [slug])

  if (!tenant) return <div className="p-10 text-center">Loading...</div>

  const subtotal = items.reduce((s,i)=>s+i.unitPrice*i.qty, 0)
  const deliveryFee = mode === 'delivery' ? (tenant.deliveryFee || 0) : 0
  const total = subtotal + deliveryFee
  const belowMin = total < (tenant.minOrder || 0)

  const placeOrder = async () => {
    if (!items.length) return toast.error('Cart is empty')
    if (!form.name || !form.phone) return toast.error('Name and phone are required')
    if (mode === 'delivery' && !form.address) return toast.error('Delivery address is required')
    if (belowMin) return toast.error(`Minimum order is $${tenant.minOrder}`)
    setPlacing(true)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({
          tenantSlug: slug,
          customer: { name: form.name, phone: form.phone, address: form.address },
          mode, scheduledAt: form.scheduledAt, occasion: form.occasion, notes: form.notes,
          cakeMessage: items.find(i=>i.cakeMessage)?.cakeMessage || null,
          items: items.map(i => ({ productId:i.productId, name:i.name, qty:i.qty, unitPrice:i.unitPrice, variantLabel:i.variantLabel, eggChoice:i.eggChoice, addons:i.addons }))
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      clear()
      toast.success('Order created! Opening WhatsApp...')
      window.location.href = data.whatsappUrl
    } catch (e) {
      toast.error(e.message)
    } finally { setPlacing(false) }
  }

  return (
    <div className="min-h-screen" style={{ background: tenant.bgTint || '#fafafa' }}>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <Link href={`/t/${slug}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4"/>Continue shopping</Link>
        <h1 className="text-3xl font-black mb-6">Your order</h1>

        {items.length === 0 ? (
          <Card className="p-10 text-center">
            <ShoppingBag className="h-12 w-12 mx-auto text-neutral-300"/>
            <p className="mt-4 text-muted-foreground">Your cart is empty</p>
            <Link href={`/t/${slug}`}><Button className="mt-4" style={{background: tenant.primaryColor, color:'white'}}>Browse menu</Button></Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-3">
              {items.map(i => (
                <motion.div key={i.lineId} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}>
                  <Card className="p-4 flex gap-4">
                    {i.image && <img src={i.image} className="h-20 w-20 rounded-lg object-cover"/>}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold">{i.name}</div>
                      {(i.variantLabel || i.eggChoice) && <div className="text-xs text-muted-foreground">{[i.variantLabel, i.eggChoice].filter(Boolean).join(' • ')}</div>}
                      {i.addons?.length>0 && <div className="text-xs text-muted-foreground">+ {i.addons.map(a=>a.name).join(', ')}</div>}
                      {i.cakeMessage && <div className="text-xs text-muted-foreground italic">“{i.cakeMessage}”</div>}
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 border rounded-full px-2 py-0.5">
                          <button onClick={()=>updateQty(i.lineId, i.qty-1)}><Minus className="h-3.5 w-3.5"/></button>
                          <span className="w-6 text-center text-sm font-bold">{i.qty}</span>
                          <button onClick={()=>updateQty(i.lineId, i.qty+1)}><Plus className="h-3.5 w-3.5"/></button>
                        </div>
                        <div className="font-bold">${(i.unitPrice*i.qty).toFixed(2)}</div>
                      </div>
                    </div>
                    <button onClick={()=>removeItem(i.lineId)} className="self-start text-neutral-400 hover:text-red-500"><Trash2 className="h-4 w-4"/></button>
                  </Card>
                </motion.div>
              ))}

              <Card className="p-5 mt-6">
                <h2 className="font-bold mb-4">Delivery details</h2>
                <div className="flex gap-2 mb-4">
                  {['delivery','pickup'].map(m => (
                    <button key={m} onClick={()=>setMode(m)} className={`flex-1 py-2 rounded-lg border-2 capitalize text-sm font-medium ${mode===m ? 'text-white' : 'bg-white'}`} style={mode===m ? {background:tenant.primaryColor, borderColor:tenant.primaryColor} : {}}>
                      {m === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}
                    </button>
                  ))}
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div><Label>Name*</Label><Input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} /></div>
                  <div><Label>Phone*</Label><Input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} /></div>
                  {mode==='delivery' && <div className="sm:col-span-2"><Label>Address*</Label><Textarea value={form.address} onChange={e=>setForm({...form,address:e.target.value})} rows={2}/></div>}
                  <div><Label>Scheduled date/time (optional)</Label><Input type="datetime-local" value={form.scheduledAt} onChange={e=>setForm({...form,scheduledAt:e.target.value})} /></div>
                  <div><Label>Occasion (optional)</Label><Input placeholder="Birthday, anniversary..." value={form.occasion} onChange={e=>setForm({...form,occasion:e.target.value})} /></div>
                  <div className="sm:col-span-2"><Label>Special instructions</Label><Textarea rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
                </div>
              </Card>
            </div>

            <div>
              <Card className="p-5 sticky top-4">
                <h2 className="font-bold mb-3">Summary</h2>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between text-muted-foreground"><span>{mode==='delivery' ? 'Delivery' : 'Pickup'}</span><span>${deliveryFee.toFixed(2)}</span></div>
                  <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
                </div>
                {belowMin && <div className="mt-3 text-xs text-red-600">Minimum order is ${tenant.minOrder}. Add more items.</div>}
                <div className="mt-3 text-xs text-muted-foreground">Estimated ready in ~{tenant.prepTimeMins} min</div>
                <Button disabled={placing || belowMin} onClick={placeOrder} className="w-full mt-4 h-12 font-semibold" style={{background: '#25D366', color:'white'}}>
                  <MessageCircle className="h-5 w-5 mr-2"/>Place order via WhatsApp
                </Button>
                <p className="mt-2 text-xs text-muted-foreground text-center">You'll be redirected to WhatsApp to confirm.</p>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
