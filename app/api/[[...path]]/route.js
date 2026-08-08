import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { seedIfEmpty } from '@/lib/seed'
import { signToken, verifyToken, hashPassword, verifyPassword, extractToken } from '@/lib/auth'
import { v4 as uuid } from 'uuid'

const json = (data, status=200) => NextResponse.json(data, { status })
const err = (msg, status=400) => NextResponse.json({ error: msg }, { status })

async function requireAuth(request, roles=null) {
  const token = extractToken(request)
  const payload = verifyToken(token)
  if (!payload) return { error: err('unauthorized', 401) }
  if (roles && !roles.includes(payload.role)) return { error: err('forbidden', 403) }
  return { user: payload }
}

async function route(request, method, segments) {
  const db = await getDb()
  const path = '/' + segments.join('/')
  const url = new URL(request.url)

  // POST /api/seed  (dev helper)
  if (path === '/seed' && method === 'POST') {
    const r = await seedIfEmpty()
    return json(r)
  }

  // POST /api/signup  { template, businessName, tagline, ownerName, email, password, whatsappNumber, phone, address }
  if (path === '/signup' && method === 'POST') {
    const body = await request.json()
    const { template, businessName, tagline, ownerName, email, password, whatsappNumber, phone, address } = body
    if (!businessName || !ownerName || !email || !password || !whatsappNumber) return err('Missing required fields')
    if (password.length < 6) return err('Password must be at least 6 characters')
    const emailLc = email.toLowerCase()
    const existingUser = await db.collection('users').findOne({ email: emailLc })
    if (existingUser) return err('Email already registered', 409)

    // Slugify + ensure unique
    let baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,40) || 'shop'
    let slug = baseSlug; let n = 1
    while (await db.collection('tenants').findOne({ slug })) { n++; slug = `${baseSlug}-${n}` }

    const TEMPLATE_THEMES = {
      bakery: { primary:'#a0522d', accent:'#d4a373', tint:'#fdf6ec', banner:'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1600&q=80', cats:[['Cakes','\ud83c\udf82'],['Pastries','\ud83e\udd50'],['Breads','\ud83c\udf5e'],['Cookies','\ud83c\udf6a']] },
      home_baker: { primary:'#c2410c', accent:'#fed7aa', tint:'#fff7ed', banner:'https://images.unsplash.com/photo-1587244141541-6b3e5b8b0ba1?w=1600&q=80', cats:[['Custom Cakes','\ud83c\udf82'],['Cupcakes','\ud83e\uddc1'],['Desserts','\ud83c\udf6e']] },
      florist:   { primary:'#be185d', accent:'#fbcfe8', tint:'#fdf2f8', banner:'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1600&q=80', cats:[['Bouquets','\ud83d\udc90'],['Arrangements','\ud83c\udf37'],['Occasions','\ud83c\udf39']] },
      gift_shop: { primary:'#7c3aed', accent:'#ddd6fe', tint:'#faf5ff', banner:'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1600&q=80', cats:[['Gifts','\ud83c\udf81'],['Hampers','\ud83c\udf93'],['Personalized','\u2728']] },
      tiffin:    { primary:'#065f46', accent:'#a7f3d0', tint:'#ecfdf5', banner:'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=80', cats:[['Lunch','\ud83c\udf5b'],['Dinner','\ud83c\udf5d'],['Snacks','\ud83e\udd6a'],['Combos','\ud83c\udf7d\ufe0f']] },
      cloud_kitchen:{ primary:'#0f766e', accent:'#99f6e4', tint:'#f0fdfa', banner:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80', cats:[['Mains','\ud83c\udf5d'],['Starters','\ud83c\udf62'],['Desserts','\ud83c\udf70'],['Drinks','\ud83e\uddcb']] },
    }
    const theme = TEMPLATE_THEMES[template] || TEMPLATE_THEMES.bakery

    const tenantId = uuid()
    await db.collection('tenants').insertOne({
      id: tenantId, slug, name: businessName, tagline: tagline || 'Made with love',
      logo: '', banner: theme.banner,
      primaryColor: theme.primary, accentColor: theme.accent, bgTint: theme.tint,
      whatsappNumber, phone: phone || '', email: emailLc, address: address || '',
      businessHours: { open: '09:00', close: '21:00', days: 'Mon-Sun' },
      deliveryFee: 0, minOrder: 0, prepTimeMins: 30,
      socialLinks: { instagram: '', facebook: '' },
      seoTitle: businessName, seoDesc: tagline || `Order from ${businessName}`,
      template,
      createdAt: new Date().toISOString(),
    })
    const cats = theme.cats.map(([name, icon], i) => ({ id: uuid(), tenantId, name, order: i+1, icon }))
    await db.collection('categories').insertMany(cats)

    const userId = uuid()
    await db.collection('users').insertOne({ id: userId, tenantId, email: emailLc, passwordHash: hashPassword(password), name: ownerName, role: 'owner' })

    const token = signToken({ userId, tenantId, role: 'owner', email: emailLc, name: ownerName })
    return json({ token, user:{ id:userId, email:emailLc, name:ownerName, role:'owner' }, tenant:{ slug, name:businessName, primaryColor: theme.primary } })
  }

  // GET /api/admin/analytics  (last 7 days trends + top products)
  if (path === '/admin/analytics' && method === 'GET') {
    const { user, error } = await requireAuth(request); if (error) return error
    const orders = await db.collection('orders').find({ tenantId: user.tenantId }).toArray()
    const now = new Date()
    const days = []
    for (let i=6; i>=0; i--) {
      const d = new Date(now); d.setDate(d.getDate()-i); d.setHours(0,0,0,0)
      const next = new Date(d); next.setDate(next.getDate()+1)
      const dayOrders = orders.filter(o => { const t = new Date(o.createdAt); return t>=d && t<next })
      days.push({ date: d.toISOString().slice(5,10), orders: dayOrders.length, revenue: dayOrders.reduce((s,o)=>s+o.total,0) })
    }
    const productTotals = {}
    orders.forEach(o => o.items.forEach(i => { productTotals[i.name] = (productTotals[i.name]||0) + i.qty }))
    const top = Object.entries(productTotals).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([name, qty]) => ({ name, qty }))
    return json({ days, top, totals: { orders: orders.length, revenue: orders.reduce((s,o)=>s+o.total, 0) } })
  }

  // GET /api/tenants  (list all - for demo landing)
  if (path === '/tenants' && method === 'GET') {
    const tenants = await db.collection('tenants').find({}, { projection: { _id: 0 } }).toArray()
    return json({ tenants })
  }

  // GET /api/tenant/:slug
  if (segments[0] === 'tenant' && segments.length === 2 && method === 'GET') {
    const slug = segments[1]
    const tenant = await db.collection('tenants').findOne({ slug }, { projection: { _id: 0 } })
    if (!tenant) return err('tenant not found', 404)
    const categories = await db.collection('categories').find({ tenantId: tenant.id }, { projection: { _id: 0 } }).sort({ order: 1 }).toArray()
    const products = await db.collection('products').find({ tenantId: tenant.id }, { projection: { _id: 0 } }).toArray()
    return json({ tenant, categories, products })
  }

  // GET /api/tenant/:slug/product/:id
  if (segments[0] === 'tenant' && segments[2] === 'product' && segments.length === 4 && method === 'GET') {
    const slug = segments[1]; const pid = segments[3]
    const tenant = await db.collection('tenants').findOne({ slug })
    if (!tenant) return err('tenant not found', 404)
    const product = await db.collection('products').findOne({ id: pid, tenantId: tenant.id }, { projection: { _id: 0 } })
    if (!product) return err('product not found', 404)
    return json({ product, tenant: { name: tenant.name, primaryColor: tenant.primaryColor, accentColor: tenant.accentColor, slug: tenant.slug } })
  }

  // POST /api/checkout  { tenantSlug, customer, mode, scheduledAt, occasion, cakeMessage, notes, items }
  if (path === '/checkout' && method === 'POST') {
    const body = await request.json()
    const { tenantSlug, customer, mode, scheduledAt, occasion, cakeMessage, notes, items } = body
    if (!tenantSlug || !customer?.name || !customer?.phone || !items?.length) return err('missing required fields')
    const tenant = await db.collection('tenants').findOne({ slug: tenantSlug })
    if (!tenant) return err('tenant not found', 404)

    const subtotal = items.reduce((s,i) => s + (i.unitPrice * i.qty), 0)
    const deliveryFee = mode === 'delivery' ? (tenant.deliveryFee || 0) : 0
    const total = subtotal + deliveryFee

    if (total < (tenant.minOrder||0)) return err(`Minimum order is ${tenant.minOrder}`)

    const orderId = uuid()
    const order = {
      id: orderId, tenantId: tenant.id, tenantSlug,
      customer, mode, scheduledAt: scheduledAt || null, occasion: occasion || null,
      cakeMessage: cakeMessage || null, notes: notes || null,
      items, subtotal, deliveryFee, total, status: 'pending', createdAt: new Date().toISOString()
    }
    await db.collection('orders').insertOne(order)

    // Build WhatsApp message
    const lines = []
    lines.push(`*New Order — ${tenant.name}*`)
    lines.push(`Order ID: ${orderId.slice(0,8).toUpperCase()}`)
    lines.push('')
    lines.push(`*Customer:* ${customer.name}`)
    lines.push(`*Phone:* ${customer.phone}`)
    if (mode === 'delivery') lines.push(`*Address:* ${customer.address || '-'}`)
    lines.push(`*Mode:* ${mode === 'delivery' ? '🚚 Delivery' : '🏪 Pickup'}`)
    if (scheduledAt) lines.push(`*Scheduled:* ${scheduledAt}`)
    if (occasion) lines.push(`*Occasion:* ${occasion}`)
    if (cakeMessage) lines.push(`*Cake message:* ${cakeMessage}`)
    lines.push('')
    lines.push('*Items:*')
    items.forEach(i => {
      const opts = []
      if (i.variantLabel) opts.push(i.variantLabel)
      if (i.eggChoice) opts.push(i.eggChoice)
      if (i.addons?.length) opts.push(i.addons.map(a=>a.name).join(', '))
      const line = `  • ${i.qty} × ${i.name}${opts.length ? ' ('+opts.join(' | ')+')' : ''} — $${(i.unitPrice*i.qty).toFixed(2)}`
      lines.push(line)
    })
    lines.push('')
    lines.push(`*Subtotal:* $${subtotal.toFixed(2)}`)
    if (deliveryFee) lines.push(`*Delivery:* $${deliveryFee.toFixed(2)}`)
    lines.push(`*Total:* *$${total.toFixed(2)}*`)
    if (notes) { lines.push(''); lines.push(`*Notes:* ${notes}`) }

    const message = lines.join('\n')
    const whatsappUrl = `https://wa.me/${tenant.whatsappNumber}?text=${encodeURIComponent(message)}`

    return json({ orderId, whatsappUrl, message, total })
  }

  // ADMIN AUTH
  if (path === '/admin/login' && method === 'POST') {
    const { email, password } = await request.json()
    const user = await db.collection('users').findOne({ email: (email||'').toLowerCase() })
    if (!user || !verifyPassword(password, user.passwordHash)) return err('Invalid credentials', 401)
    const tenant = await db.collection('tenants').findOne({ id: user.tenantId })
    const token = signToken({ userId: user.id, tenantId: user.tenantId, role: user.role, email: user.email, name: user.name })
    return json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role }, tenant: { slug: tenant.slug, name: tenant.name, primaryColor: tenant.primaryColor } })
  }

  if (path === '/admin/me' && method === 'GET') {
    const { user, error } = await requireAuth(request); if (error) return error
    const tenant = await db.collection('tenants').findOne({ id: user.tenantId }, { projection: { _id: 0 }})
    return json({ user, tenant })
  }

  // ADMIN PRODUCTS
  if (path === '/admin/products' && method === 'GET') {
    const { user, error } = await requireAuth(request); if (error) return error
    const products = await db.collection('products').find({ tenantId: user.tenantId }, { projection: { _id: 0 } }).toArray()
    const categories = await db.collection('categories').find({ tenantId: user.tenantId }, { projection: { _id: 0 } }).sort({ order:1 }).toArray()
    return json({ products, categories })
  }

  if (path === '/admin/products' && method === 'POST') {
    const { user, error } = await requireAuth(request, ['owner','manager','super_admin']); if (error) return error
    const body = await request.json()
    const product = { id: uuid(), tenantId: user.tenantId, available: true, images: [], badges: [], variants: [], addons: [], ...body }
    await db.collection('products').insertOne(product)
    return json({ product })
  }

  if (segments[0]==='admin' && segments[1]==='products' && segments.length===3) {
    const { user, error } = await requireAuth(request, ['owner','manager','super_admin']); if (error) return error
    const pid = segments[2]
    if (method === 'PUT') {
      const body = await request.json()
      delete body._id; delete body.id; delete body.tenantId
      await db.collection('products').updateOne({ id: pid, tenantId: user.tenantId }, { $set: body })
      return json({ ok: true })
    }
    if (method === 'DELETE') {
      await db.collection('products').deleteOne({ id: pid, tenantId: user.tenantId })
      return json({ ok: true })
    }
  }

  // ADMIN ORDERS
  if (path === '/admin/orders' && method === 'GET') {
    const { user, error } = await requireAuth(request); if (error) return error
    const orders = await db.collection('orders').find({ tenantId: user.tenantId }, { projection: { _id: 0 } }).sort({ createdAt: -1 }).limit(100).toArray()
    return json({ orders })
  }

  // ADMIN TENANT SETTINGS
  if (path === '/admin/tenant' && method === 'PUT') {
    const { user, error } = await requireAuth(request, ['owner','super_admin']); if (error) return error
    const body = await request.json()
    delete body._id; delete body.id; delete body.slug
    await db.collection('tenants').updateOne({ id: user.tenantId }, { $set: body })
    return json({ ok: true })
  }

  return err(`Not found: ${method} ${path}`, 404)
}

export async function GET(request, { params }) { const p = await params; return route(request, 'GET', p.path||[]) }
export async function POST(request, { params }) { const p = await params; return route(request, 'POST', p.path||[]) }
export async function PUT(request, { params }) { const p = await params; return route(request, 'PUT', p.path||[]) }
export async function DELETE(request, { params }) { const p = await params; return route(request, 'DELETE', p.path||[]) }
