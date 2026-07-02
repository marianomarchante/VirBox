# Stage 1: Build the application
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json* ./

# Install all dependencies (including devDependencies required for build)
RUN npm install

# Copy the rest of the application
COPY . .

# Build the frontend and backend
RUN npm run build

# Stage 2: Create the production image
FROM node:22-alpine AS runner

WORKDIR /app

# Set node environment to production
ENV NODE_ENV=production

# Copy package files for production dependencies installation
COPY package.json package-lock.json* ./

# Install dependencies (including devDependencies for migrations)
RUN npm install

# Copy the built artifacts from the builder stage
COPY --from=builder /app/dist ./dist

# Copy migrations and drizzle config if needed (for drizzle-kit push)
# We copy shared and server to make sure schema is available if needed by migrations
COPY --from=builder /app/shared ./shared
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts

# Expose the application port
EXPOSE 5000

# Start the application
CMD ["npm", "start"]
