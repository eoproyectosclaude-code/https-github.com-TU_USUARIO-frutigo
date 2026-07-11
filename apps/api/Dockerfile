# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /repo

# Necesario para Prisma en Debian slim.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Instala dependencias del monorepo (cachea por manifiestos).
# La instalación ocurre antes de copiar el código: el script `prepare` del
# paquete compartido detecta la ausencia de `src/` y se salta la compilación.
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/
RUN npm install

# Copia el código y compila (primero el paquete compartido, luego el API).
COPY . .
RUN npm run build --workspace=@frutigo/shared \
  && npm run prisma:generate --workspace=@frutigo/api \
  && npm run build --workspace=@frutigo/api

# --- Runtime stage ---
FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copia node_modules y artefactos necesarios.
COPY --from=build /repo/node_modules ./node_modules
COPY --from=build /repo/packages ./packages
COPY --from=build /repo/apps/api/dist ./apps/api/dist
COPY --from=build /repo/apps/api/package.json ./apps/api/package.json
COPY --from=build /repo/apps/api/prisma ./apps/api/prisma

# Seguridad: ejecuta como usuario sin privilegios (el usuario `node` ya existe en la imagen).
RUN chown -R node:node /app
USER node

WORKDIR /app/apps/api
EXPOSE 3000

# Chequeo de salud del contenedor contra el endpoint de readiness.
HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=5 \
  CMD node -e "fetch('http://localhost:3000/health/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Aplica migraciones y arranca.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
