const generatePassword = require('../utils/generatePassword');

// ═══════════════════════════════════════════════════════════════
// TEST UNITAIRE — generatePassword()
// Fichier : utils/generatePassword.js
// Objectif : vérifier que la fonction génère correctement
//            un mot de passe aléatoire de 8 caractères
// Type de test : unitaire (pas besoin de base de données)
// ═══════════════════════════════════════════════════════════════

describe('generatePassword', () => {

  // ── TC-U01 : mot de passe 
  // Vérifie que le mot de passe généré contient exactement
  // 8 caractères
  it('génère un mot de passe de 8 caractères', () => {
    const pwd = generatePassword(8);
    expect(pwd).toHaveLength(8);
  });

  // ── TC-U02 : Présence de lettres 
  // Vérifie que le mot de passe contient au moins une lettre
  // (majuscule ou minuscule) pour garantir sa complexité
  it('contient des lettres', () => {
    const pwd = generatePassword(8);
    expect(/[A-Za-z]/.test(pwd)).toBe(true);
  });

  // ── TC-U03 : Caractère aléatoire ───────────────────────────
  // Vérifie que deux appels successifs ne produisent pas
  // le même mot de passe (aléatoire à chaque génération)
  it('deux appels donnent des résultats différents', () => {
    const pwd1 = generatePassword(8);
    const pwd2 = generatePassword(8);
    expect(pwd1).not.toBe(pwd2);
  });

});