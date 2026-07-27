/**
 * Gestion des routes non trouvees (404)
 */
function notFound(req, res, next) {
  const error = new Error(`Route non trouvee : ${req.originalUrl}`);
  res.status(404);
  next(error);
}

/**
 * Middleware global de gestion des erreurs.
 * Doit etre déclaré en dernier dans server.js (4 arguments).
 */
function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Erreur serveur interne.';

  // Erreur de cast Mongoose (ex: ID invalide)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'Identifiant invalide.';
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(' ');
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}

module.exports = { notFound, errorHandler };
