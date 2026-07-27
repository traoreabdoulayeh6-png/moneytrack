# MoneyTrack — Gestion de dépenses personnelles

Application web **Full Stack** de gestion de dépenses personnelles.

- **Frontend** : HTML5, CSS3, JavaScript Vanilla
- **Backend** : Node.js, Express.js (architecture MVC)
- **Base de données** : MongoDB (via Mongoose)
- **Communication** : API REST

---

## Sommaire

- [Fonctionnalités](#fonctionnalités)
- [Structure du projet](#structure-du-projet)
- [Installation](#installation)
- [Configuration (variables d'environnement)](#configuration)
- [Lancement du projet](#lancement-du-projet)
- [Routes de l'API](#routes-de-lapi)
- [Déploiement](#déploiement)

---

## Fonctionnalités

- Ajouter, consulter, modifier, supprimer une dépense (CRUD complet)
- Recherche instantanée (titre / catégorie)
- Filtres avancés (catégorie, date, montant, tri croissant/décroissant)
- Filtres rapides (semaine, mois, trimestre)
- Tableau de bord avec statistiques automatiques (total, nombre, dernière dépense, catégorie la plus utilisée)
- Calculs automatiques (total, moyenne, dépense max/min)
- Graphique de répartition par catégorie (Chart.js)
- Export CSV et PDF
- Mode sombre avec sauvegarde du choix (localStorage)
- Pagination
- Notifications de succès/erreur
- Pages À propos, Contact, 404
- Design responsive avec animations discrètes
- Validation des données côté client **et** côté serveur
- Protection de l'accès au site par mot de passe (HTTP Basic Auth)
- Installable comme application (PWA) sur mobile, depuis le navigateur

---

## Protection par mot de passe

Tout le site (frontend + API) peut être protégé par un identifiant et un mot de passe, définis dans `.env` :

```env
ADMIN_USER=admin
ADMIN_PASSWORD=change-moi
```

Si ces deux variables sont vides ou absentes, la protection est **désactivée** (utile en développement local). Si elles sont renseignées, le navigateur affichera une fenêtre de connexion classique avant d'accéder au site — à ne partager qu'avec les personnes de confiance (ex: le correcteur).

## Installer l'application (PWA)

Le site peut être installé comme une application sur téléphone, sans passer par un store :

1. Ouvrir le site dans Chrome (Android) ou Safari (iOS)
2. Menu du navigateur → **"Installer l'application"** ou **"Ajouter à l'écran d'accueil"**
3. Une icône MoneyTrack apparaît sur l'écran d'accueil, et s'ouvre en plein écran comme une application native

---

## Structure du projet

```
moneytrack/
├── config/
│   └── db.js                  # Connexion MongoDB
├── controllers/
│   └── expenseController.js   # Logique métier des dépenses
├── middlewares/
│   ├── errorHandler.js        # Gestion globale des erreurs (+ 404)
│   └── validate.js            # Validation des données entrantes
├── models/
│   └── Expense.js             # Schéma Mongoose
├── routes/
│   └── expenseRoutes.js       # Routes de l'API REST
├── public/                    # Frontend statique servi par Express
│   ├── index.html
│   ├── style.css
│   └── script.js
├── server.js                  # Point d'entrée du serveur
├── package.json
├── .env.example
└── README.md
```

---

## Installation

### Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- Un compte [MongoDB Atlas](https://www.mongodb.com/atlas) (ou une instance MongoDB locale)

### Étapes

```bash
# 1. Cloner ou extraire le projet
cd moneytrack

# 2. Installer les dépendances
npm install

# 3. Créer le fichier .env à partir de l'exemple
cp .env.example .env
```

---

## Configuration

Ouvrir le fichier `.env` et renseigner vos propres valeurs :

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/moneytrack?retryWrites=true&w=majority
NODE_ENV=development
CLIENT_URL=http://localhost:5000
```

### Obtenir une URI MongoDB Atlas

1. Créer un compte sur [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Créer un cluster gratuit (M0)
3. Dans **Database Access**, créer un utilisateur avec mot de passe
4. Dans **Network Access**, autoriser votre IP (ou `0.0.0.0/0` pour tester)
5. Cliquer sur **Connect > Drivers**, copier l'URI et remplacer `<username>`, `<password>` et le nom de la base (`moneytrack`)

---

## Lancement du projet

### Mode développement (avec rechargement automatique)

```bash
npm run dev
```

### Mode production

```bash
npm start
```

Le serveur démarre par défaut sur `http://localhost:5000`. Le frontend (dossier `public/`) est servi automatiquement par Express — **il n'y a rien de plus à lancer**, tout est accessible depuis la même URL.

---

## Routes de l'API

Base URL : `/api/expenses`

| Méthode | Route                     | Description                          |
|---------|----------------------------|---------------------------------------|
| GET     | `/api/expenses`            | Liste des dépenses (filtres via query params : `search`, `categorie`, `dateFrom`, `dateTo`, `amountMin`, `amountMax`, `sort`) |
| GET     | `/api/expenses/:id`        | Récupérer une dépense par ID          |
| POST    | `/api/expenses`            | Créer une nouvelle dépense            |
| PUT     | `/api/expenses/:id`        | Modifier une dépense existante        |
| DELETE  | `/api/expenses/:id`        | Supprimer une dépense                 |
| GET     | `/api/expenses/stats/summary` | Statistiques globales (total, moyenne, top catégorie...) |
| GET     | `/api/health`              | Vérifier que l'API est en ligne       |

### Exemple de corps de requête (POST / PUT)

```json
{
  "titre": "Courses hebdomadaires",
  "montant": 85.50,
  "categorie": "Nourriture",
  "date": "2026-07-09",
  "description": "Fruits, légumes, viandes"
}
```

### Catégories valides

`Nourriture`, `Transport`, `Etudes`, `Loisirs`, `Factures`, `Sante`, `Shopping`, `Autres`

---

## Déploiement

### Backend sur Render

1. Pousser le projet sur GitHub
2. Créer un **Web Service** sur [Render](https://render.com)
3. Renseigner :
   - Build command : `npm install`
   - Start command : `npm start`
4. Ajouter les variables d'environnement (`MONGODB_URI`, `NODE_ENV=production`, `CLIENT_URL`) dans l'onglet **Environment**

### Frontend sur Vercel (optionnel, si séparé du backend)

Le dossier `public/` peut être déployé indépendamment sur [Vercel](https://vercel.com). Dans ce cas, penser à :
- Mettre à jour `API_URL` dans `public/script.js` avec l'URL du backend déployé sur Render
- Configurer `CLIENT_URL` côté backend avec l'URL Vercel pour autoriser le CORS

> Par défaut, ce projet sert le frontend directement depuis Express (`public/`), ce qui permet de tout déployer en une seule fois sur Render sans configuration CORS supplémentaire.

### Base de données sur MongoDB Atlas

Voir la section [Configuration](#configuration) ci-dessus.

---

## Sécurité

L'application utilise :
- **Helmet** : en-têtes HTTP sécurisés
- **CORS** : contrôle des origines autorisées
- **dotenv** : gestion des variables d'environnement
- **Morgan** : journalisation des requêtes HTTP
- **Compression** : compression des réponses
- Validation stricte des données côté serveur (middleware `validate.js`)
- Gestion globale des erreurs (middleware `errorHandler.js`)

---

## Auteur

Projet réalisé dans le cadre d'un exercice académique de développement Full Stack.
