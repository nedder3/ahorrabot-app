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
  { id: 'leche', name: 'Leche Entera Larga Vida (1L)', category: 'Lácteos' }
];

export const STORES: Store[] = [
  { id: 'coope', name: 'Cooperativa Obrera ("La Coope")', distance: 0.4, latOffset: 0.002, lngOffset: -0.003 },
  { id: 'carrefour', name: 'Carrefour Bahía Blanca', distance: 0.8, latOffset: -0.004, lngOffset: 0.004 },
  { id: 'dia', name: 'Supermercado Día% Chiclana', distance: 0.5, latOffset: 0.003, lngOffset: 0.003 },
  { id: 'vea', name: 'Vea Supermercados Bahía', distance: 1.2, latOffset: -0.007, lngOffset: -0.006 }
];

export const PRICES: PriceRecord[] = [
  // Fideos
  { productId: 'fideos', storeId: 'coope', price: 1050 },
  { productId: 'fideos', storeId: 'carrefour', price: 1300 },
  { productId: 'fideos', storeId: 'dia', price: 1100 },
  { productId: 'fideos', storeId: 'vea', price: 1250 },
  
  // Arroz
  { productId: 'arroz', storeId: 'coope', price: 1650 },
  { productId: 'arroz', storeId: 'carrefour', price: 1900 },
  { productId: 'arroz', storeId: 'dia', price: 1700 },
  { productId: 'arroz', storeId: 'vea', price: 1850 },

  // Desodorante
  { productId: 'desodorante', storeId: 'coope', price: 3300 },
  { productId: 'desodorante', storeId: 'carrefour', price: 3100 },
  { productId: 'desodorante', storeId: 'dia', price: 3350 },
  { productId: 'desodorante', storeId: 'vea', price: 3400 },

  // Yerba
  { productId: 'yerba', storeId: 'coope', price: 3950 },
  { productId: 'yerba', storeId: 'carrefour', price: 4400 },
  { productId: 'yerba', storeId: 'dia', price: 4050 },
  { productId: 'yerba', storeId: 'vea', price: 4200 },

  // Aceite
  { productId: 'aceite', storeId: 'coope', price: 2600 },
  { productId: 'aceite', storeId: 'carrefour', price: 2950 },
  { productId: 'aceite', storeId: 'dia', price: 2750 },
  { productId: 'aceite', storeId: 'vea', price: 2850 },

  // Leche
  { productId: 'leche', storeId: 'coope', price: 1250 },
  { productId: 'leche', storeId: 'carrefour', price: 1300 },
  { productId: 'leche', storeId: 'dia', price: 1350 },
  { productId: 'leche', storeId: 'vea', price: 1290 }
];

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
