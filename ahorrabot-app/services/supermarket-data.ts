// services/supermarket-data.ts

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
  cardName: string; // 'Cuenta DNI', 'Comunidad Coto', etc.
  description: string;
  maxRefund?: number; // Maximum cash refund in ARS
}

export const PRODUCTS: Product[] = [
  { id: 'fideos', name: 'Fideos Tallarín (500g)', category: 'Almacén' },
  { id: 'arroz', name: 'Arroz Largo Fino (1kg)', category: 'Almacén' },
  { id: 'desodorante', name: 'Desodorante Antitranspirante (150ml)', category: 'Perfumería' },
  { id: 'yerba', name: 'Yerba Mate con Palo (1kg)', category: 'Almacén' },
  { id: 'aceite', name: 'Aceite de Girasol (1.5L)', category: 'Almacén' },
  { id: 'leche', name: 'Leche Entera Larga Vida (1L)', category: 'Lácteos' }
];

export const STORES: Store[] = [
  { id: 'coto', name: 'Coto Sucursal Belgrano', distance: 0.6, latOffset: 0.003, lngOffset: -0.004 },
  { id: 'carrefour', name: 'Carrefour Market', distance: 1.1, latOffset: -0.005, lngOffset: 0.006 },
  { id: 'dia', name: 'Supermercados Día%', distance: 0.4, latOffset: 0.002, lngOffset: 0.002 },
  { id: 'jumbo', name: 'Jumbo Premium', distance: 2.3, latOffset: -0.012, lngOffset: -0.009 }
];

export const PRICES: PriceRecord[] = [
  // Fideos
  { productId: 'fideos', storeId: 'coto', price: 1200 },
  { productId: 'fideos', storeId: 'carrefour', price: 1350 },
  { productId: 'fideos', storeId: 'dia', price: 1100 },
  { productId: 'fideos', storeId: 'jumbo', price: 1400 },
  
  // Arroz
  { productId: 'arroz', storeId: 'coto', price: 1800 },
  { productId: 'arroz', storeId: 'carrefour', price: 1950 },
  { productId: 'arroz', storeId: 'dia', price: 1700 },
  { productId: 'arroz', storeId: 'jumbo', price: 2100 },

  // Desodorante
  { productId: 'desodorante', storeId: 'coto', price: 3500 },
  { productId: 'desodorante', storeId: 'carrefour', price: 3100 },
  { productId: 'desodorante', storeId: 'dia', price: 3350 },
  { productId: 'desodorante', storeId: 'jumbo', price: 3700 },

  // Yerba
  { productId: 'yerba', storeId: 'coto', price: 4200 },
  { productId: 'yerba', storeId: 'carrefour', price: 4400 },
  { productId: 'yerba', storeId: 'dia', price: 4050 },
  { productId: 'yerba', storeId: 'jumbo', price: 4800 },

  // Aceite
  { productId: 'aceite', storeId: 'coto', price: 2800 },
  { productId: 'aceite', storeId: 'carrefour', price: 2950 },
  { productId: 'aceite', storeId: 'dia', price: 2750 },
  { productId: 'aceite', storeId: 'jumbo', price: 3150 },

  // Leche
  { productId: 'leche', storeId: 'coto', price: 1380 },
  { productId: 'leche', storeId: 'carrefour', price: 1300 },
  { productId: 'leche', storeId: 'dia', price: 1350 },
  { productId: 'leche', storeId: 'jumbo', price: 1490 }
];

export const PROMOTIONS: Promotion[] = [
  {
    id: 'coto-comunidad',
    storeId: 'coto',
    name: 'Comunidad Coto',
    discountPercent: 15,
    days: ['Miércoles', 'Jueves'],
    cardName: 'Comunidad Coto',
    description: '15% de descuento presentando la tarjeta de Comunidad Coto.'
  },
  {
    id: 'coto-tci',
    storeId: 'coto',
    name: 'Tarjeta Coto TCI',
    discountPercent: 20,
    days: ['Lunes'],
    cardName: 'Tarjeta TCI Coto',
    description: '20% de descuento abonando con Tarjeta Coto TCI.'
  },
  {
    id: 'carrefour-cuenta-dni',
    storeId: 'carrefour',
    name: 'Cuenta DNI',
    discountPercent: 30,
    days: ['Sábado', 'Domingo'],
    cardName: 'Cuenta DNI',
    description: '30% de reintegro pagando con QR de Cuenta DNI (Tope de $4.000).',
    maxRefund: 4000
  },
  {
    id: 'carrefour-tarjeta',
    storeId: 'carrefour',
    name: 'Tarjeta Carrefour',
    discountPercent: 10,
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    cardName: 'Tarjeta Carrefour',
    description: '10% de descuento todos los días con Tarjeta de Crédito Carrefour.'
  },
  {
    id: 'dia-bna',
    storeId: 'dia',
    name: 'Banco Nación (BNA+)',
    discountPercent: 20,
    days: ['Miércoles'],
    cardName: 'BNA+',
    description: '20% de descuento pagando con MODO / BNA+.'
  },
  {
    id: 'dia-club-yerba',
    storeId: 'dia',
    name: 'Cupón Club Día Yerba',
    discountPercent: 5, // Simple percentage for calculations
    days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
    cardName: 'Club Día',
    description: 'Cupón de descuento directo de $200 en Yerbas en la app Club Día.'
  },
  {
    id: 'jumbo-cencosud',
    storeId: 'jumbo',
    name: 'Tarjeta Cencosud',
    discountPercent: 20,
    days: ['Miércoles'],
    cardName: 'Tarjeta Cencosud',
    description: '20% de descuento abonando con Tarjeta Cencosud.'
  },
  {
    id: 'jumbo-galicia',
    storeId: 'jumbo',
    name: 'Banco Galicia',
    discountPercent: 15,
    days: ['Jueves'],
    cardName: 'Banco Galicia',
    description: '15% de descuento para clientes Galicia Eminent/Galicia Débito.'
  }
];

// Helper to get active promotions based on day and user cards
export const getActivePromos = (storeId: string, day: string, userCards: string[]) => {
  return PROMOTIONS.filter(promo => {
    if (promo.storeId !== storeId) return false;
    
    // Check if day matches
    const dayMatches = promo.days.includes(day);
    if (!dayMatches) return false;

    // Check if user has the card or if it is a general discount
    return userCards.includes(promo.cardName);
  });
};

// Calculate Best Prices for a specific product
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
    
    // Calculate total discount
    let totalDiscountPercent = 0;
    activePromos.forEach(p => {
      // In Argentina, discounts sometimes stack or we just take the max. Let's take the max discount or stack them up to 50%
      totalDiscountPercent = Math.min(50, totalDiscountPercent + p.discountPercent);
    });

    const finalPrice = Math.round(priceRecord.price * (1 - totalDiscountPercent / 100));
    
    let breakdownText = `Precio base: $${priceRecord.price}.`;
    if (activePromos.length > 0) {
      breakdownText += ` Promociones aplicadas: ${activePromos.map(p => `${p.name} (-${p.discountPercent}%)`).join(', ')}.`;
      breakdownText += ` Precio final: $${finalPrice}.`;
    } else {
      breakdownText += ` Sin promociones aplicables para hoy (${day}) con tus tarjetas.`;
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
  }).sort((a, b) => a.finalPrice - b.finalPrice); // Sort cheapest first
};
