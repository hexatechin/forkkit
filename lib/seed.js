import { getDb } from './mongodb';
import { hashPassword } from './auth';
import { v4 as uuid } from 'uuid';

let seeding = null;
export async function seedIfEmpty() {
  if (seeding) return seeding;
  seeding = (async () => {
  const db = await getDb();
  // Idempotent guard by slug
  const existingSlug = await db.collection('tenants').findOne({ slug: 'royalbakery' });
  if (existingSlug) return { seeded: false, message: 'already seeded' };

  const bakeryId = uuid();
  const cafeId = uuid();

  await db.collection('tenants').insertMany([
    {
      id: bakeryId,
      slug: 'royalbakery',
      name: 'Royal Bakery',
      tagline: 'Handcrafted cakes & pastries, baked fresh daily',
      logo: 'https://images.unsplash.com/photo-1587244141541-6b3e5b8b0ba1?w=200',
      banner: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1600&q=80',
      primaryColor: '#a0522d',
      accentColor: '#d4a373',
      bgTint: '#fdf6ec',
      whatsappNumber: '15551234567',
      phone: '+1 555 123 4567',
      email: 'hello@royalbakery.com',
      address: '221 Baker Street, Downtown',
      businessHours: { open: '09:00', close: '21:00', days: 'Mon-Sun' },
      deliveryFee: 5,
      minOrder: 15,
      prepTimeMins: 60,
      socialLinks: { instagram: 'https://instagram.com/royalbakery', facebook: '' },
      seoTitle: 'Royal Bakery - Fresh cakes & pastries',
      seoDesc: 'Order handcrafted cakes, pastries and breads online. Fast delivery.',
    },
    {
      id: cafeId,
      slug: 'sunrisecafe',
      name: 'Sunrise Café',
      tagline: 'Brewed with love, served with a smile',
      logo: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=200',
      banner: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=80',
      primaryColor: '#0f766e',
      accentColor: '#facc15',
      bgTint: '#f0fdfa',
      whatsappNumber: '15559876543',
      phone: '+1 555 987 6543',
      email: 'hi@sunrisecafe.com',
      address: '88 Morning Ave, Old Town',
      businessHours: { open: '07:00', close: '20:00', days: 'Mon-Sun' },
      deliveryFee: 3,
      minOrder: 10,
      prepTimeMins: 25,
      socialLinks: { instagram: 'https://instagram.com/sunrisecafe', facebook: '' },
      seoTitle: 'Sunrise Café - Coffee & breakfast',
      seoDesc: 'Order coffee, breakfast and light bites from Sunrise Café.',
    }
  ]);

  const cats = [
    { id: uuid(), tenantId: bakeryId, name: 'Cakes', order: 1, icon: '🎂' },
    { id: uuid(), tenantId: bakeryId, name: 'Pastries', order: 2, icon: '🥐' },
    { id: uuid(), tenantId: bakeryId, name: 'Breads', order: 3, icon: '🍞' },
    { id: uuid(), tenantId: bakeryId, name: 'Cookies', order: 4, icon: '🍪' },
    { id: uuid(), tenantId: cafeId, name: 'Coffee', order: 1, icon: '☕' },
    { id: uuid(), tenantId: cafeId, name: 'Breakfast', order: 2, icon: '🍳' },
    { id: uuid(), tenantId: cafeId, name: 'Sandwiches', order: 3, icon: '🥪' },
    { id: uuid(), tenantId: cafeId, name: 'Drinks', order: 4, icon: '🧋' },
  ];
  await db.collection('categories').insertMany(cats);

  const catByName = (tid, name) => cats.find(c => c.tenantId===tid && c.name===name).id;

  const products = [
    // Bakery products
    { id: uuid(), tenantId: bakeryId, categoryId: catByName(bakeryId,'Cakes'), name: 'Classic Chocolate Cake', description: 'Rich Belgian chocolate layers with silky ganache.', images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800','https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800'], price: 32, discountPrice: 28, rating: 4.8, badges: ['Bestseller'], available: true, isEggOption: true, allowCakeMessage: true,
      variants: [{ id: uuid(), name: 'Size', options: [{ label: '0.5 kg', priceDelta: 0 },{ label: '1 kg', priceDelta: 15 },{ label: '2 kg', priceDelta: 35 }]}],
      addons: [{ id: uuid(), name: 'Candles', price: 2 },{ id: uuid(), name: 'Gift Wrap', price: 4 }] },
    { id: uuid(), tenantId: bakeryId, categoryId: catByName(bakeryId,'Cakes'), name: 'Red Velvet Delight', description: 'Moist red velvet with cream cheese frosting.', images: ['https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800'], price: 30, rating: 4.7, badges: ['New'], available: true, isEggOption: true, allowCakeMessage: true, variants: [{ id: uuid(), name: 'Size', options: [{ label: '0.5 kg', priceDelta: 0 },{ label: '1 kg', priceDelta: 12 }]}], addons: [] },
    { id: uuid(), tenantId: bakeryId, categoryId: catByName(bakeryId,'Pastries'), name: 'Butter Croissant', description: 'Flaky, buttery French classic. Baked every morning.', images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800'], price: 4, rating: 4.9, badges: [], available: true, addons: [], variants: [] },
    { id: uuid(), tenantId: bakeryId, categoryId: catByName(bakeryId,'Pastries'), name: 'Almond Danish', description: 'Sweet almond paste in flaky pastry.', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800'], price: 5, rating: 4.6, badges: [], available: true, addons: [], variants: [] },
    { id: uuid(), tenantId: bakeryId, categoryId: catByName(bakeryId,'Breads'), name: 'Sourdough Loaf', description: 'Traditionally leavened, crackling crust.', images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800','https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800'], price: 7, rating: 4.8, badges: ['Popular'], available: true, addons: [], variants: [] },
    { id: uuid(), tenantId: bakeryId, categoryId: catByName(bakeryId,'Cookies'), name: 'Choc Chip Cookies (6 pack)', description: 'Gooey centers, crisp edges.', images: ['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800'], price: 9, discountPrice: 7.5, rating: 4.7, badges: ['Discount'], available: true, addons: [], variants: [] },
    // Cafe products
    { id: uuid(), tenantId: cafeId, categoryId: catByName(cafeId,'Coffee'), name: 'Cappuccino', description: 'Espresso with velvety milk foam.', images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800'], price: 4.5, rating: 4.8, badges: [], available: true, variants: [{ id: uuid(), name: 'Size', options:[{label:'Small',priceDelta:0},{label:'Regular',priceDelta:0.75},{label:'Large',priceDelta:1.5}]}], addons: [{ id: uuid(), name: 'Extra shot', price: 1 },{ id: uuid(), name: 'Oat milk', price: 0.5 }] },
    { id: uuid(), tenantId: cafeId, categoryId: catByName(cafeId,'Coffee'), name: 'Iced Latte', description: 'Chilled espresso with cold milk.', images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=800'], price: 5, rating: 4.7, badges: ['Cold'], available: true, addons: [{ id: uuid(), name: 'Vanilla syrup', price: 0.5 }], variants: [] },
    { id: uuid(), tenantId: cafeId, categoryId: catByName(cafeId,'Breakfast'), name: 'Avocado Toast', description: 'Sourdough, smashed avo, chilli flakes.', images: ['https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800'], price: 9, rating: 4.6, badges: ['Healthy'], available: true, addons: [{ id: uuid(), name: 'Poached egg', price: 2 }], variants: [] },
    { id: uuid(), tenantId: cafeId, categoryId: catByName(cafeId,'Sandwiches'), name: 'Grilled Chicken Panini', description: 'Chicken, mozzarella, pesto on ciabatta.', images: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=800'], price: 11, rating: 4.7, badges: [], available: true, addons: [], variants: [] },
    { id: uuid(), tenantId: cafeId, categoryId: catByName(cafeId,'Drinks'), name: 'Mango Smoothie', description: 'Fresh mango, yogurt, honey.', images: ['https://images.unsplash.com/photo-1546173159-315724a31696?w=800'], price: 6, rating: 4.5, badges: [], available: true, addons: [], variants: [] },
  ];
  await db.collection('products').insertMany(products);

  await db.collection('users').insertMany([
    { id: uuid(), tenantId: bakeryId, email: 'owner@royalbakery.com', passwordHash: hashPassword('password123'), name: 'Royal Owner', role: 'owner' },
    { id: uuid(), tenantId: cafeId, email: 'owner@sunrisecafe.com', passwordHash: hashPassword('password123'), name: 'Cafe Owner', role: 'owner' },
  ]);

  return { seeded: true, tenants: [{ slug:'royalbakery' },{ slug:'sunrisecafe' }] };
  })();
  try { return await seeding; } finally { seeding = null; }
}
