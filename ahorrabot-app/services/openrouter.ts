// services/openrouter.ts
import axios from 'axios';
import { PRODUCTS, STORES, PRICES, PROMOTIONS } from './supermarket-data';
import { CartItem } from '../context/cart-context';

const OPENROUTER_API_KEY = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const fetchBotResponse = async (
  chatHistory: ChatMessage[],
  userCards: string[],
  currentDay: string,
  currentCart: CartItem[]
): Promise<string> => {
  try {
    if (!OPENROUTER_API_KEY) {
      console.warn('⚠️ Missing OpenRouter API Key in environment!');
      return 'Che, disculpame, pero parece que no configuraste la clave de API de OpenRouter en el archivo .env. ¡Cargala así puedo ayudarte a ahorrar!';
    }

    const cartSummary = currentCart.length > 0 
      ? currentCart.map(item => `${item.quantity}x ${item.name.split(' ')[0]} (id: ${item.productId})`).join(', ')
      : 'Vacío';

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
- Ubicación: Bahía Blanca, Provincia de Buenos Aires, Argentina
- Día de la semana hoy: ${currentDay}
- Tarjetas/Promociones activas del usuario: ${userCards.length > 0 ? userCards.join(', ') : 'Ninguna tarjeta seleccionada'}
- CARRITO DE COMPRAS ACTUAL: ${cartSummary}
`;

    const systemPrompt = `
Eres "AhorraBot", el mejor asistente de compras y ahorro familiar de Bahía Blanca y toda Argentina. Ayudas a los usuarios a armar su carrito de compras y calculas dónde les conviene comprar el CARRITO COMPLETO en base a ofertas, promociones bancarias, tarjetas y días de la semana.

INSTRUCCIONES DE COMPORTAMIENTO:
1. **Personalidad**: Habla con modismos bahienses y argentinos, de forma muy cálida, amigable y empática ("che", "La Coope", "gatillar", etc.).
2. **Control del Carrito**: Puedes agregar o quitar elementos del carrito del usuario. Cuando el usuario te pida agregar/sacar cosas, responde amigablemente confirmando la acción, y al FINAL de tu respuesta, en líneas nuevas aisladas, escribe los siguientes comandos de forma exacta para que la app actualice el estado:
   - Para agregar un producto: \`[ADD_TO_CART: productId]\` (IDs válidos: 'fideos', 'arroz', 'desodorante', 'yerba', 'aceite', 'leche', 'azucar', 'harina', 'manteca', 'yogur', 'champu', 'dental', 'detergente', 'lavandina', 'jabon_ropa', 'agua'). Si piden 2 unidades, ponés el comando dos veces.
   - Para remover un producto: \`[REMOVE_FROM_CART: productId]\` (IDs válidos: mismos que para agregar)
   - Para vaciar el carrito: \`[CLEAR_CART]\`
   - Ejemplo de respuesta si te dicen "agregame fideos y yerba":
     "Dale loco, ya te cargué los fideos y la yerba al carrito. Podés ver el total acumulado en la pestaña del Mapa."
     [ADD_TO_CART: fideos]
     [ADD_TO_CART: yerba]
3. **Cálculos Matemáticos**: Si te piden calcular el precio del carrito actual, realizá la comparación sumando todos los productos para cada supermercado (La Coope, Carrefour, Día, Vea) aplicando los descuentos de las tarjetas del usuario para el día actual (${currentDay}). Indicale cuál es el total final de la compra en cada local y recomendale ir al de menor precio.
4. **Respuestas cortas y claras**: Respondé usando formato markdown.
5. **Productos No Encontrados / Fuera de Catálogo**: Si el usuario te pregunta por algún artículo, marca o rubro que no encontrás en tu historial de precios o catálogo local (por ejemplo, si te consultan por pañales, gaseosas, marcas específicas o cualquier otra cosa que no esté en la lista de IDs válidos), indicales con buena onda que no tenés ese precio cargado en la base de datos de AhorraBot. Inmediatamente derivalos/sugeriles buscar en apps de delivery o tiendas online oficiales usando los siguientes enlaces markdown exactos para que puedan hacer la compra:
   - [PedidosYa](https://www.pedidosya.com.ar/)
   - [Rappi](https://www.rappi.com.ar/)
   - [La Coope en Casa](https://www.lacoopeencasa.coop/)
   - [Carrefour Market](https://www.carrefour.com.ar/)
   - [Vea Digital](https://www.vea.com.ar/)
   - [MasOnline (ChangoMás)](https://www.masonline.com.ar/)
   Sé proactivo y deciles "Che, ese producto no lo tengo en mi lista de ahorro diario, pero podés pedirlo al toque o buscarlo en..." e incluí los links.


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
    return 'Che, se me complicó conectar con mi servidor. ¡Reintentá en un ratito!';
  }
};
