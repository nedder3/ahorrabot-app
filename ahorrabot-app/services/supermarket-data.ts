// services/supermarket-data.ts
import axios from 'axios';
import * as db from '../database/db';
import scrapedPrices from './scraped_prices.json';

export interface Product {
  id: string;
  name: string;
  category: string;
}

export interface Store {
  id: string;
  name: string;
  distance: number; // in km
  latOffset: number; // offset from user lat
  lngOffset: number; // offset from user lng
}

export interface PriceRecord {
  productId: string;
  storeId: string;
  price: number;
}

export interface Promotion {
  id: string;
  storeId: string;
  name: string;
  discountPercent: number;
  days: string[]; // ['Lunes', 'Miércoles', ...]
  cardName: string; // 'Cuenta DNI', 'Coopeplus', etc.
  description: string;
  maxRefund?: number;
}

export const PRODUCTS: Product[] = [
  { id: 'fideos', name: 'Fideos Tallarín (500g)', category: 'Almacén' },
  { id: 'arroz', name: 'Arroz Largo Fino (1kg)', category: 'Almacén' },
  { id: 'desodorante', name: 'Desodorante Antitranspirante (150ml)', category: 'Perfumería' },
  { id: 'yerba', name: 'Yerba Mate con Palo (1kg)', category: 'Almacén' },
  { id: 'aceite', name: 'Aceite de Girasol (1.5L)', category: 'Almacén' },
  { id: 'leche', name: 'Leche Entera Larga Vida (1L)', category: 'Lácteos' },
  { id: 'azucar', name: 'Azúcar Común Tipo A (1kg)', category: 'Almacén' },
  { id: 'harina', name: 'Harina de Trigo 000 (1kg)', category: 'Almacén' },
  { id: 'manteca', name: 'Manteca (200g)', category: 'Lácteos' },
  { id: 'yogur', name: 'Yogur Descremado (900g)', category: 'Lácteos' },
  { id: 'champu', name: 'Shampoo (350ml)', category: 'Perfumería' },
  { id: 'dental', name: 'Crema Dental (90g)', category: 'Perfumería' },
  { id: 'detergente', name: 'Detergente Lavavajillas (500ml)', category: 'Limpieza' },
  { id: 'lavandina', name: 'Lavandina Común (1L)', category: 'Limpieza' },
  { id: 'jabon_ropa', name: 'Jabón Líquido para Ropa (3L)', category: 'Limpieza' },
  { id: 'agua', name: 'Agua Mineral Sin Gas (1.5L)', category: 'Almacén' }
];

export const STORES: Store[] = [
  { id: 'coope', name: 'Cooperativa Obrera ("La Coope")', distance: 0.4, latOffset: 0.002, lngOffset: -0.003 },
  { id: 'carrefour', name: 'Carrefour Bahía Blanca', distance: 0.8, latOffset: -0.004, lngOffset: 0.004 },
  { id: 'dia', name: 'Hiper ChangoMás / Día% Chiclana', distance: 0.5, latOffset: 0.003, lngOffset: 0.003 },
  { id: 'vea', name: 'Vea Supermercados Bahía', distance: 1.2, latOffset: -0.007, lngOffset: -0.006 }
];

// Pre-populated prices from the latest Bahia Blanca scraping run (fallback/default values)
export const PRICES: PriceRecord[] = [...scrapedPrices] as PriceRecord[];

export const PROMOTIONS: Promotion[] = [
  {
    id: 'coopeplus-descuento',
    storeId: 'coope',
    name: 'Tarjeta Coopeplus',
    discountPercent: 15,
    days: ['Martes', 'Jueves'],
    cardName: 'Tarjeta Coopeplus',
    description: '15% de descuento exclusivo abonando con tu tarjeta Coopeplus.'
  },
  {
    id: 'coope-ahorro-dia',
    storeId: 'coope',
    name: 'Coope Ahorro',
    discountPercent: 10,
    days: ['Lunes', 'Miércoles'],
    cardName: 'Asociado Coope',
    description: '10% de descuento para asociados en marcas propias de La Coope.'
  },
  {
    id: 'coope-cuenta-dni',
    storeId: 'coope',
    name: 'Cuenta DNI (Coope)',
    discountPercent: 30,
    days: ['Sábado', 'Domingo'],
    cardName: 'Cuenta DNI',
    description: '30% de reintegro pagando con Cuenta DNI del Banco Provincia en Cooperativa Obrera.',
    maxRefund: 4000
  },
  {
    id: 'carrefour-cuenta-dni',
    storeId: 'carrefour',
    name: 'Cuenta DNI (Carrefour)',
    discountPercent: 30,
    days: ['Sábado', 'Domingo'],
    cardName: 'Cuenta DNI',
    description: '30% de reintegro pagando con QR de Cuenta DNI en Carrefour Market.',
    maxRefund: 4000
  },
  {
    id: 'carrefour-tarjeta',
    storeId: 'carrefour',
    name: 'Tarjeta Carrefour',
    discountPercent: 10,
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    cardName: 'Tarjeta Carrefour',
    description: '10% de descuento diario pagando con tu Tarjeta de Crédito Carrefour.'
  },
  {
    id: 'dia-bna',
    storeId: 'dia',
    name: 'Banco Nación (BNA+)',
    discountPercent: 20,
    days: ['Miércoles'],
    cardName: 'BNA+',
    description: '20% de descuento en Día% pagando con MODO / BNA+.'
  },
  {
    id: 'dia-club',
    storeId: 'dia',
    name: 'Club Día%',
    discountPercent: 10,
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    cardName: 'Club Día',
    description: '10% de descuento adicional en cupones cargados en la app Club Día.'
  },
  {
    id: 'vea-cencosud',
    storeId: 'vea',
    name: 'Tarjeta Cencosud',
    discountPercent: 15,
    days: ['Miércoles'],
    cardName: 'Tarjeta Cencosud',
    description: '15% de descuento pagando con Tarjeta Cencosud en Vea.'
  }
];

