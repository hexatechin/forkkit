import { NextResponse } from 'next/server'
import { getDb } from '@/lib/mongodb'
import { seedIfEmpty } from '@/lib/seed'
import { signToken, verifyToken, hashPassword, verifyPassword, extractToken } from '@/lib/auth'
import { TEMPLATES, buildStarter } from '@/lib/templates'
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

    const TEMPLATE_THEMES = TEMPLATES
    const themeCfg = buildStarter(template)
    const theme = { primary: themeCfg.theme.primaryColor, accent: themeCfg.theme.accentColor, tint: themeCfg.theme.bgTint, banner: themeCfg.theme.banner }

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
    const catDocs = themeCfg.categories.map((c, i) => ({ id: uuid(), tenantId, name: c.name, order: i+1, icon: c.icon }))
    await db.collection('categories').insertMany(catDocs)

    // Starter products
    const catIdByName = Object.fromEntries(catDocs.map(c => [c.name, c.id]))
    const prodDocs = (themeCfg.products || []).map(p => ({
      id: uuid(), tenantId, categoryId: catIdByName[p.cat],
      name: p.name, description: p.description || '', images: p.images || [],
      price: p.price, discountPrice: p.discountPrice || null,
      rating: p.rating || null, badges: p.badges || [], available: true,
      isEggOption: !!p.isEggOption, allowCakeMessage: !!p.allowCakeMessage,
      variants: (p.variants||[]).map(v => ({ id: uuid(), name: v.name, options: v.options })),
      addons: (p.addons||[]).map(a => ({ id: uuid(), name: a.name, price: a.price })),
    })).filter(p => p.categoryId)
    if (prodDocs.length) await db.collection('products').insertMany(prodDocs)

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
