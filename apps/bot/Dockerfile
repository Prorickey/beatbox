FROM oven/bun:1.3.6-alpine AS build
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY apps/bot/package.json apps/bot/
COPY apps/dashboard/package.json apps/dashboard/
COPY packages/database/package.json packages/database/
COPY packages/shared/package.json packages/shared/

RUN bun install --frozen-lockfile

COPY packages/database packages/database
COPY packages/shared packages/shared
COPY apps/bot apps/bot

RUN bun run db:generate
RUN cd apps/bot && bun run build

FROM oven/bun:1.3.6-alpine
WORKDIR /app

COPY --from=build /app/apps/bot/dist ./dist
COPY --from=build /app/packages/database/src/generated/prisma ./packages/database/src/generated/prisma

CMD ["bun", "dist/index.js"]
