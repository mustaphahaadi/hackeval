# Deployment & Infrastructure Guide

This document provides complete procedures for staging, building, and deploying the Hackathon Platform in local environments, on dedicated application nodes, and via containerized cloud systems like **Google Cloud Run**.

---

## 🛠️ Build and Standalone Executable Pipeline

The application compiles both the client assets and the server modules into highly optimized production distribution folders.

### 1. Build Compilation
Run the production build script:
```bash
npm run build
```
This script executes two decoupled actions behind the scenes:
1.  **Vite Static Compile:** Compiles the client React/Tailwind application into static assets placed in `dist/`.
2.  **esbuild Server Bundle:** Bundles the TypeScript `server.ts` file into a single, high-performance CommonJS file at `dist/server.cjs`, resolving import declarations and external packages cleanly to skip runtime type checking.

### 2. Standalone Start Command
To boot the compiled full-stack server on production nodes:
```bash
npm run start
```
This launches `node dist/server.cjs` binding directly to host `0.0.0.0` and port `3000`.

---

## 📦 Containerization with Docker

This multi-stage Dockerfile ensures an extremely lightweight production image by separating dev-dependencies from the final runtime build.

Create a `Dockerfile` at the project root:

```dockerfile
# Stage 1: Dependency Installation & Compilation Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install package declarations
COPY package*.json ./
RUN npm ci

# Copy full codebase and compile production bundles
COPY . .
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Minimal Runtime Execution
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy necessary production files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

# Install ONLY production dependencies to keep image footprint tiny
RUN npm ci --only=production

EXPOSE 3000

# Execute server
CMD ["node", "dist/server.cjs"]
```

### Building and Testing the Docker Image Locally:
```bash
# Build the image
docker build -t hackathon-platform:latest .

# Run the container
docker run -p 3000:3000 --env GEMINI_API_KEY="your_api_key" hackathon-platform:latest
```

---

## ☁️ Deploying to Google Cloud Run

Google Cloud Run is the recommended hosting platform, providing automatic scaling, TLS encryption, and secure environment secret injection.

### Command Line Deployment Script

1.  **Authenticate GCP SDK:**
    ```bash
    gcloud auth login
    gcloud config set project <YOUR_GCP_PROJECT_ID>
    ```

2.  **Submit Container to Artifact Registry:**
    ```bash
    gcloud builds submit --tag gcr.io/<YOUR_GCP_PROJECT_ID>/hackathon-platform:1.0.0
    ```

3.  **Deploy Container to Cloud Run:**
    ```bash
    gcloud run deploy hackathon-platform \
      --image gcr.io/<YOUR_GCP_PROJECT_ID>/hackathon-platform:1.0.0 \
      --platform managed \
      --region us-central1 \
      --allow-unauthenticated \
      --set-env-vars="NODE_ENV=production,PORT=3000" \
      --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest,JWT_SECRET=JWT_SECRET:latest"
    ```

---

## 🛡️ Production Process Management with PM2

For virtual machines or bare-metal servers, use **PM2** to maintain high availability, execute automatic restarts on system failures, and enable horizontal scaling over CPU cores.

Create a `ecosystem.config.cjs` file at the root:

```javascript
module.exports = {
  apps: [
    {
      name: "hackathon-platform",
      script: "./dist/server.cjs",
      instances: "max", // Scale across all available CPU cores
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
```

### Commands:
```bash
# Start the application cluster
pm2 start ecosystem.config.cjs

# Monitor logs and system resource consumption
pm2 monit
pm2 logs
```

---

## ⚙️ Upgrading Data Persistence to Relational PostgreSQL (Cloud SQL)

To transition from the quick-start JSON file manager to a highly robust PostgreSQL database:

1.  **Install PG Client and Drizzle ORM:**
    ```bash
    npm install pg @types/pg drizzle-orm
    npm install -D drizzle-kit
    ```

2.  **Update Database Connector (`src/db.ts`):**
    Swap out the custom in-memory reader and hook Drizzle/PG to your connection pool:
    ```typescript
    import { drizzle } from 'drizzle-orm/node-postgres';
    import { Pool } from 'pg';

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL, // e.g. postgres://user:pass@host:5432/db
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
    });

    export const db = drizzle(pool);
    ```

3.  **Deploying Schemas:**
    Use Drizzle-Kit migration scripts to deploy database tables directly onto the Cloud SQL instance during deployment pipelines.