export const getActivePromos = (storeId: string, day: string, userCards: string[]) => {
  return PROMOTIONS.filter(promo => {
    if (promo.storeId !== storeId) return false;
    const dayMatches = promo.days.includes(day);
    if (!dayMatches) return false;
    return userCards.includes(promo.cardName);
  });
};

export interface CalculationResult {
  storeId: string;
  storeName: string;
  distance: number;
  originalPrice: number;
  discountPercent: number;
  finalPrice: number;
  activePromos: Promotion[];
  breakdownText: string;
}

export const calculateBestOptionsForProduct = (
  productId: string,
  day: string,
  userCards: string[]
): CalculationResult[] => {
  const productPrices = PRICES.filter(p => p.productId === productId);
  
  return productPrices.map(priceRecord => {
    const store = STORES.find(s => s.id === priceRecord.storeId)!;
    const activePromos = getActivePromos(store.id, day, userCards);
    
    let totalDiscountPercent = 0;
    activePromos.forEach(p => {
      totalDiscountPercent = Math.min(50, totalDiscountPercent + p.discountPercent);
    });

    const finalPrice = Math.round(priceRecord.price * (1 - totalDiscountPercent / 100));
    
    let breakdownText = `Precio base: $${priceRecord.price}.`;
    if (activePromos.length > 0) {
      breakdownText += ` Promos: ${activePromos.map(p => `${p.name} (-${p.discountPercent}%)`).join(', ')}.`;
      breakdownText += ` Final: $${finalPrice}.`;
    } else {
      breakdownText += ` Sin promociones aplicadas para hoy (${day}) con tus tarjetas.`;
    }

    return {
      storeId: store.id,
      storeName: store.name,
      distance: store.distance,
      originalPrice: priceRecord.price,
      discountPercent: totalDiscountPercent,
      finalPrice,
      activePromos,
      breakdownText
    };
  }).sort((a, b) => a.finalPrice - b.finalPrice);
};

// --- REAL-TIME PRICES FETCHING SERVICE ---

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
};

// Map of product IDs to their best search terms
export const PRODUCT_QUERIES: Record<string, string> = {
  fideos: 'fideos tallarin 500g',
  arroz: 'arroz largo fino 1kg',
  desodorante: 'desodorante antitranspirante 150ml',
  yerba: 'yerba mate con palo 1kg',
  aceite: 'aceite de girasol 1.5l',
  leche: 'leche entera larga vida 1l',
  azucar: 'azucar comun tipo a 1kg',
  harina: 'harina de trigo 000 1kg',
  manteca: 'manteca 200g',
  yogur: 'yogur descremado 900g',
  champu: 'shampoo 350ml',
  dental: 'crema dental 90g',
  detergente: 'detergente lavavajillas 500ml',
  lavandina: 'lavandina 1l',
  jabon_ropa: 'jabon liquido ropa 3l',
  agua: 'agua mineral sin gas 1.5l'
};

/**
 * Loads products and prices from the SQLite/LocalStorage database.
 * Seeds the DB with default scraped values if empty.
 */
export const loadPricesFromDb = async (): Promise<void> => {
  try {
    console.log('[Database] Syncing scraped products and prices to SQLite...');
    
    // Seed/Update products in SQLite
    for (const p of PRODUCTS) {
      await db.saveProductToDb(p.id, p.name, p.category);
    }
    
    // Seed/Update prices in SQLite from the local scrapedPrices JSON file
    for (const pr of scrapedPrices) {
      await db.savePriceToDb(pr.productId, pr.storeId, pr.price);
    }
    
    // Now load everything from SQLite to ensure we are using the SQLite values as the runtime state
    const dbProducts = await db.getProductsFromDb();
    const dbPrices = await db.getPricesFromDb();
    
    // Update PRODUCTS array in-place
    PRODUCTS.length = 0;
    dbProducts.forEach(p => PRODUCTS.push(p));
    
    // Update PRICES array in-place
    PRICES.length = 0;
    dbPrices.forEach(pr => PRICES.push(pr));
    
    console.log(`[Database] Database loaded and synced. Products: ${PRODUCTS.length}, Prices: ${PRICES.length}`);
  } catch (e) {
    console.error('[Database] Failed to load prices from DB:', e);
  }
};

