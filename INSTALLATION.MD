# Installation

Ce document explique comment installer et lancer l’API **Promocode Service** en local ou via Docker / Docker Compose.

---

## 🔧 Prérequis

- **Node.js** ≥ 22.x
- **npm** (installé avec Node.js)
- **PostgreSQL** (instance locale, distante ou via docker)
- **Docker & Docker Compose** _(optionnel pour containerisation)_

---

## 🏡 Installation locale

1. **Cloner le dépôt**

    ```bash
    git clone <repository-url>
    cd <repository-directory>
    ```

2. **Copier & configurer les variables d’environnement**

    ```bash
    cp .env.example .env
    ```

    Puis éditez `.env` et renseignez vos paramètres :

    ```dotenv
        # Development Environment Configuration Template
        # Copy this file to .env.development and fill in the actual values

        # Server Configuration
        NODE_ENV=development
        PORT=3000
        HOST=0.0.0.0
        LOG_LEVEL=info

        # Security - REQUIRED
        # Generate a strong API key (minimum 16 characters, recommended 32+)
        # Example: openssl rand -hex 32
        API_KEY=6fdb0b593edeba06ed02175246a6042966bde13330d800bc1d994530fbdbe89d

        # Database Configuration (PostgreSQL)
        DATABASE_HOST=postgres
        DATABASE_PORT=5432
        DATABASE_USER=promocode_user
        DATABASE_PASSWORD=promocode_password
        DATABASE_NAME=promocode_db

        # Either provide DATABASE_URL or individual components
        DATABASE_URL=postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}

        # External APIs (OpenWeatherMap)
        OPENWEATHERMAP_API_KEY=your-openweather-api-key-here
        OPENWEATHERMAP_API_URL=https://api.openweathermap.org/data/2.5

        # CORS Configuration (optional)
        ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

        # Weather Service Configuration
        # Set to 'false' for production to use real OpenWeatherMap API
        USE_MOCK_WEATHER=true
    ```

3. **Installer les dépendances**

    ```bash
    npm install
    ```

4. **Initialiser la base (Prisma)**

    - Appliquer les migrations :

        ```bash
        npx prisma migrate dev --name init
        ```

    - Générer le client Prisma :

        ```bash
        npx prisma generate
        ```

5. **Transpilation de l’application (TypeScript → JavaScript)**

    ```bash
    npm run build
    ```

6. **Démarrer l’API**

    ```bash
    npm start
    ```

    > Le serveur écoute par défaut sur `http://localhost:3000`.
    > Pour la doc Swagger : `http://localhost:3000/documentation`

7. **Mode développement**
   Pour relancer automatiquement à chaque changement de code :

    ```bash
    npm run dev
    ```

8. **Tests unitaires (Jest)**
   Pour lancer la suite de tests :
    ```bash
    npm test
    ```

---

## 🐳 Lancer avec Docker / Docker Compose

Deux fichiers `docker-compose.yml` et `docker-compose.db.yml` sont fournis :

- **`docker-compose.db.yml`** : démarre la base PostgreSQL
- **`docker-compose.yml`** : démarre uniquement l’API (utile si vous avez déjà PostgreSQL)

### 1. Créer `.env` pour Docker

Copiez les mêmes variables `.env` que pour l’installation locale. Docker Compose les injectera automatiquement.

### 2. Démarrage (Si vous n'avez pas déjà de base de données PostgreSQL existante)

```bash
docker-compose -f docker-compose.db.yml --env-file ./.env up -d
```

Cela lancera :

- **postgres** (port 5432)
- **migrate** (prisma migration)
- **adminer** (port 8080)

Une fois les services up, vous pouvez en suite utiliser la commande de l'étape 3

### 3. Démarrage en mode « standalone » (si PostgreSQL existe déjà ou après avoir lancer)

```bash
docker-compose --env-file ./.env up -d
```

Cela lancera :

- **app** (port 3000)

---

## ✅ Vérification

- **Ping santé**

    ```bash
    curl http://localhost:3000/ping
    ```

    → doit renvoyer `{ "status": "ok", "timestamp": "…" }`

- **Swagger / OpenAPI**
  Ouvrez :

    ```
    http://localhost:3000/documentation
    ```

- **Endpoints Promocode**

    - `POST /api/promocodes`
    - `POST /api/promocodes/validate`
    - etc.

---

## 📘 Ressources

- **Doc Prisma** : [https://www.prisma.io/docs](https://www.prisma.io/docs)
- **Swagger UI** intégré : `/documentation`
- **README.md** pour plus de détails sur l’architecture

---
