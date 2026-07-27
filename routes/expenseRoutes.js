const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getStats
} = require('../controllers/expenseController');
const { validateExpense } = require('../middlewares/validate');

// GET /api/expenses/stats/summary -> statistiques globales
router.get('/stats/summary', getStats);

// GET /api/expenses -> liste (avec recherche/filtres via query params)
router.get('/', getExpenses);

// GET /api/expenses/:id -> une depense
router.get('/:id', getExpenseById);

// POST /api/expenses -> creation
router.post('/', validateExpense, createExpense);

// PUT /api/expenses/:id -> modification
router.put('/:id', validateExpense, updateExpense);

// DELETE /api/expenses/:id -> suppression
router.delete('/:id', deleteExpense);

module.exports = router;