/**
 * Fetches real-time prices for a single search term/query across the four major supermarkets
 * and updates both the database and global PRICES cache.
 */
export const fetchPricesForQuery = async (productId: string, query: string): Promise<boolean> => {
  console.log(`[Scraper] Fetching real-time prices for: "${query}" (id: ${productId})`);
  
  const fetchTasks = [
    // 1. La Coope
    async () => {
      try {
        const searchRes = await axios.get(`https://api.lacoopeencasa.coop/api/buscar?q=${encodeURIComponent(query)}`, {
          headers: HEADERS,
          timeout: 7000
        });
        const products = searchRes.data?.datos?.producto || [];
        if (products.length > 0 && products[0].cod_interno) {
          const cod = products[0].cod_interno;
          const detailRes = await axios.get(`https://api.lacoopeencasa.coop/api/articulo/detalle?cod_interno={cod}`, {
            headers: HEADERS,
            timeout: 7000
          });
          const priceStr = detailRes.data?.datos?.precio;
          if (priceStr) {
            await updatePriceInCache(productId, 'coope', Math.round(parseFloat(priceStr)));
          }
        }
      } catch (e: any) {
        console.warn(`[La Coope] Failed to fetch "${query}":`, e.message);
      }
    },
    // 2. Carrefour
    async () => {
      try {
        const res = await axios.get(`https://www.carrefour.com.ar/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`, {
          headers: HEADERS,
          timeout: 7000
        });
        if (res.data && res.data.length > 0) {
          const item = res.data[0];
          const price = item.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || item.items?.[0]?.sellers?.[0]?.commertialOffer?.ListPrice;
          if (price) {
            await updatePriceInCache(productId, 'carrefour', Math.round(price));
          }
        }
      } catch (e: any) {
        console.warn(`[Carrefour] Failed to fetch "${query}":`, e.message);
      }
    },
    // 3. Vea
    async () => {
      try {
        const res = await axios.get(`https://www.vea.com.ar/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`, {
          headers: HEADERS,
          timeout: 7000
        });
        if (res.data && res.data.length > 0) {
          const item = res.data[0];
          const price = item.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || item.items?.[0]?.sellers?.[0]?.commertialOffer?.ListPrice;
          if (price) {
            await updatePriceInCache(productId, 'vea', Math.round(price));
          }
        }
      } catch (e: any) {
        console.warn(`[Vea] Failed to fetch "${query}":`, e.message);
      }
    },
    // 4. ChangoMás (mapped to store 'dia')
    async () => {
      try {
        const res = await axios.get(`https://www.masonline.com.ar/api/catalog_system/pub/products/search?ft=${encodeURIComponent(query)}`, {
          headers: HEADERS,
          timeout: 7000
        });
        if (res.data && res.data.length > 0) {
          const item = res.data[0];
          const price = item.items?.[0]?.sellers?.[0]?.commertialOffer?.Price || item.items?.[0]?.sellers?.[0]?.commertialOffer?.ListPrice;
          if (price) {
            await updatePriceInCache(productId, 'dia', Math.round(price));
          }
        }
      } catch (e: any) {
        console.warn(`[ChangoMás] Failed to fetch "${query}":`, e.message);
      }
    }
  ];

  // Run all supermarket fetches in parallel for this product
  await Promise.all(fetchTasks.map(task => task()));
  return true;
};

// Helper to update PRICES array in-place and save to Database
const updatePriceInCache = async (productId: string, storeId: string, price: number) => {
  const index = PRICES.findIndex(p => p.productId === productId && p.storeId === storeId);
  if (index > -1) {
    PRICES[index].price = price;
  } else {
    PRICES.push({ productId, storeId, price });
  }

  // Persist update in SQLite/LocalStorage Database
  try {
    await db.savePriceToDb(productId, storeId, price);
  } catch (err) {
    console.error('[Database] Failed to save updated price to DB:', err);
  }
};

/**
 * Iterates through all available products and fetches live prices in the background.
 * Uses a small delay between products to avoid overwhelming the endpoints.
 */
export const updateAllPricesInBackground = async (onProductUpdated?: () => void): Promise<void> => {
  console.log('[Scraper] Starting background live prices update...');
  for (const product of PRODUCTS) {
    const query = PRODUCT_QUERIES[product.id];
    if (query) {
      await fetchPricesForQuery(product.id, query);
      if (onProductUpdated) {
        onProductUpdated();
      }
      // Wait 1 second before querying the next product to prevent rate-limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  console.log('[Scraper] Background live prices update completed!');
};
