const { CATEGORIES } = require('../models/Expense');

/**
 * Valide le corps de la requete pour la creation/modification d'une depense.
 * Renvoie une erreur 400 avec des messages clairs si les donnees sont invalides.
 */
function validateExpense(req, res, next) {
  const { titre, montant, categorie, date, description } = req.body;
  const errors = {};

  if (!titre || typeof titre !== 'string' || titre.trim().length < 2) {
    errors.titre = 'Le titre est obligatoire et doit contenir au moins 2 caracteres.';
  }

  const montantNum = Number(montant);
  if (montant === undefined || montant === null || montant === '' || isNaN(montantNum)) {
    errors.montant = 'Le montant est obligatoire et doit etre un nombre.';
  } else if (montantNum <= 0) {
    errors.montant = 'Le montant doit etre superieur a 0.';
  }

  if (!categorie || !CATEGORIES.includes(categorie)) {
    errors.categorie = `La categorie doit etre l'une des suivantes : ${CATEGORIES.join(', ')}.`;
  }

  if (!date || isNaN(Date.parse(date))) {
    errors.date = 'La date est obligatoire et doit etre valide.';
  }

  if (description && description.length > 300) {
    errors.description = 'La description ne peut pas depasser 300 caracteres.';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Donnees invalides.',
      errors
    });
  }

  next();
}

module.exports = { validateExpense };
