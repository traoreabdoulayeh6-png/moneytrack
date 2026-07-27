/**
 * Middleware de protection par mot de passe (HTTP Basic Auth).
 * Bloque l'acces a l'ensemble du site (frontend + API) tant que
 * le bon nom d'utilisateur / mot de passe n'a pas ete fourni.
 *
 * Les identifiants sont definis via les variables d'environnement
 * ADMIN_USER et ADMIN_PASSWORD (voir .env).
 */
function basicAuth(req, res, next) {
  const adminUser = process.env.ADMIN_USER;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Si aucun identifiant n'est configure, la protection est desactivee
  // (utile en developpement si on ne veut pas la contrainte).
  if (!adminUser || !adminPassword) {
    return next();
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="MoneyTrack"');
    return res.status(401).send('Authentification requise.');
  }

  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  if (username === adminUser && password === adminPassword) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="MoneyTrack"');
  return res.status(401).send('Identifiants incorrects.');
}

module.exports = { basicAuth };
