# Promocode API

A service for validating promotion codes against a dynamic set of business rules, manageable via a REST API.

Built with Node.js, Fastify, and Prisma.

---

## ✨ Features

* **Dynamic Rule Engine** — Validates promocodes with flexible, complex rules using [`json-rules-engine`](https://github.com/CacheControl/json-rules-engine).
* **REST API** — Create, update, and validate promocodes via a fully-documented API.
* **Database** — Uses Prisma as an ORM for PostgreSQL.
* **API Docs** — OpenAPI/Swagger documentation out of the box.
* **Containerized** — Easily deployable with Docker.

---

## 🛠️ Tech Stack

* **Backend:** [Node.js](https://nodejs.org/), [Fastify](https://www.fastify.io/), [TypeScript](https://www.typescriptlang.org/)
* **Database:** [PostgreSQL](https://www.postgresql.org/)
* **ORM:** [Prisma](https://www.prisma.io/)
* **Business Rules:** [json-rules-engine](https://github.com/CacheControl/json-rules-engine)
* **Testing:** [Jest](https://jestjs.io/)
* **Containerization:** [Docker](https://www.docker.com/)

---

## 🚀 Getting Started

### Prerequisites

* [Node.js](https://nodejs.org/en/download/) (v18+)
* [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### Installation

For complete installation instructions, see [INSTALLATION.MD](./INSTALLATION.MD).

A quick Docker-based setup is also available.

---

## 🏃‍♀️ Usage

### Local Development

Run in dev mode with hot reloading:

```bash
npm install
npm run dev
```

By default, the server runs at [http://localhost:3000](http://localhost:3000).

### Production

To build and start in production mode:

```bash
npm install
npm run build
npm start
```

### With Docker

Spin up the application and database with Docker Compose:

```bash
# Ensure you have a .env file (see .env.example)
# For details, check INSTALLATION.MD

docker-compose -f docker-compose.yml -f docker-compose.db.yml up --build
```

The server will be available at [http://localhost:3000](http://localhost:3000).

---

## 🧪 Running Tests

Run the test suite with:

```bash
npm test
```

---

## 📚 API Documentation

API docs are generated with OpenAPI and served automatically.

* **Swagger UI:** [http://localhost:3000/documentation](http://localhost:3000/documentation)
* **OpenAPI spec:** `static/openapi.yaml`

---

## 🗺️ Roadmap

Planned milestones for upcoming features:

* **Milestone 1:** Keycloak authentication, advanced rate limiting, i18n support, dynamic configuration.
* **Milestone 2:** Redis cache for external APIs (e.g., OpenWeatherMap) and a visual UI for editing rules.
* **Milestone 3:** Optimized distroless Docker image for minimal footprint and improved security.

---