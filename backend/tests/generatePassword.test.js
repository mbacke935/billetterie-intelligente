const generatePassword = require('../utils/generatePassword');

describe('generatePassword', () => {

  it('génère un mot de passe de 8 caractères', () => {
    const pwd = generatePassword(8);
    expect(pwd).toHaveLength(8);
  });

  it('contient des lettres', () => {
    const pwd = generatePassword(8);
    expect(/[A-Za-z]/.test(pwd)).toBe(true);
  });

  it('deux appels donnent des résultats différents', () => {
    const pwd1 = generatePassword(8);
    const pwd2 = generatePassword(8);
    expect(pwd1).not.toBe(pwd2);
  });

});