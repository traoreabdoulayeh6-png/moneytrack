const mongoose = require('mongoose');

const CATEGORIES = [
  'Nourriture',
  'Transport',
  'Etudes',
  'Loisirs',
  'Factures',
  'Sante',
  'Shopping',
  'Autres'
];

const expenseSchema = new mongoose.Schema(
  {
    titre: {
      type: String,
      required: [true, 'Le titre est obligatoire.'],
      trim: true,
      minlength: [2, 'Le titre doit contenir au moins 2 caracteres.'],
      maxlength: [100, 'Le titre ne peut pas depasser 100 caracteres.']
    },
    montant: {
      type: Number,
      required: [true, 'Le montant est obligatoire.'],
      min: [0.01, 'Le montant doit etre superieur a 0.']
    },
    categorie: {
      type: String,
      required: [true, 'La categorie est obligatoire.'],
      enum: {
        values: CATEGORIES,
        message: 'Categorie invalide.'
      }
    },
    date: {
      type: Date,
      required: [true, 'La date est obligatoire.']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [300, 'La description ne peut pas depasser 300 caracteres.'],
      default: ''
    }
  },
  {
    timestamps: true // ajoute automatiquement createdAt et updatedAt
  }
);

expenseSchema.index({ titre: 'text', categorie: 'text' });

module.exports = mongoose.model('Expense', expenseSchema);
module.exports.CATEGORIES = CATEGORIES;
