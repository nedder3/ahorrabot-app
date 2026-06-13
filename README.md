# AhorraBot 🤖🛒
> Asistente Inteligente de Ahorro y Comparador de Precios en Supermercados de Bahía Blanca.

AhorraBot es una aplicación multiplataforma desarrollada en **React Native / Expo** diseñada para ayudar a las familias de Bahía Blanca a combatir la inflación mediante la comparación inteligente de precios, la generación automática de listas de compras optimizadas y el cálculo en tiempo real de descuentos y reintegros bancarios (como Cuenta DNI, Coopeplus, etc.).

---

## 🏗️ Arquitectura de la Aplicación

La aplicación se estructura en capas desacopladas que integran servicios de inteligencia artificial (LLMs), bases de datos SQLite persistentes, procesamiento de voz local y servicios de extracción web en tiempo real:

```mermaid
graph TD
  A["Usuario / Interfaz UI"] -->|"Mensajes de Texto / Dictado de Voz"| B("Chatbot Asistente - App")
  B -->|"Consultas OpenRouter API"| C{"Llama 3 8B Instruct"}
  C -->|"Retorna Comandos: ADD_TO_CART, etc."| B
  B -->|"Modifica Estado"| D["Cart Context - Carrito"]
  
  D -->|"Calcula Totales con Reintegros"| E["Comparador de Precios / Mapas"]
  E -->|"Dibuja WebView Leaflet"| F["Sucursales Cercanas Bahía Blanca"]
  
  G["Scraper Python - Local/CLI"] -->|"Semilla: scraped_prices.json"| H["Servicio de Datos"]
  I["API Supermercados Online"] -->|"Sync en background"| H
  H -->|"Lee & Sincroniza"| J["Capa SQLite db.ts / db.web.ts"]
  
  D -->|"Confirmar Compra"| J
  K["Historial de Pedidos"] -->|"Lee Base de Datos"| J
  J -->|"Actualiza Métricas"| A
```

---

## 🌟 Características Principales

### 1. Chatbot Inteligente con Control de Estado 🤖💬
El asistente conversacional interactúa usando modismos locales bahienses ("che", "La Coope", "gatillar"). Al procesar las solicitudes del usuario, es capaz de interpretar intenciones y devolver tags de comandos estructurados:
* `[ADD_TO_CART: productId]`: Carga productos al carrito automáticamente.
* `[REMOVE_FROM_CART: productId]`: Remueve cantidades de la lista.
* `[CLEAR_CART]`: Vacía el carrito del usuario.

### 2. Base de Datos SQLite Híbrida (Nativa & Web) 🗄️💾
Implementación de persistencia local robusta usando `expo-sqlite` para compilaciones nativas Android/iOS y `localStorage` con fallback reactivo para navegadores web:
* Guarda las órdenes de compra generadas (`orders`): tienda seleccionada, productos adquiridos, costo total, ahorros aplicados y fecha.
* Almacena en caché local las listas de productos y precios para garantizar el funcionamiento offline.
* Actualiza en tiempo real el indicador de **"Mi Ahorro Estimado"** en la pantalla principal.

### 3. Comparador Inteligente de Canastas y Tarjetas 💳🗺️
Calcula el costo total del carrito de compras comparando simultáneamente cuatro grandes supermercados en Bahía Blanca:
* **Cooperativa Obrera (La Coope)**
* **Carrefour Market**
* **Vea Supermercados**
* **Hiper ChangoMás**

El algoritmo aplica automáticamente los descuentos vigentes (por ejemplo, *20% de reintegro en La Coope*, *Cuenta DNI los fines de semana*, *Descuentos con Tarjeta Coopeplus*) y te recomienda a qué sucursal dirigirte para realizar la compra más económica.

### 4. Dictado de Voz Inteligente y Háptico 🎙️⚡
Permite agregar productos mediante comandos de voz gracias a la integración de `@dev-amirzubair/react-native-voice` compatible con la Nueva Arquitectura de React Native:
* Gestiona flujos asincrónicos de solicitud de permisos del micrófono en Android e iOS.
* Dispara sutiles respuestas hápticas (`expo-haptics`) al activar/desactivar la escucha.
* Proporciona un modo de simulación y asistencia visual inteligente para emuladores que carecen de hardware de reconocimiento de voz.

