const rateLimit = require('express-rate-limit');

// Limite les tentatives de scan/validation PAR AGENT (identité JWT) plutôt que par IP :
// plusieurs agents derrière une même passerelle réseau (école, dépôt, gare) partagent
// souvent la même IP publique, ce qui pénaliserait injustement les autres si la clé était
// l'IP. Un compte compromis ou un script qui rejoue des QR Codes en boucle est ainsi limité
// sans bloquer ses collègues.
const limiteurValidation = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 tentatives de validation par minute et par agent
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { statut_validation: 'REFUSE', raison: 'Trop de tentatives de validation. Réessayez dans un instant.' }
});

module.exports = { limiteurValidation };
