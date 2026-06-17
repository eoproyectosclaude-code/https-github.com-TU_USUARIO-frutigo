# 🔑 Configurar imágenes reales de Google (Custom Search)

El buscador de imágenes del portal de proveedor usa la **Google Custom Search JSON API**.
Necesitas dos valores: `GOOGLE_CSE_API_KEY` y `GOOGLE_CSE_CX`.

## 1. API Key (Custom Search API)

1. Entra a <https://console.cloud.google.com/> y crea (o elige) un proyecto.
2. Habilita la API: <https://console.cloud.google.com/apis/library/customsearch.googleapis.com> → **Habilitar**.
3. Ve a **APIs y servicios → Credenciales → Crear credenciales → Clave de API**.
4. Copia la clave → ese es tu **`GOOGLE_CSE_API_KEY`**.
   - Recomendado: restringe la clave a la "Custom Search API".

## 2. Motor de búsqueda (CX)

1. Entra a <https://programmablesearchengine.google.com/> → **Añadir**.
2. En "Qué buscar" elige **Buscar en toda la web**.
3. Crea el motor y ábrelo → **Conceptos básicos**:
   - Activa **Búsqueda de imágenes** (Image search) = ON.
   - Activa **Buscar en toda la web** = ON.
4. Copia el **ID del motor de búsqueda** → ese es tu **`GOOGLE_CSE_CX`**.

## 3. Guardar en el proyecto

Forma fácil (recomendada): ejecuta el script y elige la **opción 4**.

```
scripts\frutigo.bat        (Windows)
bash scripts/frutigo.sh    (macOS/Linux)
```

O manualmente en `apps/api/.env`:

```
GOOGLE_CSE_API_KEY="tu_api_key"
GOOGLE_CSE_CX="tu_cx"
```

Reinicia la API (`npm run start:dev` en `apps/api`). Sin estas claves, el buscador
sigue funcionando con imágenes de demostración (Unsplash).

> Cuota gratuita: 100 búsquedas/día. Para más volumen, habilita facturación en el
> proyecto de Google Cloud.

---

## Crear un usuario ADMIN

El panel de administración requiere rol `ADMIN`. Para promover una cuenta ya registrada:

- Script: **opción 5** del menú, o
- Manual: `cd apps/api && npm run make-admin -- correo@dominio.com`
