# Política de Seguridad — FRUTI GO

La seguridad es prioritaria en una plataforma que maneja pagos y datos de clientes,
proveedores y navieras.

## Reporte de vulnerabilidades

Si encuentras una vulnerabilidad, escríbenos a **security@frutigo.pa** con:
detalle técnico, pasos de reproducción e impacto estimado. No la divulgues públicamente
hasta que se haya corregido. Objetivo de primer respuesta: 72 horas.

## Controles implementados

**Autenticación y sesión**
- Contraseñas con bcrypt (12 rounds). Nunca se almacenan ni registran en claro.
- Access token JWT de vida corta (15 min) + refresh token opaco aleatorio.
- Los refresh tokens se guardan solo como **hash SHA-256** y se **rotan** en cada uso.
- En el cliente, los tokens se guardan cifrados con `expo-secure-store` (Keychain / Keystore).
- Logout revoca el refresh token en el servidor.

**Superficie HTTP**
- `helmet` para cabeceras de seguridad.
- Rate limiting global (120 req/min/IP) y estricto en `/auth` (8 req/min) anti fuerza bruta.
- CORS restringido por entorno (`CORS_ORIGINS`).
- Validación estricta de entrada (`whitelist` + `forbidNonWhitelisted`) en todos los DTOs.
- Filtro global de excepciones: respuestas consistentes **sin** filtrar stack traces.

**Pagos (PCI-DSS)**
- El PAN de tarjeta se tokeniza del lado del procesador; el backend nunca lo almacena.
- Firmas de webhook verificadas (Stripe `constructEvent`, HMAC-SHA256 en Yappy/Coinbase/Visa,
  con comparación de tiempo constante).
- El monto a cobrar se toma del pedido en base de datos, nunca del cliente.

**Autorización**
- Control de acceso por rol (`COMPRADOR`, `PROVEEDOR`, `REPARTIDOR`, `ADMIN`) con guards.
- Aislamiento de datos: cada proveedor/repartidor solo accede a sus propios recursos.

**Datos sensibles**
- Secretos en variables de entorno; `.env` y `scripts/.secrets.json` están en `.gitignore`.
- Manifiestos y pedidos no exponen datos de pago.

## Buenas prácticas para el despliegue

- Usa `JWT_SECRET` largo y aleatorio; rota periódicamente.
- Sirve siempre sobre HTTPS/TLS.
- Restringe `CORS_ORIGINS` a los dominios reales de producción.
- Mantén dependencias actualizadas (`npm audit`) y revisa el CI antes de publicar.
