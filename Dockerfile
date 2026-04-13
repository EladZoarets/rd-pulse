FROM node:20-alpine

WORKDIR /app

# Copy monorepo root manifests
COPY package.json package-lock.json ./

# Copy workspace packages needed for install
COPY packages/ ./packages/

# Copy backend source
COPY apps/backend/ ./apps/backend/

# Install all workspace dependencies from root
RUN npm install

# Build the backend
RUN cd apps/backend && npm run build

WORKDIR /app/apps/backend

EXPOSE 3001

CMD ["node", "dist/index.js"]
