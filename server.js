require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const connectDB = require('./config/db');
const expenseRoutes = require('./routes/expenseRoutes');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const { basicAuth } = require('./middlewares/auth');

// Connexion a la base de donnees
connectDB();

const app = express();

/* ================= MIDDLEWARES DE SECURITE / UTILITAIRES ================= */
app.use(
  helmet({
    contentSecurityPolicy: false // desactive pour permettre les CDN utilises par le frontend
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*'
  })
);
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= PROTECTION PAR MOT DE PASSE ================= */
// Bloque l'acces a tout le site (frontend + API) tant que les bons
// identifiants (ADMIN_USER / ADMIN_PASSWORD) n'ont pas ete fournis.
app.use(basicAuth);

/* ================= FICHIERS STATIQUES (FRONTEND) ================= */
app.use(express.static(path.join(__dirname, 'public')));

/* ================= ROUTES API ================= */
app.use('/api/expenses', expenseRoutes);

// Route de sante (utile pour verifier que l'API tourne, ex: sur Render)
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'MoneyTrack API en ligne.' });
});

// Toute autre route -> renvoyer index.html (support du routing cote client)
app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) return next();
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ================= GESTION DES ERREURS ================= */
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Serveur MoneyTrack demarre sur le port ${PORT} (${process.env.NODE_ENV || 'development'})`);
});