### 5. Scraper de Precios Bahía Blanca 🕷️📊
Contiene un script independiente en Python (`scrape_bahia.py`) que:
* Consulta las APIs internas y catálogos online de los supermercados locales bajo geolocalización de Bahía Blanca.
* Genera una base semilla en JSON (`scraped_prices.json`) para pre-cargar la app al iniciar.
* Escribe reportes detallados en texto plano (`productos_bahia_blanca.txt`) con estadísticas y variaciones de costos.


## 🔌 Integraciones de APIs y Servicios Externos

Para resolver el problema del ahorro de manera dinámica y geolocalizada, AhorraBot integra múltiples APIs externas y servicios cloud estructurados:

### 1. Motor de Inteligencia Artificial (OpenRouter API) 🧠🤖
* **Endpoint**: `https://openrouter.ai/api/v1/chat/completions`
* **Modelo**: `meta-llama/llama-3-8b-instruct:free` (u otros modelos configurables).
* **Funcionalidad**: Procesa el lenguaje natural de los usuarios, analiza intenciones de agregar o remover productos, responde usando modismos locales y genera comandos específicos embebidos (`[ADD_TO_CART]`, `[REMOVE_FROM_CART]`) que la app intercepta en tiempo real para actualizar el estado del carrito sin intervención manual.

### 2. APIs de E-Commerce de Supermercados (Sincronización en Background) 🛒⚡
AhorraBot realiza peticiones HTTP directas en segundo plano a las APIs oficiales de comercio electrónico de las cadenas de supermercados para actualizar los precios locales diariamente:
* **La Coope en Casa**: Petición a la API de Cooperativa Obrera (`https://api.lacoopeencasa.coop/api/buscar`) para obtener productos e ID interno, seguido de (`https://api.lacoopeencasa.coop/api/articulo/detalle`) para extraer precios y ofertas específicas por sucursal.
* **Carrefour Argentina**: Consulta al catálogo público VTEX (`https://www.carrefour.com.ar/api/catalog_system/pub/products/search`) buscando las coincidencias de los productos por filtros de stock y precio.
* **Vea Digital**: Consulta al motor VTEX de Cencosud (`https://www.vea.com.ar/api/catalog_system/pub/products/search`) para extraer el listado actualizado.
* **MasOnline (ChangoMás)**: Consulta al catálogo de MasOnline (`https://www.masonline.com.ar/api/catalog_system/pub/products/search`) para verificar ofertas regionales.

### 3. Geolocalización y Mapas (Google Maps, OpenStreetMap & Nominatim) 📍🗺️
* **Expo Location**: Conexión con los servicios nativos de GPS de Android/iOS para obtener latitud y longitud en tiempo real.
* **Nominatim Reverse Geocoding API**: Traduce las coordenadas geográficas obtenidas a direcciones físicas en Bahía Blanca (`https://nominatim.openstreetmap.org/reverse`) para mostrar la calle y barrio del usuario.
* **Leaflet & OpenStreetMap**: Renderiza mapas dinámicos interactivos a través de un WebView aislado de forma segura, dibujando marcadores interactivos en las coordenadas exactas de las sucursales de supermercados mapeadas.

---

## 🛠️ Tecnologías, Librerías y Dependencias

La arquitectura del proyecto está construida sobre tecnologías modernas y librerías clave del ecosistema de desarrollo móvil nativo:

### Core Framework & Ruteo
* **Expo SDK 54 / React Native 0.81**: Base nativa multiplataforma de última generación con soporte para TypeScript de tipado estricto.
* **Expo Router**: Sistema de ruteo basado en archivos que provee layouts y route guarding robusto mediante contextos de autenticación.
* **React Navigation**: Motor de navegación subyacente para pestañas inferiores (`bottom-tabs`) y pantallas apiladas (`stack`).

### Interfaz Gráfica (UI/UX) y Animaciones
* **Styled Components**: Estilado declarativo CSS-in-JS que permite inyectar el tema activo (Modo Claro/Oscuro) en tiempo de ejecución.
* **React Native Reanimated (v4)**: Animaciones de alta performance corriendo directo en el hilo nativo de UI (requiere la Nueva Arquitectura activada).
* **Ionicons (@expo/vector-icons)**: Set de iconos vectoriales consistentes para la interfaz.

### Almacenamiento y Conectividad
* **Expo SQLite**: Driver local de base de datos SQL relacional ultrarrápido para persistencia de pedidos y caché local de precios.
* **AsyncStorage**: Almacenamiento rápido de pares clave-valor en disco local para guardar configuraciones rápidas del usuario y tokens de sesión.
* **Axios**: Cliente HTTP robusto con interceptores para gestionar timeouts y reintentos ante fallas de red con las APIs de supermercados.

