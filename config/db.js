const mongoose = require('mongoose');

/**
 * Etablit la connexion a la base de donnees MongoDB.
 * Utilise l'URI defini dans les variables d'environnement (MONGODB_URI).
 */
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI manquant dans les variables d\'environnement.');
    }

    const conn = await mongoose.connect(uri);

    console.log(`MongoDB connecte : ${conn.connection.host}`);
  } catch (error) {
    console.error(`Erreur de connexion a MongoDB : ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
