---

# Installation

This guide explains how to install and run the **Promocode Service** API locally or using Docker / Docker Compose.

---

## 🔧 Prerequisites

* **Node.js** ≥ 22.x
* **npm** (comes with Node.js)
* **PostgreSQL** (local, remote, or via Docker)
* **Docker & Docker Compose** *(optional, for containerization)*

---

## 🏡 Local Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Copy & configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and fill in your settings:

   ```dotenv
   # Development Environment Configuration Template

   # Server
   NODE_ENV=development
   PORT=3000
   HOST=0.0.0.0
   LOG_LEVEL=info

   # Security - REQUIRED
   # Generate a strong API key (min 16 chars, recommended 32+)
   # Example: openssl rand -hex 32
   API_KEY=6fdb0b593edeba06ed02175246a6042966bde13330d800bc1d994530fbdbe89d

   # Database (PostgreSQL)
   DATABASE_HOST=postgres
   DATABASE_PORT=5432
   DATABASE_USER=promocode_user
   DATABASE_PASSWORD=promocode_password
   DATABASE_NAME=promocode_db

   # Alternatively, provide DATABASE_URL instead of individual parts
   DATABASE_URL=postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}

   # External APIs (OpenWeatherMap)
   OPENWEATHERMAP_API_KEY=your-openweather-api-key-here
   OPENWEATHERMAP_API_URL=https://api.openweathermap.org/data/2.5

   # CORS (optional)
   ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

   # Weather Service
   # Use 'false' in production to call the real OpenWeatherMap API
   USE_MOCK_WEATHER=true
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Initialize the database (Prisma)**

   * Apply migrations:

     ```bash
     npx prisma migrate dev --name init
     ```

   * Generate the Prisma client:

     ```bash
     npx prisma generate
     ```

5. **Build the app (TypeScript → JavaScript)**

   ```bash
   npm run build
   ```

6. **Start the API**

   ```bash
   npm start
   ```

   > By default, the server runs at `http://localhost:3000`
   > Swagger docs: `http://localhost:3000/documentation`

7. **Development mode**

   For automatic reload on code changes:

   ```bash
   npm run dev
   ```

8. **Run tests (Jest)**

   To run the unit tests:

   ```bash
   npm test
   ```

---

## 🐳 Running with Docker / Docker Compose

Two `docker-compose` files are provided:

* **`docker-compose.db.yml`** — starts a PostgreSQL database
* **`docker-compose.yml`** — starts the API only (useful if you already have PostgreSQL running)

### 1️⃣ Create `.env` for Docker

Copy the same `.env` used for local installation. Docker Compose will automatically inject it.

### 2️⃣ Start services (if you don’t have an existing PostgreSQL)

```bash
docker compose -f docker-compose.db.yml up -d
```

This will start:

* **postgres** (port 5432)
* **migrate** (runs Prisma migration)
* **adminer** (database UI at port 8080)

Once everything is up, continue with step 3.

### 3️⃣ Start the API (standalone)

Use this if PostgreSQL is already running, or after starting it in step 2:

```bash
docker compose up -d
```

This will start:

* **app** (port 3000)

---

## ✅ Verification

* **Health check**

  ```bash
  curl http://localhost:3000/ping
  ```

  → Should return `{ "status": "ok", "timestamp": "…" }`

* **Swagger / OpenAPI**

  Open in your browser:

  ```
  http://localhost:3000/documentation
  ```

* **Promocode endpoints**

  * `POST /api/promocodes`
  * `POST /api/promocodes/validate`
  * and more.

---

## 📘 Resources

* **Prisma Docs:** [https://www.prisma.io/docs](https://www.prisma.io/docs)
* **Built-in Swagger UI:** `/documentation`
* **README.md:** for more about the architecture

---