### Servicios de Dispositivo
* **@dev-amirzubair/react-native-voice**: Módulo nativo para captura de voz y transcripción (Speech-To-Text) adaptado para compatibilidad con el entorno moderno de Android Gradle.
* **Expo Haptics**: Generación de vibraciones y micro-feedback táctil físico ante interacciones como dictar voz, vaciar el carrito o guardar pedidos.
* **Expo WebView**: Contenedor aislado para renderizar páginas externas de mapas y enlaces web de delivery oficiales.

---

## 📦 Estructura del Código

```bash
ahorrabot-app/
├── app/                      # Expo Router (File-based Routing)
│   ├── (tabs)/               # Pantallas principales de navegación
│   │   ├── index.tsx         # Dashboard / Panel de Control
│   │   ├── chat.tsx          # Chatbot conversacional AhorraBot
│   │   ├── map.tsx           # Comparador de canastas y mapa de sucursales
│   │   ├── orders.tsx        # Historial de Pedidos guardados
│   │   └── profile.tsx       # Perfil del usuario y configuración de tarjetas
│   ├── _layout.tsx           # Layout raíz de la app (Route Guarding)
│   └── login.tsx             # Pantalla de Login / Registro
├── components/               # Componentes UI reutilizables
│   └── voice-mic.tsx         # Botón de dictado por voz y haptics
├── context/                  # Capa de Contexto de Estado
│   ├── auth-context.tsx      # Control de sesión de usuario
│   ├── cart-context.tsx      # Estado del Carrito y cálculo de promociones
│   └── theme-context.tsx     # Soporte para Modo Oscuro y Temas Visuales
├── database/                 # Persistencia e Inicialización SQLite
│   ├── db.ts                 # Implementación para dispositivos nativos (Android/iOS)
│   └── db.web.ts             # Implementación para navegadores web
├── plugins/                  # Plugins de compilación nativa Expo
│   └── withVoice.js          # Configuración de permisos de audio para la compilación
├── services/                 # Integración de APIs externas
│   ├── openrouter.ts         # Conexión y prompts para el chatbot AI
│   ├── supermarket-data.ts   # Sincronización en background de precios online
│   └── scraped_prices.json   # Base de datos semilla de precios
├── scrape_bahia.py           # Scraper independiente escrito en Python
├── app.json                  # Configuración del proyecto Expo
└── eas.json                  # Perfiles de compilación en la nube para generar el APK
```

---

## 🚀 Instalación y Guía de Uso

### Requisitos Previos
* **Node.js** (v18 o superior)
* **Python 3** (para ejecutar el scraper local)

### 1. Clonar el repositorio e instalar dependencias
```bash
git clone https://github.com/nedder3/ahorrabot-app.git
cd ahorrabot-app/ahorrabot-app
npm install
```

### 2. Configurar Variables de Entorno (`.env`)
Creá un archivo `.env` en la raíz del subdirectorio `ahorrabot-app/` e ingresá tu API Key de OpenRouter:
```env
EXPO_PUBLIC_OPENROUTER_API_KEY=tu-api-key-de-openrouter
```

### 3. Iniciar la aplicación en modo desarrollo
* Para iniciar el servidor de desarrollo de Expo:
  ```bash
  npm run start
  ```
* Para abrir la versión web en tu navegador:
  ```bash
  npm run web
  ```

---

## 📲 Compilar y Generar el archivo APK (Android)

Esta aplicación está configurada con **EAS Build** para compilarse automáticamente en la nube y generar un instalable nativo.

1. **Instalar EAS CLI globalmente:**
   ```bash
   npm install -g eas-cli
   ```
2. **Iniciar sesión en tu cuenta de Expo:**
   ```bash
   eas login
   ```
3. **Disparar la compilación del APK:**
   ```bash
   eas build --platform android --profile preview
   ```
   *EAS utilizará las variables de entorno seguras de tu cuenta de Expo y el plugin local `./plugins/withVoice` para generar el instalable APK listo para tu celular.*

---

## 🕷️ Instrucciones del Scraper de Precios (Python)

Si querés actualizar de forma masiva los precios semilla desde tu computadora:
1. Dirigite a la raíz del repositorio.
2. Ejecutá el script:
   ```bash
   python3 scrape_bahia.py
   ```
3. Esto actualizará el archivo `scraped_prices.json` y generará un informe estructurado comparativo en `productos_bahia_blanca.txt`. Al compilar o iniciar la aplicación, estos nuevos precios se sincronizarán directamente en la base de datos SQLite local.
