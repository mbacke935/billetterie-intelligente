const crypto = require('crypto');

const SECRET = process.env.QR_SECRET || 'dev-qr-secret-change-me';

// Le contenu du QR Code est un jeton opaque "payload.signature" (base64url + HMAC-SHA256).
// Le payload ne contient QUE l'identifiant du titre (aucune donnée personnelle, comme
// l'exige le cahier des charges) ; toutes les autres informations (client, abonnement,
// statut...) sont retrouvées en base à partir de cet identifiant lors du scan, jamais lues
// directement depuis le contenu du QR Code.
const genererQrToken = (titreId) => {
  const payload = { titre_id: titreId };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${signature}`;
};

// Vérifie le jeton et renvoie { titre_id }, ou null si absent/invalide/altéré.
const verifierQrToken = (token) => {
  if (typeof token !== 'string' || !token.includes('.')) return null;

  const [payloadB64, signature] = token.split('.');
  if (!payloadB64 || !signature) return null;

  const signatureAttendue = crypto.createHmac('sha256', SECRET).update(payloadB64).digest('base64url');

  const sigBuf = Buffer.from(signature);
  const attendueBuf = Buffer.from(signatureAttendue);
  if (sigBuf.length !== attendueBuf.length || !crypto.timingSafeEqual(sigBuf, attendueBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!payload || typeof payload.titre_id !== 'string') return null;
    return payload;
  } catch {
    return null;
  }
};

module.exports = { genererQrToken, verifierQrToken };
