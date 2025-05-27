# Promocode API

## 📊 Synthèse du projet « Promocode API »

### ⏱️ Temps investi

- **≈ 8 heures** de développement.

### 🛠️ Outils et méthodologie

- **Cursor** pour accélérer le dev (savoir maitriser l'IA est important en tant que dev).
- **IA (ChatGPT)** pour générer du code, avec un regard plus ciblé et critique pour étailler les propositions.

> Pour l’installation, merci de vous référer au fichier [INSTALLATION.MD](./INSTALLATION.MD).

---

## 🚀 Améliorations proposées

1. **Protection brute-force (Lot 1)**

    - Intégrer **fail2ban** en production pour bloquer les `404` sur `/promocodes/validate`.
    - Seuil suggéré : \~ 10 tentatives/s avant bannissement.

2. **Gestion des tokens (Lot 1)**

    - Ajouter **Keycloak** pour l’authentification OAuth2/JWT.
    - À planifier comme premier incrément formel (Lot 1).

3. **Internationalisation & ressources (Lot 1)**

    - Mettre en place un système i18n clé/valeur pour les messages.
    - Le frontend résout dynamiquement selon la langue de l’utilisateur.

4. **Configuration dynamique (Lot 1)**

    - Exposer davantage de variables d’environnement (timeouts, seuils, URLs…) pour que les **SRE/DevOps** ajustent sans redeploy.

5. **Rate-limiting application-side (Lot 1)**

    - Utiliser **@fastify/rate-limit** par utilisateur ou clé API.
    - Conserver **Nginx** + **fail2ban** pour rafales ou attaques réseau.

6. **Cache Redis pour OpenWeatherMap (Lot 1-2)**

    - Remplacer le cache en mémoire par **Redis** pour persistance et partage inter-instances.

7. **UI pour json-rules-engine (Lot 2)**

    - Intégrer l’éditeur visuel de règles métier : [json-rule-editor](https://github.com/vinzdeveloper/json-rule-editor).

8. **Erreurs plus claires (Lot 1)**

    - Normaliser le format de réponse en cas de refus :

        ```json
        {
            "promocode_name": "TEST666",
            "status": "denied",
            "reasons": [
                "Condition for 'age' was not met: expected 25 to be equal 666",
                "Condition for 'weather' was not met: expected undefined to be equal \"clear\" (on path: $.is)",
                "Condition for 'weather' was not met: expected undefined to be greaterThan 15 (on path: $.temp)"
            ]
        }
        ```

---

## 📅 Roadmap suggérée

| Lot   | Contenu principal                                                    |
| ----- | -------------------------------------------------------------------- |
| **0** | Base fonctionnelle de l’API (code actuel)                            |
| **1** | Auth (Keycloak), rate-limit, fail2ban, i18n, config dynamique        |
| **2** | Cache Redis, éditeur UI pour règles                                  |
| **3** | Image Docker distroless pour une empreinte réduite et plus sécurisée |

---
