/* ============================================================
   MONEYTRACK - FRONTEND JS
   Communique avec le backend via l'API REST (/api/expenses)
   ============================================================ */

const API_URL = '/api/expenses';

const CATEGORIES = [
  'Nourriture', 'Transport', 'Etudes', 'Loisirs',
  'Factures', 'Sante', 'Shopping', 'Autres'
];

const CAT_CONFIG = {
  'Nourriture': { color: '#F59E0B', icon: 'fa-utensils',     bgLight: '#FEF3C7', bgDark: '#78350F' },
  'Transport':  { color: '#3B82F6', icon: 'fa-car',          bgLight: '#DBEAFE', bgDark: '#1E3A5F' },
  'Etudes':     { color: '#8B5CF6', icon: 'fa-book',         bgLight: '#EDE9FE', bgDark: '#4C1D95' },
  'Loisirs':    { color: '#EC4899', icon: 'fa-gamepad',      bgLight: '#FCE7F3', bgDark: '#831843' },
  'Factures':   { color: '#EF4444', icon: 'fa-file-invoice', bgLight: '#FEE2E2', bgDark: '#7F1D1D' },
  'Sante':      { color: '#10B981', icon: 'fa-heart-pulse',  bgLight: '#D1FAE5', bgDark: '#064E3B' },
  'Shopping':   { color: '#14B8A6', icon: 'fa-bag-shopping', bgLight: '#CCFBF1', bgDark: '#134E4A' },
  'Autres':     { color: '#6B7280', icon: 'fa-ellipsis',     bgLight: '#F3F4F6', bgDark: '#374151' }
};

const ITEMS_PER_PAGE = 8;
const DARK_MODE_KEY = 'moneytrack_darkmode';

let state = {
  expenses: [],
  currentPage: 1,
  currentPeriod: 'all',
  chartInstance: null,
  deleteTargetId: null
};

/* ================================================================
   APPEL API
   ================================================================ */
async function apiRequest(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || 'Erreur reseau.');
    err.errors = data.errors;
    throw err;
  }
  return data;
}

async function fetchExpenses() {
  const data = await apiRequest(API_URL);
  state.expenses = data.data.map(normalizeExpense);
}

function normalizeExpense(e) {
  return {
    id: e._id,
    titre: e.titre,
    montant: e.montant,
    categorie: e.categorie,
    date: (e.date || '').substring(0, 10),
    description: e.description || '',
    createdAt: e.createdAt,
    updatedAt: e.updatedAt
  };
}

async function addExpenseAPI(payload) {
  const data = await apiRequest(API_URL, { method: 'POST', body: JSON.stringify(payload) });
  return data;
}

