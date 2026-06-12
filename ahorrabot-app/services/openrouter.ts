// services/openrouter.ts
import axios from 'axios';
import { PRODUCTS, STORES, PRICES, PROMOTIONS, calculateBestOptionsForProduct } from './supermarket-data';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const fetchBotResponse = async (
  chatHistory: ChatMessage[],
  userCards: string[],
  currentDay: string
): Promise<string> => {
  try {
    if (!OPENROUTER_API_KEY) {
      console.warn('⚠️ Missing OpenRouter API Key in environment!');
      return 'Che, disculpame, pero parece que no configuraste la clave de API de OpenRouter en el archivo .env. ¡Cargala así puedo ayudarte a ahorrar!';
    }

    // Build static summary of products and promotions to feed the AI
    const dataContextSummary = `
DATOS DE PRODUCTOS Y PRECIOS BASE EN ARGENTINA:
${PRODUCTS.map(p => {
  const storePrices = PRICES.filter(pr => pr.productId === p.id);
  return `- ${p.name}: ${storePrices.map(pr => {
    const storeName = STORES.find(s => s.id === pr.storeId)?.name || pr.storeId;
    return `${storeName} ($${pr.price})`;
  }).join(', ')}`;
}).join('\n')}

PROMOCIONES ACTIVAS:
${PROMOTIONS.map(promo => {
  const storeName = STORES.find(s => s.id === promo.storeId)?.name || promo.storeId;
  return `- [${storeName}] ${promo.name}: ${promo.discountPercent}% off los días ${promo.days.join('/')} pagando con "${promo.cardName}". ${promo.description}`;
}).join('\n')}

CONTEXTO ACTUAL DEL USUARIO:
- Día de la semana hoy: ${currentDay}
- Tarjetas/Promociones activas del usuario: ${userCards.length > 0 ? userCards.join(', ') : 'Ninguna tarjeta seleccionada (solo efectivo/débito básico)'}
`;

    const systemPrompt = `
Eres "AhorraBot", el mejor asistente de compras y ahorro familiar de Argentina. Ayudas a los usuarios a estirar el sueldo calculando dónde les conviene comprar sus víveres diarios en base a ofertas, promociones bancarias (como Cuenta DNI, BNA+, MODO, Comunidad Coto, etc.), días de la semana y distancias de las tiendas.

INSTRUCCIONES DE COMPORTAMIENTO:
1. **Personalidad**: Habla con modismos argentinos, de forma muy cálida, amigable y empática (usá palabras como "che", "loco", "viste", "te conviene", "fijate", "mirá", "un golazo").
2. **Cálculos Matemáticos**: Cuando el usuario te pregunte por un producto (como fideos, arroz, desodorantes, yerba, aceite, leche) o dónde comprar hoy:
   - Consulta los datos de productos y promociones provistos en el contexto.
   - Aplica los descuentos que correspondan según el día de la semana actual (${currentDay}) y las tarjetas que tiene el usuario (${userCards.join(', ')}).
   - Calcula el precio final para cada supermercado.
   - Recomienda la opción más barata detallando las cuentas (ej. "En Coto sale $1200, pero hoy tenés 15% con Comunidad Coto, te queda en $1020...").
3. **Referencias**: Si el usuario te pregunta por comercios cercanos, recomiéndales usar la pestaña "Mapa" para verlos geolocalizados, e indica que pueden activar/desactivar sus tarjetas de ahorro en la pantalla de "Inicio".
4. **Respuestas cortas y claras**: No te vayas por las ramas. Respondé con formato markdown limpio y amigable.

Aquí tienes los datos actualizados del sistema:
${dataContextSummary}
`;

    // Map chatHistory to API format
    const messages = [
      { role: 'system', content: systemPrompt },
      ...chatHistory
    ];

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-4o-mini',
        messages: messages,
        temperature: 0.7,
        max_tokens: 600,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://github.com/nedder3/ahorrabot-app', // OpenRouter statistic tracking
          'X-Title': 'AhorraBot App',
        },
      }
    );

    return response.data.choices?.[0]?.message?.content || '⚠️ No pude obtener respuesta, intentá de nuevo.';
  } catch (error: any) {
    console.error('❌ Error calling OpenRouter API:', error.response?.data || error.message);
    return 'Che, se me complicó conectar con el servidor del bot. Fijate si tenés internet o probá en un ratito, ¡mil disculpas!';
  }
};
