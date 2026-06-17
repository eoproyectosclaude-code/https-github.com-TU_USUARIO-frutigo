# --- Build stage ---
FROM node:20-slim AS build
WORKDIR /repo

# Necesario para Prisma en Debian slim.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Instala dependencias del monorepo (cachea por manifiestos).
COPY package.json package-lock.json* ./
COPY packages/shared/package.json packages/shared/
COPY packages/ui/package.json packages/ui/
COPY apps/api/package.json apps/api/
RUN npm install

# Copia el código y compila.
COPY . .
RUN npm run prisma:generate --workspace=@frutigo/api \
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

WORKDIR /app/apps/api
EXPOSE 3000
# Aplica migraciones y arranca.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