async function updateExpenseAPI(id, payload) {
  const data = await apiRequest(`${API_URL}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return data;
}

async function deleteExpenseAPI(id) {
  const data = await apiRequest(`${API_URL}/${id}`, { method: 'DELETE' });
  return data;
}

function getExpenseById(id) {
  return state.expenses.find(e => e.id === id) || null;
}

/* ================================================================
   UTILITAIRES
   ================================================================ */
function formatMoney(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function truncate(str, len) {
  if (!str) return '--';
  return str.length > len ? str.substring(0, len) + '...' : str;
}

function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function getCategoryBadge(categorie) {
  const cfg = CAT_CONFIG[categorie] || CAT_CONFIG['Autres'];
  const bg = isDarkMode() ? cfg.bgDark : cfg.bgLight;
  return `<span class="category-badge" style="background:${bg};color:${cfg.color}">
    <i class="fa-solid ${cfg.icon}"></i> ${categorie}
  </span>`;
}

/* ================================================================
   FILTRAGE & TRI (cote client, sur les donnees deja chargees)
   ================================================================ */
function getFilteredExpenses() {
  let result = [...state.expenses];

  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  if (query) {
    result = result.filter(e =>
      e.titre.toLowerCase().includes(query) ||
      e.categorie.toLowerCase().includes(query)
    );
  }

  const catFilter = document.getElementById('filterCategory').value;
  if (catFilter) result = result.filter(e => e.categorie === catFilter);

  const dateFrom = document.getElementById('filterDateFrom').value;
  const dateTo = document.getElementById('filterDateTo').value;
  if (dateFrom) result = result.filter(e => e.date >= dateFrom);
  if (dateTo) result = result.filter(e => e.date <= dateTo);

  const amountMin = parseFloat(document.getElementById('filterAmountMin').value);
  const amountMax = parseFloat(document.getElementById('filterAmountMax').value);
  if (!isNaN(amountMin) && amountMin >= 0) result = result.filter(e => e.montant >= amountMin);
  if (!isNaN(amountMax) && amountMax >= 0) result = result.filter(e => e.montant <= amountMax);

  const now = new Date();
  if (state.currentPeriod === 'week') {
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1);
    const sw = startOfWeek.toISOString().split('T')[0];
    result = result.filter(e => e.date >= sw);
  } else if (state.currentPeriod === 'month') {
    const ym = now.toISOString().substring(0, 7);
    result = result.filter(e => e.date.substring(0, 7) === ym);
  } else if (state.currentPeriod === 'quarter') {
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().split('T')[0];
    result = result.filter(e => e.date >= qStart);
  }

  const sort = document.getElementById('sortOrder').value;
  switch (sort) {
    case 'date-desc': result.sort((a, b) => b.date.localeCompare(a.date)); break;
    case 'date-asc': result.sort((a, b) => a.date.localeCompare(b.date)); break;
    case 'amount-desc': result.sort((a, b) => b.montant - a.montant); break;
    case 'amount-asc': result.sort((a, b) => a.montant - b.montant); break;
    case 'title-asc': result.sort((a, b) => a.titre.localeCompare(b.titre)); break;
  }

  return result;
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterDateFrom').value = '';
  document.getElementById('filterDateTo').value = '';
  document.getElementById('filterAmountMin').value = '';
  document.getElementById('filterAmountMax').value = '';
  document.getElementById('sortOrder').value = 'date-desc';
  state.currentPeriod = 'all';
  document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.toggle('active', b.dataset.period === 'all'));
  state.currentPage = 1;
  renderAll();
}

/* ================================================================
   NOTIFICATIONS
   ================================================================ */
function showNotification(message, type = 'success') {
  const container = document.getElementById('notifications');
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info' };
  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.innerHTML = `<i class="fa-solid ${icons[type] || icons.info}"></i><span>${escapeHtml(message)}</span>`;
  container.appendChild(el);

  setTimeout(() => {
    el.classList.add('removing');
    el.addEventListener('animationend', () => el.remove());
  }, 3000);
}

/* ================================================================
   MODALS
   ================================================================ */
function openEditModal(id) {
  const expense = getExpenseById(id);
  if (!expense) return;
  document.getElementById('editId').value = id;
  document.getElementById('editTitre').value = expense.titre;
  document.getElementById('editMontant').value = expense.montant;
  document.getElementById('editCategorie').value = expense.categorie;
  document.getElementById('editDate').value = expense.date;
  document.getElementById('editDescription').value = expense.description || '';
  clearErrors('edit');
  document.getElementById('editModal').classList.add('active');
  document.getElementById('editTitre').focus();
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
}

function openConfirmModal(id) {
  const expense = getExpenseById(id);
  if (!expense) return;
  state.deleteTargetId = id;
  document.getElementById('confirmName').textContent = `${expense.titre} (${formatMoney(expense.montant)})`;
  document.getElementById('confirmModal').classList.add('active');
}

function closeConfirmModal() {
  document.getElementById('confirmModal').classList.remove('active');
  state.deleteTargetId = null;
}

/* ================================================================
   VALIDATION (cote client, en plus de la validation serveur)
   ================================================================ */
function clearErrors(prefix) {
  document.querySelectorAll(`[id^="${prefix}"][id$="Error"]`).forEach(el => el.textContent = '');
}

function validateForm(prefix) {
  let valid = true;
  clearErrors(prefix);

  const titre = document.getElementById(`${prefix}Titre`).value.trim();
  const montant = parseFloat(document.getElementById(`${prefix}Montant`).value);
  const categorie = document.getElementById(`${prefix}Categorie`).value;
  const date = document.getElementById(`${prefix}Date`).value;

  if (!titre) {
    document.getElementById(`${prefix}TitreError`).textContent = 'Le titre est obligatoire.';
    valid = false;
  } else if (titre.length < 2) {
    document.getElementById(`${prefix}TitreError`).textContent = 'Le titre doit contenir au moins 2 caracteres.';
    valid = false;
  }

  if (isNaN(montant)) {
    document.getElementById(`${prefix}MontantError`).textContent = 'Le montant est obligatoire.';
    valid = false;
  } else if (montant < 0) {
    document.getElementById(`${prefix}MontantError`).textContent = 'Le montant ne peut pas etre negatif.';
    valid = false;
  } else if (montant === 0) {
    document.getElementById(`${prefix}MontantError`).textContent = 'Le montant doit etre superieur a 0.';
    valid = false;
  }

  if (!categorie) {
    document.getElementById(`${prefix}CategorieError`).textContent = 'Veuillez choisir une categorie.';
    valid = false;
  }

  if (!date) {
    document.getElementById(`${prefix}DateError`).textContent = 'La date est obligatoire.';
    valid = false;
  }

  return valid;
}

function applyServerErrors(prefix, errors) {
  if (!errors) return;
  Object.keys(errors).forEach(field => {
    const el = document.getElementById(`${prefix}${field.charAt(0).toUpperCase() + field.slice(1)}Error`);
    if (el) el.textContent = errors[field];
  });
}

/* ================================================================
   RENDU : TABLEAU DE BORD
   ================================================================ */
function renderDashboard() {
  const all = state.expenses;
  const total = all.reduce((s, e) => s + e.montant, 0);
  const count = all.length;
  const last = all.length > 0 ? all.reduce((a, b) => a.date > b.date ? a : b) : null;

  const catCounts = {};
  all.forEach(e => { catCounts[e.categorie] = (catCounts[e.categorie] || 0) + 1; });
  const topCat = Object.keys(catCounts).sort((a, b) => catCounts[b] - catCounts[a])[0] || '--';

  document.getElementById('statTotal').textContent = formatMoney(total);
  document.getElementById('statCount').textContent = count;
  document.getElementById('statLast').textContent = last ? `${truncate(last.titre, 18)} (${formatMoney(last.montant)})` : '--';
  document.getElementById('statTopCat').textContent = topCat;
}

/* ================================================================
   RENDU : TABLEAU
   ================================================================ */
function renderTable() {
  const filtered = getFilteredExpenses();
  const tbody = document.getElementById('expenseTableBody');
  const emptyState = document.getElementById('emptyState');

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (state.currentPage > totalPages) state.currentPage = totalPages;
  const start = (state.currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.style.display = 'block';
    document.getElementById('pagination').innerHTML = '';
    return;
  }

  emptyState.style.display = 'none';

  tbody.innerHTML = pageItems.map(e => `
    <tr>
      <td style="font-weight:600">${escapeHtml(e.titre)}</td>
      <td style="font-family:var(--font-heading);font-weight:700;color:var(--red)">${formatMoney(e.montant)}</td>
      <td>${getCategoryBadge(e.categorie)}</td>
      <td style="white-space:nowrap">${formatDate(e.date)}</td>
      <td style="color:var(--text-muted);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(e.description || '--')}</td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon edit" onclick="openEditModal('${e.id}')" aria-label="Modifier ${escapeHtml(e.titre)}">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn-icon delete" onclick="openConfirmModal('${e.id}')" aria-label="Supprimer ${escapeHtml(e.titre)}">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPagination(totalPages, filtered.length);
}

/* ================================================================
   RENDU : PAGINATION
   ================================================================ */
function renderPagination(totalPages, totalItems) {
  const container = document.getElementById('pagination');
  if (totalPages <= 1) {
    container.innerHTML = `<span style="color:var(--text-muted);font-size:0.85rem">${totalItems} resultat${totalItems > 1 ? 's' : ''}</span>`;
    return;
  }

  let html = `<button class="page-btn" onclick="goToPage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''} aria-label="Page precedente"><i class="fa-solid fa-chevron-left"></i></button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (totalPages > 7) {
      if (i === 1 || i === totalPages || (i >= state.currentPage - 1 && i <= state.currentPage + 1)) {
        html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
      } else if (i === state.currentPage - 2 || i === state.currentPage + 2) {
        html += `<span style="color:var(--text-muted);padding:0 4px">...</span>`;
      }
    } else {
      html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
  }

  html += `<button class="page-btn" onclick="goToPage(${state.currentPage + 1})" ${state.currentPage === totalPages ? 'disabled' : ''} aria-label="Page suivante"><i class="fa-solid fa-chevron-right"></i></button>`;
  html += `<span style="color:var(--text-muted);font-size:0.85rem;margin-left:0.8rem">${totalItems} resultat${totalItems > 1 ? 's' : ''}</span>`;

  container.innerHTML = html;
}

function goToPage(page) {
  const filtered = getFilteredExpenses();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  if (page < 1 || page > totalPages) return;
  state.currentPage = page;
  renderTable();
  document.getElementById('expenseTableBody').closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ================================================================
   RENDU : GRAPHIQUE
   ================================================================ */
function renderChart() {
  const ctx = document.getElementById('categoryChart').getContext('2d');
  const catTotals = {};
  CATEGORIES.forEach(c => catTotals[c] = 0);
  state.expenses.forEach(e => {
    if (catTotals[e.categorie] !== undefined) catTotals[e.categorie] += e.montant;
  });

  const labels = [], data = [], colors = [], borderColors = [];

  CATEGORIES.forEach(c => {
    if (catTotals[c] > 0) {
      labels.push(c);
      data.push(Math.round(catTotals[c] * 100) / 100);
      colors.push(CAT_CONFIG[c].color + 'CC');
      borderColors.push(CAT_CONFIG[c].color);
    }
  });

  if (state.chartInstance) state.chartInstance.destroy();

  state.chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: borderColors, borderWidth: 2, hoverBorderWidth: 3, hoverOffset: 8 }] },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { padding: 16, usePointStyle: true, pointStyleWidth: 10, font: { family: "'DM Sans', sans-serif", size: 12, weight: 500 }, color: isDarkMode() ? '#94A3B8' : '#475569' }
        },
        tooltip: {
          backgroundColor: isDarkMode() ? '#1B2740' : '#0A1628',
          titleFont: { family: "'Space Grotesk', sans-serif", size: 13, weight: 600 },
          bodyFont: { family: "'DM Sans', sans-serif", size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: function(ctx) {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
              return ` ${ctx.label} : ${formatMoney(ctx.parsed)} (${pct}%)`;
            }
          }
        }
      },
      animation: { animateRotate: true, duration: 800, easing: 'easeOutQuart' }
    }
  });
}

/* ================================================================
   RENDU : CALCULS
   ================================================================ */
function renderCalculations() {
  const filtered = getFilteredExpenses();
  const total = filtered.reduce((s, e) => s + e.montant, 0);
  const count = filtered.length;
  const avg = count > 0 ? total / count : 0;
  const max = count > 0 ? Math.max(...filtered.map(e => e.montant)) : 0;
  const min = count > 0 ? Math.min(...filtered.map(e => e.montant)) : 0;

  document.getElementById('calcTotal').textContent = formatMoney(total);
  document.getElementById('calcCount').textContent = count;
  document.getElementById('calcAvg').textContent = formatMoney(avg);
  document.getElementById('calcMax').textContent = formatMoney(max);
  document.getElementById('calcMin').textContent = formatMoney(min);
}

/* ================================================================
   RENDU : TOP 5
   ================================================================ */
function renderTopExpenses() {
  const all = [...state.expenses];

  const last5 = all.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || '').localeCompare(a.createdAt || '')).slice(0, 5);
  const lastContainer = document.getElementById('topLast');
  lastContainer.innerHTML = last5.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:1rem">Aucune donnee</p>'
    : last5.map((e, i) => `
      <div class="top-item">
        <div class="top-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</div>
        <div class="top-info">
          <div class="top-title">${escapeHtml(e.titre)}</div>
          <div class="top-meta">${formatDate(e.date)} — ${e.categorie}</div>
        </div>
        <div class="top-amount">${formatMoney(e.montant)}</div>
      </div>
    `).join('');

  const biggest5 = [...state.expenses].sort((a, b) => b.montant - a.montant).slice(0, 5);
  const bigContainer = document.getElementById('topBiggest');
  bigContainer.innerHTML = biggest5.length === 0
    ? '<p style="color:var(--text-muted);text-align:center;padding:1rem">Aucune donnee</p>'
    : biggest5.map((e, i) => `
      <div class="top-item">
        <div class="top-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}">${i + 1}</div>
        <div class="top-info">
          <div class="top-title">${escapeHtml(e.titre)}</div>
          <div class="top-meta">${formatDate(e.date)} — ${e.categorie}</div>
        </div>
        <div class="top-amount">${formatMoney(e.montant)}</div>
      </div>
    `).join('');
}

/* ================================================================
   RENDU GLOBAL
   ================================================================ */
function renderAll() {
  renderDashboard();
  renderTable();
  renderChart();
  renderCalculations();
  renderTopExpenses();
}

/* ================================================================
   EXPORT CSV
   ================================================================ */
function exportCSV() {
  const filtered = getFilteredExpenses();
  if (filtered.length === 0) {
    showNotification('Aucune depense a exporter.', 'error');
    return;
  }

  const headers = ['Titre', 'Montant', 'Categorie', 'Date', 'Description'];
  const rows = filtered.map(e => [
    e.titre, e.montant.toFixed(2), e.categorie, e.date, (e.description || '').replace(/"/g, '""')
  ]);

  let csv = headers.join(';') + '\n';
  rows.forEach(r => { csv += r.map(v => `"${v}"`).join(';') + '\n'; });

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `moneytrack_depenses_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showNotification('Export CSV genere avec succes.', 'success');
}

/* ================================================================
   EXPORT PDF
   ================================================================ */
function exportPDF() {
  const filtered = getFilteredExpenses();
  if (filtered.length === 0) {
    showNotification('Aucune depense a exporter.', 'error');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setTextColor(13, 148, 136);
  doc.text('MoneyTrack — Rapport de depenses', 14, 18);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Genere le ${new Date().toLocaleDateString('fr-FR')}`, 14, 25);

  const total = filtered.reduce((s, e) => s + e.montant, 0);
  doc.text(`Total : ${formatMoney(total)} — ${filtered.length} depense(s)`, 14, 31);

  doc.autoTable({
    startY: 38,
    head: [['Titre', 'Montant', 'Categorie', 'Date', 'Description']],
    body: filtered.map(e => [e.titre, formatMoney(e.montant), e.categorie, formatDate(e.date), truncate(e.description || '--', 40)]),
    headStyles: { fillColor: [10, 22, 40] },
    styles: { fontSize: 9 }
  });

  doc.save(`moneytrack_depenses_${new Date().toISOString().split('T')[0]}.pdf`);
  showNotification('Export PDF genere avec succes.', 'success');
}

/* ================================================================
   NAVIGATION ENTRE PAGES
   ================================================================ */
function navigateTo(pageName) {
  const pages = ['accueil', 'apropos', 'contact'];
  const target = pages.includes(pageName) ? pageName : '404';

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById(`page-${target}`);
  if (pageEl) pageEl.classList.add('active');

  document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.page === target);
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================================================================
   MODE SOMBRE
   ================================================================ */
function toggleDarkMode() {
  const isDark = isDarkMode();
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  localStorage.setItem(DARK_MODE_KEY, isDark ? 'light' : 'dark');

  const icon = document.querySelector('#darkModeBtn i');
  icon.className = isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun';

  renderTable();
  renderChart();
}

function initDarkMode() {
  const saved = localStorage.getItem(DARK_MODE_KEY) || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  const icon = document.querySelector('#darkModeBtn i');
  icon.className = saved === 'dark' ? 'fa-solid fa-sun' : 'fa-solid fa-moon';
}

/* ================================================================
   INITIALISATION DES SELECTS DE CATEGORIES
   ================================================================ */
function populateCategorySelects() {
  const selects = ['addCategorie', 'editCategorie', 'filterCategory'];
  selects.forEach(id => {
    const select = document.getElementById(id);
    CATEGORIES.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      select.appendChild(opt);
    });
  });
}

/* ================================================================
   EVENEMENTS
   ================================================================ */
function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => navigateTo(btn.dataset.page));
  });
  document.getElementById('darkModeBtn').addEventListener('click', toggleDarkMode);

  // Formulaire d'ajout
  document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm('add')) return;

    const payload = {
      titre: document.getElementById('addTitre').value.trim(),
      montant: parseFloat(document.getElementById('addMontant').value),
      categorie: document.getElementById('addCategorie').value,
      date: document.getElementById('addDate').value,
      description: document.getElementById('addDescription').value.trim()
    };

    const btn = document.getElementById('addSubmitBtn');
    btn.disabled = true;
    try {
      await addExpenseAPI(payload);
      await fetchExpenses();
      state.currentPage = 1;
      renderAll();
      document.getElementById('addForm').reset();
      showNotification('Depense ajoutee avec succes.', 'success');
    } catch (err) {
      applyServerErrors('add', err.errors);
      showNotification(err.message || 'Erreur lors de l\'ajout.', 'error');
    } finally {
      btn.disabled = false;
    }
  });

  // Formulaire d'edition
  document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validateForm('edit')) return;

    const id = document.getElementById('editId').value;
    const payload = {
      titre: document.getElementById('editTitre').value.trim(),
      montant: parseFloat(document.getElementById('editMontant').value),
      categorie: document.getElementById('editCategorie').value,
      date: document.getElementById('editDate').value,
      description: document.getElementById('editDescription').value.trim()
    };

    try {
      await updateExpenseAPI(id, payload);
      await fetchExpenses();
      renderAll();
      closeEditModal();
      showNotification('Depense modifiee avec succes.', 'success');
    } catch (err) {
      applyServerErrors('edit', err.errors);
      showNotification(err.message || 'Erreur lors de la modification.', 'error');
    }
  });

  // Confirmation suppression
  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    if (!state.deleteTargetId) return;
    try {
      await deleteExpenseAPI(state.deleteTargetId);
      await fetchExpenses();
      renderAll();
      closeConfirmModal();
      showNotification('Depense supprimee avec succes.', 'success');
    } catch (err) {
      showNotification(err.message || 'Erreur lors de la suppression.', 'error');
    }
  });

  // Fermeture modal en cliquant sur l'overlay
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });

  // Recherche instantanee et filtres
  ['searchInput', 'filterCategory', 'filterDateFrom', 'filterDateTo', 'filterAmountMin', 'filterAmountMax', 'sortOrder'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
      state.currentPage = 1;
      renderTable();
      renderCalculations();
    });
  });

  // Filtres rapides (periode)
  document.querySelectorAll('.quick-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quick-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.currentPeriod = btn.dataset.period;
      state.currentPage = 1;
      renderTable();
      renderCalculations();
    });
  });

  // Formulaire de contact
  document.getElementById('contactForm').addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;
    ['contactNameError', 'contactEmailError', 'contactMessageError'].forEach(id => document.getElementById(id).textContent = '');

    const name = document.getElementById('contactName').value.trim();
    const email = document.getElementById('contactEmail').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    if (!name) { document.getElementById('contactNameError').textContent = 'Le nom est obligatoire.'; valid = false; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { document.getElementById('contactEmailError').textContent = 'Email invalide.'; valid = false; }
    if (!message || message.length < 5) { document.getElementById('contactMessageError').textContent = 'Le message est trop court.'; valid = false; }

    if (!valid) return;

    showNotification('Message envoye avec succes. Merci !', 'success');
    document.getElementById('contactForm').reset();
  });
}

/* ================================================================
   INITIALISATION
   ================================================================ */
async function init() {
  initDarkMode();
  populateCategorySelects();
  setupEventListeners();

  try {
    await fetchExpenses();
    renderAll();
  } catch (err) {
    showNotification('Impossible de charger les depenses. Verifiez que le serveur est demarre.', 'error');
    console.error(err);
  }

  const loader = document.getElementById('loader');
  setTimeout(() => loader.classList.add('hidden'), 400);
}

document.addEventListener('DOMContentLoaded', init);

/* ================================================================
   PWA : ENREGISTREMENT DU SERVICE WORKER
   Permet l'installation de l'application sur l'ecran d'accueil.
   ================================================================ */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Echec de l\'enregistrement du service worker :', err);
    });
  });
}
