# Promos Super

Sitio que muestra **qué promociones hay en los supermercados argentinos**: descuentos bancarios,
reintegros, cuotas sin interés y ofertas de producto (2x1, 3x2, segunda unidad) de Carrefour, Coto,
Día, Chango Más, Jumbo, Disco y Vea. No muestra precios de productos.

La diferencia con las notas de los diarios es que acá los datos están **estructurados**: se pueden
filtrar por día, cadena, banco o billetera, y el sitio calcula **cuánto ahorrás realmente** para el
monto que pensás gastar, contemplando topes de reintegro y compras mínimas.

## Qué hay adentro

| Ruta | Qué muestra |
|---|---|
| `/` | Buscador con las promos del día actual, ordenadas por ahorro real |
| `/calendario/` | Grilla cadena × día de la semana |
| `/dia/[lunes…domingo]/` | Todas las promos de un día |
| `/supermercados/[cadena]/` | Promos de una cadena + link a su página oficial y su folleto |
| `/bancos/[emisor]/` | Promos de un banco o billetera en todas las cadenas |
| `/metodologia/` | De dónde salen los datos y cómo se calcula el ahorro |

## Stack

Next.js 15 (App Router) con **export estático**: el build produce HTML en `out/`, que se puede
publicar en Vercel, Netlify, GitHub Pages o cualquier CDN. No hay backend ni base de datos.

- TypeScript estricto, Tailwind v4
- El dataset es JSON versionado en `data/`, validado con Zod en tiempo de build
- Tests de la lógica de ahorro con Vitest

```bash
npm install
npm run dev        # desarrollo en http://localhost:3000
npm run validar    # valida el dataset (schema + integridad referencial)
npm test           # tests de la lógica de ahorro
npm run build      # valida, buildea y exporta a out/
```

Para publicar en GitHub Pages bajo `/<repo>`, seteá `NEXT_PUBLIC_BASE_PATH=/<repo>` antes del build.

## El dataset

Tres archivos en `data/`, con el schema definido en [`src/lib/tipos.ts`](src/lib/tipos.ts):

- `supermercados.json` — cadenas, con su página oficial de descuentos y su folleto semanal
- `emisores.json` — bancos, billeteras y programas (ANSES, Club Día, Mi Carrefour)
- `promociones.json` — las promos

Una promoción se ve así:

```json
{
  "id": "bna-changomas-miercoles",
  "supermercado": "changomas",
  "emisor": "banco-nacion",
  "beneficio": { "tipo": "descuento", "porcentaje": 35 },
  "dias": ["miercoles"],
  "mediosDePago": ["QR MODO", "tarjeta de crédito", "tarjeta de débito"],
  "tope": { "monto": 15000, "periodo": "semanal" },
  "canales": ["sucursal"],
  "segmento": "general",
  "vigencia": { "desde": "2026-09-01", "hasta": "2026-09-30" },
  "requisitos": ["Asociar la tarjeta del banco a la billetera MODO"],
  "fuente": {
    "url": "https://…",
    "medio": "Infozona",
    "tipo": "prensa",
    "verificadoEl": "2026-09-06"
  },
  "confianza": "alta"
}
```

Tipos de beneficio soportados: `descuento`, `reintegro`, `cuotas`, `2x1`, `3x2`, `segunda-unidad`.

### Por qué la carga es curada y no automática

Las seis cadenas publican sus promociones bancarias como **imágenes cargadas por JavaScript**
(Carrefour las sirve desde una app propia de VTEX, `valtech.carrefourar-bank-promotions`; Cencosud
y Día hacen lo mismo). No existe un endpoint público con datos estructurados, así que un scraper
necesitaría navegador headless **y OCR** por cadena, y se rompería cada vez que alguna cambie el
diseño de su banner.

Por eso el dataset es curado y versionado: cada promo declara su fuente, su fecha de verificación y
un nivel de confianza (`alta` / `media` / `baja`), y la interfaz lo muestra. Es más honesto que
publicar datos que parecen automáticos pero están desactualizados.

### Rutina semanal de actualización

1. Revisar la página de descuentos de cada cadena (los links están en `data/supermercados.json`).
2. Actualizar `data/promociones.json`: subir `fuente.verificadoEl` en lo que siga vigente, borrar lo
   que se cayó, agregar lo nuevo.
3. `npm run validar` avisa lo que venció, lo que hace más de 14 días que no se verifica y lo que
   quedó con confianza baja.
4. Commit: el historial de git queda como registro de cómo evolucionaron las promos.

Las ofertas de folleto (2x1, 3x2) rotan cada semana y todavía no están cargadas: el sitio linkea al
folleto oficial de cada cadena hasta que se carguen. El schema ya las soporta.

## Cómo se calcula el ahorro

- **Descuentos y reintegros**: `monto × porcentaje`, recortado por el tope. Se asume que el cupo del
  período está intacto — es el mejor caso, y la interfaz lo aclara.
- **Cuotas sin interés**: no hay descuento nominal, pero sí ahorro financiero. Se calcula el valor
  presente de las cuotas con una tasa mensual configurable desde la interfaz (por defecto 2,5%
  mensual, como costo de oportunidad).
- **2x1, 3x2 y segundas unidades**: dependen del carrito, así que se muestran sin estimación.

Ver [`src/lib/ahorro.ts`](src/lib/ahorro.ts) y sus tests en [`tests/ahorro.test.ts`](tests/ahorro.test.ts).

## Aviso

Sitio independiente, sin relación con las cadenas ni con los bancos mencionados. Las promociones
cambian sin aviso y varían por sucursal, provincia y segmento de cliente. La condición que vale es la
que publica el comercio o el banco al momento de pagar.
