#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Scraper de Supermercados para Bahía Blanca, Argentina.
Obtiene precios y disponibilidad de productos en La Coope, Carrefour, Vea y ChangoMás (MasOnline).
"""

import urllib.request
import urllib.parse
import json
import time
import os
from datetime import datetime

# Configuración de consultas por Rubro y mapeo de IDs de la App
PRODUCT_QUERIES = {
    "fideos": "fideos tallarin 500g",
    "arroz": "arroz largo fino 1kg",
    "desodorante": "desodorante antitranspirante 150ml",
    "yerba": "yerba mate con palo 1kg",
    "aceite": "aceite de girasol 1.5l",
    "leche": "leche entera larga vida 1l",
    "azucar": "azucar comun tipo a 1kg",
    "harina": "harina de trigo 000 1kg",
    "manteca": "manteca 200g",
    "yogur": "yogur descremado 900g",
    "champu": "shampoo 350ml",
    "dental": "crema dental 90g",
    "detergente": "detergente lavavajillas 500ml",
    "lavandina": "lavandina 1l",
    "jabon_ropa": "jabon liquido ropa 3l",
    "agua": "agua mineral sin gas 1.5l"
}

RUBROS = {
    "Almacén": ["fideos", "arroz", "yerba", "aceite", "azucar", "harina", "agua"],
    "Lácteos": ["leche", "manteca", "yogur"],
    "Perfumería / Cuidado Personal": ["desodorante", "champu", "dental"],
    "Limpieza": ["detergente", "lavandina", "jabon_ropa"]
}

# Direcciones de sucursales en Bahía Blanca
SUCURSALES = {
    "Cooperativa Obrera (La Coope)": [
        "Sarmiento 2153 (Hiper Shopping)",
        "Paraguay 445 (Universitario)",
        "Roca 34",
        "Vieytes 2139 (San Roque)",
        "Alem 3170",
        "Washington 437 (Villa Mitre)",
        "Avellaneda 826 (Noroeste)",
        "9 de Julio 136 (Almafuerte)",
        "Alsina 645 (Centro)",
        "Av. Colón 1380 (Colón)",
        "Zelarrayán y Rodríguez (Centro)"
    ],
    "Carrefour Market": [
        "Brown 51 (Bahía Blanca)"
    ],
    "Vea Supermercados": [
        "Eliseo Casanova 472",
        "Capitán Martínez 1356"
    ],
    "Hiper ChangoMás": [
        "Av. Sarmiento 4114 (Bahía Blanca)"
    ]
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8'
}

def make_request(url):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            return response.read()
    except Exception as e:
        print(f"Error al solicitar {url}: {e}")
        return None

def fetch_coope(productId, query):
    print(f"  [La Coope] Buscando: {query}")
    encoded_query = urllib.parse.quote(query)
    search_url = f"https://api.lacoopeencasa.coop/api/buscar?q={encoded_query}"
    
    raw_data = make_request(search_url)
    if not raw_data:
        return []
        
    try:
        data = json.loads(raw_data.decode('utf-8'))
        products = data.get('datos', {}).get('producto', [])
        results = []
        
        # Obtenemos detalles para los primeros 3 productos (para tener precios)
        for prod in products[:3]:
            cod_interno = prod.get('cod_interno')
            if not cod_interno:
                continue
                
            detail_url = f"https://api.lacoopeencasa.coop/api/articulo/detalle?cod_interno={cod_interno}"
            detail_raw = make_request(detail_url)
            if detail_raw:
                detail_data = json.loads(detail_raw.decode('utf-8'))
                prod_detail = detail_data.get('datos', {})
                
                # Extraer precio
                price_str = prod_detail.get('precio', '0.00')
                try:
                    price = float(price_str)
                except ValueError:
                    price = 0.0
                    
                results.append({
                    "productId": productId,
                    "storeId": "coope",
                    "supermarket": "La Coope",
                    "name": prod_detail.get('descripcion', prod.get('descripcion')),
                    "brand": prod_detail.get('marca_desc', prod.get('marca_desc', 'S/D')),
                    "price": price,
                    "available": prod_detail.get('disponibilidad', 'true') == 'true',
                    "link": f"https://www.lacoopeencasa.coop/productos/detalle/{cod_interno}"
                })
            time.sleep(0.3)
        return results
    except Exception as e:
        print(f"Error procesando datos de La Coope: {e}")
        return []

def fetch_vtex(productId, storeId, store_name, base_domain, query):
    print(f"  [{store_name}] Buscando: {query}")
    encoded_query = urllib.parse.quote(query)
    url = f"https://{base_domain}/api/catalog_system/pub/products/search?ft={encoded_query}"
    
    raw_data = make_request(url)
    if not raw_data:
        return []
        
    try:
        data = json.loads(raw_data.decode('utf-8'))
        results = []
        
        # Procesar los primeros 3 productos
        for item in data[:3]:
            try:
                sku = item.get('items', [{}])[0]
                seller = sku.get('sellers', [{}])[0]
                comm = seller.get('commertialOffer', {})
                price = comm.get('Price', 0.0)
                
                if price == 0.0:
                    price = comm.get('ListPrice', 0.0)
                    
                results.append({
                    "productId": productId,
                    "storeId": storeId,
                    "supermarket": store_name,
                    "name": item.get('productName'),
                    "brand": item.get('brand', 'S/D'),
                    "price": float(price),
                    "available": comm.get('AvailableQuantity', 0) > 0,
                    "link": item.get('link', f"https://{base_domain}")
                })
            except Exception as item_err:
                print(f"Error al procesar item de {store_name}: {item_err}")
                continue
        return results
    except Exception as e:
        print(f"Error procesando datos de {store_name}: {e}")
        return []

def main():
    print(f"=== INICIANDO SCRAPER DE SUPERMERCADOS (BAHÍA BLANCA) ===")
    start_time = datetime.now()
    print(f"Fecha y hora de inicio: {start_time.strftime('%d/%m/%Y %H:%M:%S')}")
    
    report = []
    json_prices = []
    
    for rubro, prod_ids in RUBROS.items():
        print(f"\n--- Procesando Rubro: {rubro} ---")
        rubro_results = []
        
        for pid in prod_ids:
            q = PRODUCT_QUERIES[pid]
            print(f"\nConsultando query: '{q}' (id: {pid})")
            
            coope_res = fetch_coope(pid, q)
            time.sleep(0.5)
            
            carrefour_res = fetch_vtex(pid, "carrefour", "Carrefour Market", "www.carrefour.com.ar", q)
            time.sleep(0.5)
            
            vea_res = fetch_vtex(pid, "vea", "Vea", "www.vea.com.ar", q)
            time.sleep(0.5)
            
            chango_res = fetch_vtex(pid, "dia", "ChangoMás", "www.masonline.com.ar", q)
            time.sleep(0.5)
            
            query_products = coope_res + carrefour_res + vea_res + chango_res
            
            # Ordenar por precio para este producto
            query_products = sorted(query_products, key=lambda x: x['price'] if x['price'] > 0 else float('inf'))
            
            rubro_results.append({
                "query": q,
                "products": query_products
            })
            
            # Recolectar el precio más barato por supermercado para guardar en el JSON
            stores_found = set()
            for p in query_products:
                if p['price'] > 0 and p['storeId'] not in stores_found:
                    json_prices.append({
                        "productId": p['productId'],
                        "storeId": p['storeId'],
                        "price": int(p['price'])
                    })
                    stores_found.add(p['storeId'])
            
        report.append({
            "rubro": rubro,
            "queries": rubro_results
        })
        
    # Generar el archivo TXT
    end_time = datetime.now()
    duration = end_time - start_time
    txt_filename = "productos_bahia_blanca.txt"
    
    print(f"\n=== GENERANDO ARCHIVO REPORT: {txt_filename} ===")
    
    with open(txt_filename, "w", encoding="utf-8") as f:
        f.write("=========================================================================\n")
        f.write("     REPORTE DE PRECIOS Y PRODUCTOS EN SUPERMERCADOS DE BAHÍA BLANCA     \n")
        f.write("=========================================================================\n")
        f.write(f"Fecha de Extracción: {end_time.strftime('%d/%m/%Y %H:%M:%S')}\n")
        f.write(f"Tiempo de ejecución: {duration.total_seconds():.2f} segundos\n")
        f.write("Localidad: Bahía Blanca, Provincia de Buenos Aires, Argentina\n")
        f.write("Supermercados Monitoreados:\n")
        f.write("  - Cooperativa Obrera (La Coope)\n")
        f.write("  - Carrefour Market\n")
        f.write("  - Vea Supermercados\n")
        f.write("  - Hiper ChangoMás\n")
        f.write("=========================================================================\n\n")
        
        # Sección de Sucursales
        f.write("-------------------------------------------------------------------------\n")
        f.write("SUCURSALES DE REFERENCIA EN BAHÍA BLANCA\n")
        f.write("-------------------------------------------------------------------------\n")
        for store, addresses in SUCURSALES.items():
            f.write(f"\n* {store}:\n")
            for addr in addresses:
                f.write(f"  - {addr}\n")
        f.write("\n=========================================================================\n\n")
        
        # Resultados por Rubro
        for rubro_data in report:
            f.write(f"#########################################################################\n")
            f.write(f" RUBRO: {rubro_data['rubro'].upper()}\n")
            f.write(f"#########################################################################\n\n")
            
            for query_data in rubro_data["queries"]:
                f.write(f"-------------------------------------------------------------------------\n")
                f.write(f" Búsqueda: '{query_data['query'].capitalize()}'\n")
                f.write(f"-------------------------------------------------------------------------\n")
                
                products = query_data["products"]
                if not products:
                    f.write("No se encontraron productos disponibles para este término de búsqueda.\n\n")
                    continue
                    
                # Encabezado de la tabla
                f.write(f"{'Supermercado':<18} | {'Precio':<10} | {'Disponibilidad':<10} | {'Marca':<15} | {'Nombre del Producto':<60}\n")
                f.write("-" * 123 + "\n")
                
                for p in products:
                    price_display = f"${p['price']:,.2f}" if p['price'] > 0 else "S/D"
                    avail_display = "Disponible" if p['available'] else "Sin Stock"
                    
                    name_cut = p['name'][:58] + "..." if len(p['name']) > 60 else p['name']
                    brand_cut = p['brand'][:13] + "..." if len(p['brand']) > 15 else p['brand']
                    
                    f.write(f"{p['supermarket']:<18} | {price_display:<10} | {avail_display:<10} | {brand_cut:<15} | {name_cut:<60}\n")
                
                # Detalle con links
                f.write("\nEnlaces a los productos:\n")
                for p in products:
                    price_display = f"${p['price']:,.2f}" if p['price'] > 0 else "S/D"
                    f.write(f"  * [{p['supermarket']}] {p['name']} ({price_display}):\n")
                    f.write(f"    {p['link']}\n")
                f.write("\n\n")
                
    # Escribir el JSON de precios para alimentar la App móvil
    json_path = "ahorrabot-app/services/scraped_prices.json"
    print(f"=== GENERANDO JSON DE PRECIOS PARA LA APP: {json_path} ===")
    try:
        # Asegurarse de que exista el directorio
        os.makedirs(os.path.dirname(json_path), exist_ok=True)
        with open(json_path, "w", encoding="utf-8") as jf:
            json.dump(json_prices, jf, indent=2, ensure_ascii=False)
        print("JSON generado con éxito.")
    except Exception as e:
        print(f"Error escribiendo el JSON para la app: {e}")
        
    print(f"Reporte generado exitosamente en: {txt_filename}")

if __name__ == "__main__":
    main()
