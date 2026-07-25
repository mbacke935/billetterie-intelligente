const crypto = require('crypto');

const SECRET = process.env.QR_SECRET || 'dev-qr-secret-change-me';

// Signe un payload en un jeton compact "payload.signature" (base64url + HMAC-SHA256)
// pour empêcher qu'un ticket falsifié (ex. voyages_restants modifié à la main) soit accepté.
const signerPayload = (payload) => {
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
};

// Vérifie le jeton et renvoie le payload d'origine, ou null si invalide/altéré
const verifierToken = (token) => {
  if (typeof token !== 'string' || !token.includes('.')) return null;

  const [payloadB64, signature] = token.split('.');
  const signatureAttendue = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');

  const sigBuf = Buffer.from(signature || '');
  const attendueBuf = Buffer.from(signatureAttendue);
  if (sigBuf.length !== attendueBuf.length || !crypto.timingSafeEqual(sigBuf, attendueBuf)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
};

module.exports = { signerPayload, verifierToken };
