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

    const dataContextSummary = `
DATOS DE PRODUCTOS Y PRECIOS EN BAHÍA BLANCA:
${PRODUCTS.map(p => {
  const storePrices = PRICES.filter(pr => pr.productId === p.id);
  return `- ${p.name}: ${storePrices.map(pr => {
    const storeName = STORES.find(s => s.id === pr.storeId)?.name || pr.storeId;
    return `${storeName} ($${pr.price})`;
  }).join(', ')}`;
}).join('\n')}

PROMOCIONES ACTIVAS LOCALES EN BAHÍA BLANCA:
${PROMOTIONS.map(promo => {
  const storeName = STORES.find(s => s.id === promo.storeId)?.name || promo.storeId;
  return `- [${storeName}] ${promo.name}: ${promo.discountPercent}% off los días ${promo.days.join('/')} pagando con "${promo.cardName}". ${promo.description}`;
}).join('\n')}

CONTEXTO ACTUAL DEL USUARIO:
- Ubicación: Bahía Blanca, Provincia de Buenos Aires, Argentina (o geolocalizado en la zona)
- Día de la semana hoy: ${currentDay}
- Tarjetas/Promociones activas del usuario: ${userCards.length > 0 ? userCards.join(', ') : 'Ninguna tarjeta seleccionada (solo efectivo/débito básico)'}
`;

    const systemPrompt = `
Eres "AhorraBot", el mejor asistente de compras y ahorro familiar de Bahía Blanca y toda Argentina. Ayudas a los usuarios a estirar el sueldo calculando dónde les conviene comprar sus víveres diarios en base a ofertas, promociones bancarias (como Cuenta DNI, MODO, tarjeta Coopeplus, Club Día, Tarjeta Carrefour, etc.), días de la semana y distancias.

INSTRUCCIONES DE COMPORTAMIENTO:
1. **Personalidad**: Habla con modismos bahienses y argentinos, de forma muy cálida, amigable y empática (usá palabras como "che", "loco", "viste", "te conviene", "fijate", "mirá", "un golazo", "ir a La Coope").
2. **Cálculos Matemáticos**: Cuando el usuario te pregunte por un producto (como fideos, arroz, desodorantes, yerba, aceite, leche) o dónde comprar hoy en Bahía Blanca:
   - Consulta los datos de productos y promociones de Bahía Blanca provistos en el contexto.
   - Aplica los descuentos que correspondan según el día de la semana actual (${currentDay}) y las tarjetas que tiene el usuario (${userCards.join(', ')}).
   - Recuerda que Cooperativa Obrera ("La Coope") es sumamente popular aquí y suele tener excelentes ofertas de marcas propias y con Cuenta DNI o Coopeplus.
   - Recomienda la opción más barata detallando las cuentas de forma sencilla.
3. **Referencias**: Si el usuario quiere ver los supermercados geolocalizados, recomiéndale usar la pestaña "Mapa", e indica que pueden activar/desactivar sus tarjetas en la pantalla de "Inicio".
4. **Respuestas cortas y claras**: No te vayas por las ramas. Respondé con formato markdown limpio.

Aquí tienes los datos actualizados de Bahía Blanca:
${dataContextSummary}
`;

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
          'HTTP-Referer': 'https://github.com/nedder3/ahorrabot-app',
          'X-Title': 'AhorraBot App',
        },
      }
    );

    return response.data.choices?.[0]?.message?.content || '⚠️ No pude obtener respuesta, intentá de nuevo.';
  } catch (error: any) {
    console.error('❌ Error calling OpenRouter API:', error.response?.data || error.message);
    return 'Che, se me complicó conectar con mi servidor. ¡Fijate si tenés internet o probá en un ratito!';
  }
};
