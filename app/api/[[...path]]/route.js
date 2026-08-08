import { NextResponse } from "next/server";
import { getDb, ensureSchema } from "@/lib/mongodb";
import { seedIfEmpty } from "@/lib/seed";
import {
  signToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  extractToken,
} from "@/lib/auth";
import { TEMPLATES, buildStarter } from "@/lib/templates";
import { v4 as uuid } from "uuid";

const json = (data, status = 200) => NextResponse.json(data, { status });
const err = (msg, status = 400) =>
  NextResponse.json({ error: msg }, { status });

const jsonValue = (value) => {
  if (value === undefined || value === null) return null;
  if (typeof value === "object") return JSON.stringify(value);
  return value;
};

async function requireAuth(request, roles = null) {
  const token = extractToken(request);
  const payload = verifyToken(token);
  if (!payload) return { error: err("unauthorized", 401) };
  if (roles && !roles.includes(payload.role))
    return { error: err("forbidden", 403) };
  return { user: payload };
}

function buildUpdate(body, allowedFields) {
  const set = [];
  const values = [];
  for (const key of allowedFields) {
    if (key in body) {
      set.push(`${key}=$${values.length + 1}`);
      values.push(jsonValue(body[key]));
    }
  }
  return { set, values };
}

async function route(request, method, segments) {
  const db = getDb();
  await ensureSchema();
  const path = "/" + segments.join("/");

  // POST /api/seed  (dev helper)
  if (path === "/seed" && method === "POST") {
    const r = await seedIfEmpty();
    return json(r);
  }

  // POST /api/signup  { template, businessName, tagline, ownerName, email, password, whatsappNumber, phone, address }
  if (path === "/signup" && method === "POST") {
    const body = await request.json();
    const {
      template,
      businessName,
      tagline,
      ownerName,
      email,
      password,
      whatsappNumber,
      phone,
      address,
    } = body;
    if (!businessName || !ownerName || !email || !password || !whatsappNumber)
      return err("Missing required fields");
    if (password.length < 6)
      return err("Password must be at least 6 characters");
    const emailLc = email.toLowerCase();
    const { rows: existingUserRows } = await db.query(
      `SELECT id FROM users WHERE email=$1`,
      [emailLc],
    );
    if (existingUserRows.length) return err("Email already registered", 409);

    // Slugify + ensure unique
    let baseSlug =
      businessName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "shop";
    let slug = baseSlug;
    let n = 1;
    while (true) {
      const { rows: slugRows } = await db.query(
        `SELECT id FROM tenants WHERE slug=$1`,
        [slug],
      );
      if (!slugRows.length) break;
      n++;
      slug = `${baseSlug}-${n}`;
    }

    const TEMPLATE_THEMES = TEMPLATES;
    const themeCfg = buildStarter(template);
    const theme = {
      primary: themeCfg.theme.primaryColor,
      accent: themeCfg.theme.accentColor,
      tint: themeCfg.theme.bgTint,
      banner: themeCfg.theme.banner,
    };

    const tenantId = uuid();
    await db.query(
      `INSERT INTO tenants (id, slug, name, tagline, logo, banner, primaryColor, accentColor, bgTint, whatsappNumber, phone, email, address, businessHours, deliveryFee, minOrder, prepTimeMins, socialLinks, seoTitle, seoDesc)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [
        tenantId,
        slug,
        businessName,
        tagline || "Made with love",
        "",
        theme.banner,
        theme.primary,
        theme.accent,
        theme.tint,
        whatsappNumber,
        phone || "",
        emailLc,
        address || "",
        jsonValue({ open: "09:00", close: "21:00", days: "Mon-Sun" }),
        40,
        199,
        30,
        jsonValue({ instagram: "", facebook: "" }),
        businessName,
        tagline || `Order from ${businessName}`,
      ],
    );

    const catDocs = themeCfg.categories.map((c, i) => ({
      id: uuid(),
      tenantId,
      name: c.name,
      order_index: i + 1,
      icon: c.icon,
    }));
    for (const cat of catDocs) {
      await db.query(
        `INSERT INTO categories (id, tenantId, name, order_index, icon)
         VALUES ($1,$2,$3,$4,$5)`,
        [cat.id, cat.tenantId, cat.name, cat.order_index, cat.icon],
      );
    }

    const catIdByName = Object.fromEntries(catDocs.map((c) => [c.name, c.id]));
    const prodDocs = (themeCfg.products || [])
      .map((p) => ({
        id: uuid(),
        tenantId,
        categoryId: catIdByName[p.cat],
        name: p.name,
        description: p.description || "",
        images: p.images || [],
        price: p.price,
        discountPrice: p.discountPrice || null,
        rating: p.rating || null,
        badges: p.badges || [],
        available: true,
        isEggOption: !!p.isEggOption,
        allowCakeMessage: !!p.allowCakeMessage,
        variants: (p.variants || []).map((v) => ({
          id: uuid(),
          name: v.name,
          options: v.options,
        })),
        addons: (p.addons || []).map((a) => ({
          id: uuid(),
          name: a.name,
          price: a.price,
        })),
      }))
      .filter((p) => p.categoryId);
    for (const product of prodDocs) {
      await db.query(
        `INSERT INTO products (id, tenantId, categoryId, name, description, images, price, discountPrice, rating, badges, available, isEggOption, allowCakeMessage, variants, addons)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [
          product.id,
          product.tenantId,
          product.categoryId,
          product.name,
          product.description,
          jsonValue(product.images),
          product.price,
          product.discountPrice,
          product.rating,
          jsonValue(product.badges),
          product.available,
          product.isEggOption,
          product.allowCakeMessage,
          jsonValue(product.variants),
          jsonValue(product.addons),
        ],
      );
    }

    const userId = uuid();
    await db.query(
      `INSERT INTO users (id, tenantId, email, passwordHash, name, role)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [userId, tenantId, emailLc, hashPassword(password), ownerName, "owner"],
    );

    const token = signToken({
      userId,
      tenantId,
      role: "owner",
      email: emailLc,
      name: ownerName,
    });
    return json({
      token,
      user: { id: userId, email: emailLc, name: ownerName, role: "owner" },
      tenant: { slug, name: businessName, primaryColor: theme.primary },
    });
  }

  // GET /api/admin/analytics  (last 7 days trends + top products)
  if (path === "/admin/analytics" && method === "GET") {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    const { rows: orders } = await db.query(
      `SELECT id, tenantId, tenantSlug, customer, mode, scheduledAt, occasion, cakeMessage, notes, items, subtotal, deliveryFee, total, status, createdAt
       FROM orders WHERE tenantId=$1 ORDER BY createdAt DESC`,
      [user.tenantId],
    );
    const now = new Date();
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayOrders = orders.filter((o) => {
        const t = new Date(o.createdAt);
        return t >= d && t < next;
      });
      days.push({
        date: d.toISOString().slice(5, 10),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
      });
    }
    const productTotals = {};
    orders.forEach((o) =>
      o.items.forEach((i) => {
        productTotals[i.name] = (productTotals[i.name] || 0) + i.qty;
      }),
    );
    const top = Object.entries(productTotals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, qty]) => ({ name, qty }));
    return json({
      days,
      top,
      totals: {
        orders: orders.length,
        revenue: orders.reduce((s, o) => s + o.total, 0),
      },
    });
  }

  // GET /api/tenants  (list all - for demo landing)
  if (path === "/tenants" && method === "GET") {
    const { rows: tenants } = await db.query(
      `SELECT id,
              slug,
              name,
              tagline,
              logo,
              banner,
              primaryColor AS "primaryColor",
              accentColor AS "accentColor",
              bgTint AS "bgTint",
              whatsappNumber AS "whatsappNumber",
              phone,
              email,
              address,
              businessHours AS "businessHours",
              deliveryFee AS "deliveryFee",
              minOrder AS "minOrder",
              prepTimeMins AS "prepTimeMins",
              socialLinks AS "socialLinks",
              seoTitle AS "seoTitle",
              seoDesc AS "seoDesc"
       FROM tenants
       ORDER BY slug`,
    );
    return json({ tenants });
  }

  // GET /api/tenant/:slug
  if (segments[0] === "tenant" && segments.length === 2 && method === "GET") {
    const slug = segments[1];
    const { rows: tenantRows } = await db.query(
      `SELECT id,
              slug,
              name,
              tagline,
              logo,
              banner,
              primaryColor AS "primaryColor",
              accentColor AS "accentColor",
              bgTint AS "bgTint",
              whatsappNumber AS "whatsappNumber",
              phone,
              email,
              address,
              businessHours AS "businessHours",
              deliveryFee AS "deliveryFee",
              minOrder AS "minOrder",
              prepTimeMins AS "prepTimeMins",
              socialLinks AS "socialLinks",
              seoTitle AS "seoTitle",
              seoDesc AS "seoDesc"
       FROM tenants WHERE slug=$1`,
      [slug],
    );
    const tenant = tenantRows[0];
    if (!tenant) return err("tenant not found", 404);

    const { rows: categories } = await db.query(
      `SELECT id,
              tenantId AS "tenantId",
              name,
              order_index AS "order",
              icon
       FROM categories WHERE tenantId=$1 ORDER BY order_index`,
      [tenant.id],
    );
    const { rows: products } = await db.query(
      `SELECT id,
              tenantId AS "tenantId",
              categoryId AS "categoryId",
              name,
              description,
              images,
              price,
              discountPrice AS "discountPrice",
              rating,
              badges,
              available,
              isEggOption AS "isEggOption",
              allowCakeMessage AS "allowCakeMessage",
              variants,
              addons
       FROM products WHERE tenantId=$1`,
      [tenant.id],
    );
    return json({ tenant, categories, products });
  }

  // GET /api/tenant/:slug/product/:id
  if (
    segments[0] === "tenant" &&
    segments[2] === "product" &&
    segments.length === 4 &&
    method === "GET"
  ) {
    const slug = segments[1];
    const pid = segments[3];
    const { rows: tenantRows } = await db.query(
      `SELECT id,
              name,
              primaryColor AS "primaryColor",
              accentColor AS "accentColor",
              slug
       FROM tenants WHERE slug=$1`,
      [slug],
    );
    const tenant = tenantRows[0];
    if (!tenant) return err("tenant not found", 404);

    const { rows: productRows } = await db.query(
      `SELECT id,
              tenantId AS "tenantId",
              categoryId AS "categoryId",
              name,
              description,
              images,
              price,
              discountPrice AS "discountPrice",
              rating,
              badges,
              available,
              isEggOption AS "isEggOption",
              allowCakeMessage AS "allowCakeMessage",
              variants,
              addons
       FROM products WHERE id=$1 AND tenantId=$2`,
      [pid, tenant.id],
    );
    const product = productRows[0];
    if (!product) return err("product not found", 404);

    return json({
      product,
      tenant: {
        name: tenant.name,
        primaryColor: tenant.primaryColor,
        accentColor: tenant.accentColor,
        slug: tenant.slug,
      },
    });
  }

  // POST /api/checkout  { tenantSlug, customer, mode, scheduledAt, occasion, cakeMessage, notes, items }
  if (path === "/checkout" && method === "POST") {
    const body = await request.json();
    const {
      tenantSlug,
      customer,
      mode,
      scheduledAt,
      occasion,
      cakeMessage,
      notes,
      items,
    } = body;
    if (!tenantSlug || !customer?.name || !customer?.phone || !items?.length)
      return err("missing required fields");

    const { rows: tenantRows } = await db.query(
      "SELECT id, name, deliveryFee, minOrder, whatsappNumber FROM tenants WHERE slug=$1",
      [tenantSlug],
    );
    const tenant = tenantRows[0];
    if (!tenant) return err("tenant not found", 404);

    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.qty, 0);
    const deliveryFee = mode === "delivery" ? tenant.deliveryFee || 0 : 0;
    const total = subtotal + deliveryFee;

    if (total < (tenant.minOrder || 0))
      return err(`Minimum order is ${tenant.minOrder}`);

    const orderId = uuid();
    await db.query(
      `INSERT INTO orders (id, tenantId, tenantSlug, customer, mode, scheduledAt, occasion, cakeMessage, notes, items, subtotal, deliveryFee, total, status, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        orderId,
        tenant.id,
        tenantSlug,
        jsonValue(customer),
        mode,
        scheduledAt || null,
        occasion || null,
        cakeMessage || null,
        notes || null,
        jsonValue(items),
        subtotal,
        deliveryFee,
        total,
        "pending",
        new Date().toISOString(),
      ],
    );

    const lines = [];
    lines.push(`*New Order — ${tenant.name}*`);
    lines.push(`Order ID: ${orderId.slice(0, 8).toUpperCase()}`);
    lines.push("");
    lines.push(`*Customer:* ${customer.name}`);
    lines.push(`*Phone:* ${customer.phone}`);
    if (mode === "delivery")
      lines.push(`*Address:* ${customer.address || "-"}`);
    lines.push(`*Mode:* ${mode === "delivery" ? "🚚 Delivery" : "🏪 Pickup"}`);
    if (scheduledAt) lines.push(`*Scheduled:* ${scheduledAt}`);
    if (occasion) lines.push(`*Occasion:* ${occasion}`);
    if (cakeMessage) lines.push(`*Cake message:* ${cakeMessage}`);
    lines.push("");
    lines.push("*Items:*");
    items.forEach((i) => {
      const opts = [];
      if (i.variantLabel) opts.push(i.variantLabel);
      if (i.eggChoice) opts.push(i.eggChoice);
      if (i.addons?.length) opts.push(i.addons.map((a) => a.name).join(", "));
      const line = `  • ${i.qty} × ${i.name}${opts.length ? " (" + opts.join(" | ") + ")" : ""} — $${(i.unitPrice * i.qty).toFixed(2)}`;
      lines.push(line);
    });
    lines.push("");
    lines.push(`*Subtotal:* $${subtotal.toFixed(2)}`);
    if (deliveryFee) lines.push(`*Delivery:* $${deliveryFee.toFixed(2)}`);
    lines.push(`*Total:* *$${total.toFixed(2)}*`);
    if (notes) {
      lines.push("");
      lines.push(`*Notes:* ${notes}`);
    }

    const message = lines.join("\n");
    const whatsappUrl = `https://wa.me/${tenant.whatsappNumber}?text=${encodeURIComponent(message)}`;

    return json({ orderId, whatsappUrl, message, total });
  }

  // ADMIN AUTH
  if (path === "/admin/login" && method === "POST") {
    const { email, password } = await request.json();
    const { rows: userRows } = await db.query(
      `SELECT id,
              tenantId AS "tenantId",
              email,
              passwordHash AS "passwordHash",
              name,
              role
       FROM users WHERE email=$1`,
      [(email || "").toLowerCase()],
    );
    const user = userRows[0];
    if (!user || !verifyPassword(password, user.passwordHash))
      return err("Invalid credentials", 401);

    const { rows: tenantRows } = await db.query(
      "SELECT slug, name, primaryColor FROM tenants WHERE id=$1",
      [user.tenantId],
    );
    const tenant = tenantRows[0];
    const token = signToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
      name: user.name,
    });
    return json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      tenant: {
        slug: tenant.slug,
        name: tenant.name,
        primaryColor: tenant.primaryColor,
      },
    });
  }

  if (path === "/admin/me" && method === "GET") {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    const { rows: tenantRows } = await db.query(
      `SELECT id,
              slug,
              name,
              tagline,
              logo,
              banner,
              primaryColor AS "primaryColor",
              accentColor AS "accentColor",
              bgTint AS "bgTint",
              whatsappNumber AS "whatsappNumber",
              phone,
              email,
              address,
              businessHours AS "businessHours",
              deliveryFee AS "deliveryFee",
              minOrder AS "minOrder",
              prepTimeMins AS "prepTimeMins",
              socialLinks AS "socialLinks",
              seoTitle AS "seoTitle",
              seoDesc AS "seoDesc"
       FROM tenants WHERE id=$1`,
      [user.tenantId],
    );
    const tenant = tenantRows[0];
    return json({ user, tenant });
  }

  // ADMIN PRODUCTS
  if (path === "/admin/products" && method === "GET") {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    const { rows: products } = await db.query(
      `SELECT id,
              tenantId AS "tenantId",
              categoryId AS "categoryId",
              name,
              description,
              images,
              price,
              discountPrice AS "discountPrice",
              rating,
              badges,
              available,
              isEggOption AS "isEggOption",
              allowCakeMessage AS "allowCakeMessage",
              variants,
              addons
       FROM products WHERE tenantId=$1`,
      [user.tenantId],
    );
    const { rows: categories } = await db.query(
      `SELECT id, tenantId, name, order_index AS "order", icon
       FROM categories WHERE tenantId=$1 ORDER BY order_index`,
      [user.tenantId],
    );
    return json({ products, categories });
  }

  if (path === "/admin/products" && method === "POST") {
    const { user, error } = await requireAuth(request, [
      "owner",
      "manager",
      "super_admin",
    ]);
    if (error) return error;
    const body = await request.json();
    const product = {
      id: uuid(),
      tenantId: user.tenantId,
      available: true,
      images: [],
      badges: [],
      variants: [],
      addons: [],
      ...body,
    };
    await db.query(
      `INSERT INTO products (id, tenantId, categoryId, name, description, images, price, discountPrice, rating, badges, available, isEggOption, allowCakeMessage, variants, addons)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [
        product.id,
        product.tenantId,
        product.categoryId || null,
        product.name || null,
        product.description || null,
        jsonValue(product.images),
        product.price || null,
        product.discountPrice || null,
        product.rating || null,
        jsonValue(product.badges),
        product.available,
        product.isEggOption || false,
        product.allowCakeMessage || false,
        jsonValue(product.variants),
        jsonValue(product.addons),
      ],
    );
    return json({ product });
  }

  // ADMIN CATEGORIES
  if (path === "/admin/categories" && method === "GET") {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    const { rows: categories } = await db.query(
      `SELECT id, tenantId AS "tenantId", name, order_index AS "order", icon
       FROM categories WHERE tenantId=$1 ORDER BY order_index`,
      [user.tenantId],
    );
    return json({ categories });
  }

  if (path === "/admin/categories" && method === "POST") {
    const { user, error } = await requireAuth(request, [
      "owner",
      "manager",
      "super_admin",
    ]);
    if (error) return error;
    const body = await request.json();
    const { name, icon } = body;
    if (!name) return err("Missing category name");
    const { rows } = await db.query(
      `SELECT COALESCE(MAX(order_index),0)+1 AS next_order FROM categories WHERE tenantId=$1`,
      [user.tenantId],
    );
    const order_index = rows[0].next_order;
    const id = uuid();
    await db.query(
      `INSERT INTO categories (id, tenantId, name, order_index, icon) VALUES ($1,$2,$3,$4,$5)`,
      [id, user.tenantId, name, order_index, icon || null],
    );
    const { rows: catRows } = await db.query(
      `SELECT id, tenantId AS "tenantId", name, order_index AS "order", icon FROM categories WHERE id=$1`,
      [id],
    );
    return json({ category: catRows[0] });
  }

  if (
    segments[0] === "admin" &&
    segments[1] === "categories" &&
    segments.length === 3
  ) {
    const { user, error } = await requireAuth(request, [
      "owner",
      "manager",
      "super_admin",
    ]);
    if (error) return error;
    const cid = segments[2];

    if (method === "PUT") {
      const body = await request.json();
      const allowed = ["name", "icon", "order_index"];
      const { set, values } = buildUpdate(body, allowed);
      if (set.length) {
        await db.query(
          `UPDATE categories SET ${set.join(", ")} WHERE id=$${values.length + 1} AND tenantId=$${values.length + 2}`,
          [...values, cid, user.tenantId],
        );
      }
      const { rows: updated } = await db.query(
        `SELECT id, tenantId AS "tenantId", name, order_index AS "order", icon FROM categories WHERE id=$1`,
        [cid],
      );
      return json({ category: updated[0] });
    }

    if (method === "DELETE") {
      await db.query("DELETE FROM categories WHERE id=$1 AND tenantId=$2", [
        cid,
        user.tenantId,
      ]);
      return json({ ok: true });
    }
  }

  if (
    segments[0] === "admin" &&
    segments[1] === "products" &&
    segments.length === 3
  ) {
    const { user, error } = await requireAuth(request, [
      "owner",
      "manager",
      "super_admin",
    ]);
    if (error) return error;
    const pid = segments[2];

    if (method === "PUT") {
      const body = await request.json();
      const allowed = [
        "categoryId",
        "name",
        "description",
        "images",
        "price",
        "discountPrice",
        "rating",
        "badges",
        "available",
        "isEggOption",
        "allowCakeMessage",
        "variants",
        "addons",
      ];
      const { set, values } = buildUpdate(body, allowed);
      if (set.length) {
        await db.query(
          `UPDATE products SET ${set.join(", ")} WHERE id=$${values.length + 1} AND tenantId=$${values.length + 2}`,
          [...values, pid, user.tenantId],
        );
      }
      return json({ ok: true });
    }

    if (method === "DELETE") {
      await db.query("DELETE FROM products WHERE id=$1 AND tenantId=$2", [
        pid,
        user.tenantId,
      ]);
      return json({ ok: true });
    }
  }

  // ADMIN ORDERS
  if (path === "/admin/orders" && method === "GET") {
    const { user, error } = await requireAuth(request);
    if (error) return error;
    const { rows: orders } = await db.query(
      `SELECT id,
              tenantId AS "tenantId",
              tenantSlug,
              customer,
              mode,
              scheduledAt,
              occasion,
              cakeMessage,
              notes,
              items,
              subtotal,
              deliveryFee,
              total,
              status,
              createdAt
       FROM orders WHERE tenantId=$1 ORDER BY createdAt DESC LIMIT 100`,
      [user.tenantId],
    );
    return json({ orders });
  }

  // ADMIN TENANT SETTINGS
  if (path === "/admin/tenant" && method === "PUT") {
    const { user, error } = await requireAuth(request, [
      "owner",
      "super_admin",
    ]);
    if (error) return error;
    const body = await request.json();
    const allowed = [
      "name",
      "tagline",
      "logo",
      "banner",
      "primaryColor",
      "accentColor",
      "bgTint",
      "whatsappNumber",
      "phone",
      "email",
      "address",
      "businessHours",
      "deliveryFee",
      "minOrder",
      "prepTimeMins",
      "socialLinks",
      "seoTitle",
      "seoDesc",
    ];
    const { set, values } = buildUpdate(body, allowed);
    if (set.length) {
      await db.query(
        `UPDATE tenants SET ${set.join(", ")} WHERE id=$${values.length + 1}`,
        [...values, user.tenantId],
      );
    }
    return json({ ok: true });
  }

  return err(`Not found: ${method} ${path}`, 404);
}

export async function GET(request, { params }) {
  const p = await params;
  return route(request, "GET", p.path || []);
}
export async function POST(request, { params }) {
  const p = await params;
  return route(request, "POST", p.path || []);
}
export async function PUT(request, { params }) {
  const p = await params;
  return route(request, "PUT", p.path || []);
}
export async function DELETE(request, { params }) {
  const p = await params;
  return route(request, "DELETE", p.path || []);
}
