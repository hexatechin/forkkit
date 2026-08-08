// Shared template registry: theme + starter categories + starter products
// Used by signup + backfill. Each product references category by name.

export const TEMPLATES = {
  bakery: {
    label: 'Bakery',
    theme: {
      primaryColor: '#a0522d', accentColor: '#d4a373', bgTint: '#fdf6ec',
      banner: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=1600&q=80',
    },
    categories: [
      { name: 'Cakes', icon: '🎂' },
      { name: 'Pastries', icon: '🥐' },
      { name: 'Breads', icon: '🍞' },
      { name: 'Cookies', icon: '🍪' },
    ],
    products: [
      { cat: 'Cakes', name: 'Classic Chocolate Cake', description: 'Rich Belgian chocolate layers with silky ganache.', price: 32, discountPrice: 28, rating: 4.8, badges: ['Bestseller'], images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800'], isEggOption: true, allowCakeMessage: true, variants: [{ name:'Size', options:[{label:'0.5 kg', priceDelta:0},{label:'1 kg', priceDelta:15},{label:'2 kg', priceDelta:35}] }], addons: [{name:'Candles', price:2},{name:'Gift wrap', price:4}] },
      { cat: 'Pastries', name: 'Butter Croissant', description: 'Flaky, buttery French classic.', price: 4, rating: 4.9, images:['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800'] },
      { cat: 'Breads', name: 'Sourdough Loaf', description: 'Traditionally leavened, crackling crust.', price: 7, rating: 4.8, badges:['Popular'], images:['https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=800'] },
      { cat: 'Cookies', name: 'Choc Chip Cookies (6 pack)', description: 'Gooey centers, crisp edges.', price: 9, discountPrice: 7.5, rating: 4.7, images:['https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800'] },
    ]
  },

  home_baker: {
    label: 'Home baker',
    theme: {
      primaryColor: '#c2410c', accentColor: '#fed7aa', bgTint: '#fff7ed',
      banner: 'https://images.unsplash.com/photo-1587244141541-6b3e5b8b0ba1?w=1600&q=80',
    },
    categories: [
      { name: 'Custom Cakes', icon: '🎂' },
      { name: 'Cupcakes', icon: '🧁' },
      { name: 'Desserts', icon: '🍮' },
    ],
    products: [
      { cat: 'Custom Cakes', name: 'Signature Truffle Cake', description: 'Made-to-order truffle cake, your design.', price: 45, rating: 4.9, badges:['Bestseller'], images:['https://images.unsplash.com/photo-1586788680434-30d324b2d46f?w=800'], isEggOption: true, allowCakeMessage: true, variants:[{ name:'Size', options:[{label:'0.5 kg', priceDelta:0},{label:'1 kg', priceDelta:20}] }] },
      { cat: 'Cupcakes', name: 'Vanilla Cupcakes (6)', description: 'Buttercream frosting, sprinkles.', price: 15, rating: 4.7, images:['https://images.unsplash.com/photo-1519869325930-281384150729?w=800'] },
      { cat: 'Desserts', name: 'Tiramisu Cups', description: 'Layered espresso-soaked ladyfingers with mascarpone.', price: 8, rating: 4.8, images:['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=800'] },
    ]
  },

  florist: {
    label: 'Florist',
    theme: {
      primaryColor: '#db2777', accentColor: '#fbcfe8', bgTint: '#fdf2f8',
      banner: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1600&q=80',
    },
    categories: [
      { name: 'Bouquets', icon: '💐' },
      { name: 'Arrangements', icon: '🌷' },
      { name: 'Occasions', icon: '🌹' },
      { name: 'Plants', icon: '🪴' },
    ],
    products: [
      { cat: 'Bouquets', name: 'Rose Romance Bouquet', description: 'A dozen premium red roses, hand-wrapped in kraft paper.', price: 55, discountPrice: 48, rating: 4.9, badges:['Bestseller'], images:['https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=800'], allowCakeMessage: true, variants:[{ name:'Size', options:[{label:'6 stems', priceDelta:-15},{label:'12 stems', priceDelta:0},{label:'24 stems', priceDelta:22}] }], addons:[{name:'Handwritten note', price:2},{name:'Chocolate box', price:12}] },
      { cat: 'Bouquets', name: 'Sunflower Sunshine', description: 'Cheerful sunflowers with seasonal greens.', price: 38, rating: 4.7, images:['https://images.unsplash.com/photo-1470509037663-253afd7f0f51?w=800'], allowCakeMessage: true },
      { cat: 'Bouquets', name: 'Pastel Mixed Bouquet', description: 'Soft pastel blooms, seasonal picks by the florist.', price: 42, rating: 4.8, badges:['Popular'], images:['https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=800'], allowCakeMessage: true },
      { cat: 'Arrangements', name: 'Elegant Table Centerpiece', description: 'Low-profile arrangement, perfect for dinner tables.', price: 75, rating: 4.8, images:['https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800'] },
      { cat: 'Arrangements', name: 'Glass Vase Deluxe', description: 'Curated mix in a stylish glass vase.', price: 65, rating: 4.7, images:['https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800'] },
      { cat: 'Occasions', name: 'Bridal Bouquet', description: 'Timeless white and blush bouquet for the big day.', price: 120, rating: 5.0, badges:['Premium'], images:['https://images.unsplash.com/photo-1519741497674-611481863552?w=800'], allowCakeMessage: true, addons:[{name:'Matching boutonniere', price:15},{name:'Petal box', price:20}] },
      { cat: 'Occasions', name: 'Anniversary Special', description: 'Red roses & lilies with a keepsake vase.', price: 85, rating: 4.9, images:['https://images.unsplash.com/photo-1462275646964-a0e3386b89fa?w=800'], allowCakeMessage: true },
      { cat: 'Plants', name: 'Peace Lily Plant', description: 'Air-purifying houseplant in a ceramic pot.', price: 32, rating: 4.6, images:['https://images.unsplash.com/photo-1509937528035-ad76254b0356?w=800'] },
    ]
  },

  gift_shop: {
    label: 'Gift shop',
    theme: {
      primaryColor: '#7c3aed', accentColor: '#ddd6fe', bgTint: '#faf5ff',
      banner: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=1600&q=80',
    },
    categories: [
      { name: 'Gifts', icon: '🎁' },
      { name: 'Hampers', icon: '🎓' },
      { name: 'Personalized', icon: '✨' },
    ],
    products: [
      { cat: 'Gifts', name: 'Scented Candle Set', description: 'Trio of hand-poured soy candles.', price: 28, rating: 4.7, images:['https://images.unsplash.com/photo-1602874801007-aa10e5d4a2c1?w=800'] },
      { cat: 'Hampers', name: 'Deluxe Chocolate Hamper', description: 'Curated chocolates, cookies and tea.', price: 65, rating: 4.8, badges:['Bestseller'], images:['https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800'] },
      { cat: 'Personalized', name: 'Custom Photo Mug', description: 'Upload your photo, we print & ship.', price: 15, rating: 4.6, images:['https://images.unsplash.com/photo-1481833761820-0509d3217039?w=800'] },
    ]
  },

  tiffin: {
    label: 'Tiffin service',
    theme: {
      primaryColor: '#065f46', accentColor: '#a7f3d0', bgTint: '#ecfdf5',
      banner: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1600&q=80',
    },
    categories: [
      { name: 'Lunch', icon: '🍛' },
      { name: 'Dinner', icon: '🍝' },
      { name: 'Snacks', icon: '🥪' },
      { name: 'Combos', icon: '🍽️' },
    ],
    products: [
      { cat: 'Lunch', name: 'Veg Thali', description: '2 sabzi, dal, rice, roti, salad, sweet.', price: 8, rating: 4.7, badges:['Bestseller'], images:['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800'] },
      { cat: 'Dinner', name: 'Non-Veg Special', description: 'Chicken curry, rice, roti, dal, salad.', price: 10, rating: 4.8, images:['https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800'] },
      { cat: 'Combos', name: 'Weekly Lunch Combo', description: '5-day lunch pack, delivered daily.', price: 35, discountPrice: 30, rating: 4.9, badges:['Save'], images:['https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=800'] },
    ]
  },

  cloud_kitchen: {
    label: 'Cloud kitchen',
    theme: {
      primaryColor: '#0f766e', accentColor: '#99f6e4', bgTint: '#f0fdfa',
      banner: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&q=80',
    },
    categories: [
      { name: 'Mains', icon: '🍝' },
      { name: 'Starters', icon: '🍢' },
      { name: 'Desserts', icon: '🍰' },
      { name: 'Drinks', icon: '🧋' },
    ],
    products: [
      { cat: 'Mains', name: 'Butter Chicken', description: 'Creamy tomato gravy, tender chicken, served with butter naan.', price: 14, rating: 4.8, badges:['Popular'], images:['https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800'] },
      { cat: 'Starters', name: 'Paneer Tikka', description: 'Marinated cottage cheese, char-grilled.', price: 9, rating: 4.6, images:['https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800'] },
      { cat: 'Drinks', name: 'Fresh Lime Soda', description: 'Sweet or salted, your choice.', price: 3, rating: 4.5, images:['https://images.unsplash.com/photo-1523371054106-bbf80586c33c?w=800'], variants:[{ name:'Style', options:[{label:'Sweet', priceDelta:0},{label:'Salted', priceDelta:0}] }] },
    ]
  },

  office_space: {
    label: 'Office space',
    theme: {
      primaryColor: '#1e40af', accentColor: '#bfdbfe', bgTint: '#eff6ff',
      banner: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80',
    },
    categories: [
      { name: 'Hot Desks', icon: '💻' },
      { name: 'Meeting Rooms', icon: '🪑' },
      { name: 'Private Offices', icon: '🏢' },
      { name: 'Day Passes', icon: '🎫' },
    ],
    products: [
      { cat: 'Hot Desks', name: 'Day Pass — Hot Desk', description: 'Any available desk, high-speed WiFi, unlimited coffee.', price: 25, rating: 4.7, badges:['Popular'], images:['https://images.unsplash.com/photo-1497366216548-37526070297c?w=800'] },
      { cat: 'Hot Desks', name: 'Weekly Hot Desk', description: '5-day flexible desk access.', price: 110, discountPrice: 99, rating: 4.8, badges:['Save 10%'], images:['https://images.unsplash.com/photo-1497215842964-222b430dc094?w=800'] },
      { cat: 'Hot Desks', name: 'Monthly Membership', description: 'Unlimited desk access, 5hrs meeting room credits included.', price: 349, rating: 4.9, badges:['Bestseller'], images:['https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=800'] },
      { cat: 'Meeting Rooms', name: 'Small Meeting Room (4 seats)', description: '1-hour booking. Whiteboard + display included.', price: 20, rating: 4.7, images:['https://images.unsplash.com/photo-1517502884422-41eaead166d4?w=800'], variants:[{ name:'Duration', options:[{label:'1 hour', priceDelta:0},{label:'2 hours', priceDelta:18},{label:'Half day (4h)', priceDelta:55}] }] },
      { cat: 'Meeting Rooms', name: 'Medium Meeting Room (8 seats)', description: 'Perfect for team meetings. 4K display, video conferencing.', price: 35, rating: 4.8, images:['https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'], variants:[{ name:'Duration', options:[{label:'1 hour', priceDelta:0},{label:'2 hours', priceDelta:30},{label:'Half day (4h)', priceDelta:95}] }] },
      { cat: 'Meeting Rooms', name: 'Conference Room (20 seats)', description: 'Board-style seating, premium AV, catering available.', price: 80, rating: 4.9, badges:['Premium'], images:['https://images.unsplash.com/photo-1431540015161-0bf868a2d407?w=800'], variants:[{ name:'Duration', options:[{label:'1 hour', priceDelta:0},{label:'Half day (4h)', priceDelta:220},{label:'Full day', priceDelta:400}] }], addons:[{name:'Coffee & snacks (per person)', price:8},{name:'Lunch catering (per person)', price:18}] },
      { cat: 'Private Offices', name: '2-Person Private Office', description: 'Lockable office, monthly rental. Includes utilities.', price: 799, rating: 4.9, images:['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800'] },
      { cat: 'Private Offices', name: '4-Person Private Office', description: 'Team office with dedicated storage.', price: 1499, rating: 4.9, images:['https://images.unsplash.com/photo-1497366858526-0766cadbe8fa?w=800'] },
      { cat: 'Day Passes', name: 'Half-Day Pass', description: 'Up to 4 hours of coworking access.', price: 15, rating: 4.6, images:['https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800'] },
      { cat: 'Day Passes', name: 'Evening Pass (5-10 PM)', description: 'Perfect for freelancers with a day job.', price: 12, rating: 4.7, images:['https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800'] },
    ]
  },
}

export function buildStarter(template) {
  return TEMPLATES[template] || TEMPLATES.bakery
}
