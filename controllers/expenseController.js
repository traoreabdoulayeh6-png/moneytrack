const Expense = require('../models/Expense');

/**
 * @desc    Recuperer toutes les depenses (avec recherche/filtres optionnels)
 * @route   GET /api/expenses
 * @access  Public
 */
async function getExpenses(req, res, next) {
  try {
    const { search, categorie, dateFrom, dateTo, amountMin, amountMax, sort } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { titre: { $regex: search, $options: 'i' } },
        { categorie: { $regex: search, $options: 'i' } }
      ];
    }

    if (categorie) query.categorie = categorie;

    if (dateFrom || dateTo) {
      query.date = {};
      if (dateFrom) query.date.$gte = new Date(dateFrom);
      if (dateTo) query.date.$lte = new Date(dateTo);
    }

    if (amountMin || amountMax) {
      query.montant = {};
      if (amountMin) query.montant.$gte = Number(amountMin);
      if (amountMax) query.montant.$lte = Number(amountMax);
    }

    let sortOption = { date: -1 };
    switch (sort) {
      case 'date-asc': sortOption = { date: 1 }; break;
      case 'date-desc': sortOption = { date: -1 }; break;
      case 'amount-asc': sortOption = { montant: 1 }; break;
      case 'amount-desc': sortOption = { montant: -1 }; break;
      case 'title-asc': sortOption = { titre: 1 }; break;
    }

    const expenses = await Expense.find(query).sort(sortOption);

    res.status(200).json({ success: true, count: expenses.length, data: expenses });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Recuperer une depense par son ID
 * @route   GET /api/expenses/:id
 * @access  Public
 */
async function getExpenseById(req, res, next) {
  try {
    const expense = await Expense.findById(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Depense non trouvee.' });
    }

    res.status(200).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Creer une nouvelle depense
 * @route   POST /api/expenses
 * @access  Public
 */
async function createExpense(req, res, next) {
  try {
    const { titre, montant, categorie, date, description } = req.body;

    const expense = await Expense.create({
      titre: titre.trim(),
      montant: Number(montant),
      categorie,
      date,
      description: description ? description.trim() : ''
    });

    res.status(201).json({ success: true, message: 'Depense ajoutee avec succes.', data: expense });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Modifier une depense existante
 * @route   PUT /api/expenses/:id
 * @access  Public
 */
async function updateExpense(req, res, next) {
  try {
    const { titre, montant, categorie, date, description } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        titre: titre.trim(),
        montant: Number(montant),
        categorie,
        date,
        description: description ? description.trim() : ''
      },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Depense non trouvee.' });
    }

    res.status(200).json({ success: true, message: 'Depense modifiee avec succes.', data: expense });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Supprimer une depense
 * @route   DELETE /api/expenses/:id
 * @access  Public
 */
async function deleteExpense(req, res, next) {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Depense non trouvee.' });
    }

    res.status(200).json({ success: true, message: 'Depense supprimee avec succes.', data: {} });
  } catch (error) {
    next(error);
  }
}

/**
 * @desc    Recuperer les statistiques globales (total, moyenne, top categorie, etc.)
 * @route   GET /api/expenses/stats/summary
 * @access  Public
 */
async function getStats(req, res, next) {
  try {
    const expenses = await Expense.find();

    const total = expenses.reduce((sum, e) => sum + e.montant, 0);
    const count = expenses.length;
    const avg = count > 0 ? total / count : 0;
    const max = count > 0 ? Math.max(...expenses.map((e) => e.montant)) : 0;
    const min = count > 0 ? Math.min(...expenses.map((e) => e.montant)) : 0;

    const catCounts = {};
    expenses.forEach((e) => {
      catCounts[e.categorie] = (catCounts[e.categorie] || 0) + 1;
    });
    const topCategory =
      Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])[0] || null;

    const lastExpense =
      count > 0
        ? expenses.reduce((a, b) => (a.date > b.date ? a : b))
        : null;

    res.status(200).json({
      success: true,
      data: { total, count, avg, max, min, topCategory, lastExpense }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getStats
};
