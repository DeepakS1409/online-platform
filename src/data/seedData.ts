import { Category, Product, BusinessSettings } from '../types';

export const INITIAL_BUSINESS_SETTINGS: BusinessSettings = {
  business_name: 'V2 Boutique',
  tagline: "Fine Women's Nightwear & Pure Cotton Essentials",
  whatsapp_number: '917306117078',
  contact_phone: '+91 73061 17078',
  contact_email: 'orders@v2boutique.in',
  currency_symbol: '₹',
  default_delivery_charge_paise: 6000, // ₹60.00
  free_delivery_threshold_paise: 99900, // Free delivery above ₹999.00
  min_order_value_paise: 20000, // Minimum order ₹200.00
  address: 'Savithri, 2/373-2/2, Park Avenue West, Myleripalayam, Coimbatore - 641032',
  reservation_expiry_hours: 24,
};

export const INITIAL_CATEGORIES: Category[] = [
  {
    id: 'cat-nighty',
    name: 'Nighty',
    slug: 'nighty',
    description: 'Ultra-soft, breathable 100% pure combed cotton nighties in classic floral, batik, and modern prints.',
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-panties',
    name: 'Panties',
    slug: 'panties',
    description: 'Hypoallergenic, breathable pure cotton daily briefs, hipster cuts, and multi-packs.',
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-banians',
    name: 'Banians',
    slug: 'banians',
    description: 'Premium combed cotton slip vests, spaghetti camisoles, and sleeveless banians with snug contouring.',
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-nightdress',
    name: 'Nightdress',
    slug: 'nightdress',
    description: 'Modern 2-piece loungewear sets, button-down maternity sleepwear, and satin-finish night suits.',
    display_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'cat-inskirts',
    name: 'Inskirts (Pavadai)',
    slug: 'inskirts-pavadai',
    description: 'Sturdy, colorfast pure cotton poplin inskirts with 6-cut styling, interlock stitching, and soft drawstring.',
    display_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  // 1. NIGHTY
  {
    id: 'prod-nighty-01',
    name: 'V2 Heritage Pure Cotton Floral Print Nighty',
    slug: 'v2-heritage-pure-cotton-floral-print-nighty',
    description: 'Crafted from 100% premium combed cotton with a relaxed fit. Features delicate embroidery along the rounded neckline, side pocket, and vibrant color-fast dyes. Perfect for warm summer nights and all-day lounging.',
    category_id: 'cat-nighty',
    sku: 'V2-NGT-FLR-01',
    selling_price_paise: 49900, // ₹499.00
    purchase_cost_paise: 27500, // ₹275.00
    packaging_cost_paise: 2000, // ₹20.00
    stock_physical: 45,
    stock_reserved: 0,
    available_stock: 45,
    low_stock_threshold: 10,
    is_active: true,
    images: [
      {
        id: 'img-n1-1',
        image_url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ngt-01-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      },
      {
        id: 'img-n1-2',
        image_url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ngt-01-2.jpg',
        display_order: 2,
        is_thumbnail: false,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-nighty-02',
    name: 'V2 Pastel Kalamkari Front-Zip Feeding & Daily Nighty',
    slug: 'v2-pastel-kalamkari-front-zip-feeding-nighty',
    description: 'Designed for effortless nursing and everyday relaxation. Made with breathable 60s count pure cotton fabric, smooth invisible dual front zippers, and reinforced hem seams.',
    category_id: 'cat-nighty',
    sku: 'V2-NGT-ZIP-02',
    selling_price_paise: 54900, // ₹549.00
    purchase_cost_paise: 31000,
    packaging_cost_paise: 2000,
    stock_physical: 30,
    stock_reserved: 0,
    available_stock: 30,
    low_stock_threshold: 8,
    is_active: true,
    images: [
      {
        id: 'img-n2-1',
        image_url: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ngt-02-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 2. PANTIES
  {
    id: 'prod-panty-01',
    name: 'V2 CloudSoft Cotton Full-Brief Panties (Pack of 3)',
    slug: 'v2-cloudsoft-cotton-full-brief-panties-pack-of-3',
    description: 'Super-soft elastic waistband with zero skin pinching. Made from 95% combed cotton and 5% elastane for seamless contouring and hygienic everyday freshness.',
    category_id: 'cat-panties',
    sku: 'V2-PNT-BLP-01',
    selling_price_paise: 34900, // ₹349.00
    purchase_cost_paise: 16000,
    packaging_cost_paise: 1500,
    stock_physical: 60,
    stock_reserved: 0,
    available_stock: 60,
    low_stock_threshold: 15,
    is_active: true,
    images: [
      {
        id: 'img-p1-1',
        image_url: 'https://images.unsplash.com/photo-1583292650898-7d22cd27ca6f?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/pnt-01-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-panty-02',
    name: 'V2 Anti-Chafing Boyshort Stretch Panties',
    slug: 'v2-anti-chafing-boyshort-stretch-panties',
    description: 'Full-coverage design prevents inner-thigh friction under sarees, dresses, and skirts. Sweat-wicking cotton gusset with flat-locked zero-irritation seams.',
    category_id: 'cat-panties',
    sku: 'V2-PNT-BOY-02',
    selling_price_paise: 27900, // ₹279.00
    purchase_cost_paise: 13000,
    packaging_cost_paise: 1500,
    stock_physical: 25,
    stock_reserved: 0,
    available_stock: 25,
    low_stock_threshold: 5,
    is_active: true,
    images: [
      {
        id: 'img-p2-1',
        image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/pnt-02-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 3. BANIANS
  {
    id: 'prod-banian-01',
    name: 'V2 Pure Cotton Camisole Slip Banian (White & Nude)',
    slug: 'v2-pure-cotton-camisole-slip-banian',
    description: 'Ultra-thin, ribbed stretch combed cotton camisole with adjustable shoulder straps. Perfect base layer under kurtis, shirts, and salwar suits.',
    category_id: 'cat-banians',
    sku: 'V2-BAN-SLP-01',
    selling_price_paise: 22900, // ₹229.00
    purchase_cost_paise: 9500,
    packaging_cost_paise: 1000,
    stock_physical: 50,
    stock_reserved: 0,
    available_stock: 50,
    low_stock_threshold: 10,
    is_active: true,
    images: [
      {
        id: 'img-b1-1',
        image_url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ban-01-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-banian-02',
    name: 'V2 Scoop-Neck Sleeveless Cotton Body-Vest Banian',
    slug: 'v2-scoop-neck-sleeveless-cotton-body-vest',
    description: '100% breathable organic cotton slip vest with wide shoulder bands for anti-slip support. Retains shape after multiple washes.',
    category_id: 'cat-banians',
    sku: 'V2-BAN-SCP-02',
    selling_price_paise: 24900, // ₹249.00
    purchase_cost_paise: 11000,
    packaging_cost_paise: 1000,
    stock_physical: 40,
    stock_reserved: 0,
    available_stock: 40,
    low_stock_threshold: 8,
    is_active: true,
    images: [
      {
        id: 'img-b2-1',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ban-02-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 4. NIGHTDRESS
  {
    id: 'prod-nightdress-01',
    name: 'V2 Cozy 2-Piece Modal Sleep Shirt & Pyjama Lounge Set',
    slug: 'v2-cozy-2-piece-modal-sleep-shirt-pyjama-set',
    description: 'Buttery-soft modal knit fabric with contrast satin piping, chest patch pocket, and elasticized waistband trousers with functional deep side pockets.',
    category_id: 'cat-nightdress',
    sku: 'V2-NDR-SET-01',
    selling_price_paise: 79900, // ₹799.00
    purchase_cost_paise: 44000,
    packaging_cost_paise: 3000,
    stock_physical: 35,
    stock_reserved: 0,
    available_stock: 35,
    low_stock_threshold: 6,
    is_active: true,
    images: [
      {
        id: 'img-nd1-1',
        image_url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ndr-01-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-nightdress-02',
    name: 'V2 Premium Cotton T-Shirt & Capri Summer Sleep Set',
    slug: 'v2-premium-cotton-tshirt-capri-summer-sleep-set',
    description: 'Chic graphic typography print tee paired with cropped 3/4 length printed capri pants. Ultra-airy cotton knit engineered for tropical warmth.',
    category_id: 'cat-nightdress',
    sku: 'V2-NDR-CAP-02',
    selling_price_paise: 64900, // ₹649.00
    purchase_cost_paise: 35000,
    packaging_cost_paise: 2500,
    stock_physical: 28,
    stock_reserved: 0,
    available_stock: 28,
    low_stock_threshold: 5,
    is_active: true,
    images: [
      {
        id: 'img-nd2-1',
        image_url: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ndr-02-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    updated_at: new Date().toISOString(),
  },

  // 5. INSKIRTS (PAVADAI)
  {
    id: 'prod-inskirt-01',
    name: 'V2 Pure Cotton 6-Cut Mermaid Fit Inskirt (Pavadai) - Jet Black',
    slug: 'v2-pure-cotton-6-cut-mermaid-fit-inskirt-black',
    description: 'High-density 2x2 cotton poplin with 6-panel tailoring for that gorgeous, figure-flattering saree drape. Sturdy interlock seams and durable woven drawstring.',
    category_id: 'cat-inskirts',
    sku: 'V2-INS-6CT-01',
    selling_price_paise: 29900, // ₹299.00
    purchase_cost_paise: 14500,
    packaging_cost_paise: 1500,
    stock_physical: 50,
    stock_reserved: 0,
    available_stock: 50,
    low_stock_threshold: 12,
    is_active: true,
    images: [
      {
        id: 'img-i1-1',
        image_url: 'https://images.unsplash.com/photo-1518049362265-d5b2a6467637?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ins-01-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'prod-inskirt-02',
    name: 'V2 Classic Ruby Red Cotton Saree Petticoat (Pavadai)',
    slug: 'v2-classic-ruby-red-cotton-saree-petticoat',
    description: 'Double-stitched bottom flare for unrestricted movement and heavy silk/cotton saree draping. Guaranteed color-fast dye.',
    category_id: 'cat-inskirts',
    sku: 'V2-INS-RED-02',
    selling_price_paise: 29900, // ₹299.00
    purchase_cost_paise: 14500,
    packaging_cost_paise: 1500,
    stock_physical: 40,
    stock_reserved: 0,
    available_stock: 40,
    low_stock_threshold: 10,
    is_active: true,
    images: [
      {
        id: 'img-i2-1',
        image_url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=800&q=80',
        storage_path: 'products/ins-02-1.jpg',
        display_order: 1,
        is_thumbnail: true,
      }
    ],
    created_at: new Date(Date.now() - 86400000 * 9).toISOString(),
    updated_at: new Date().toISOString(),
  },
];
