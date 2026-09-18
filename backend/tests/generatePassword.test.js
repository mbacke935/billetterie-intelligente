const generatePassword = require('../utils/generatePassword');

describe('Test unitaire - generatePassword', () => {
    test('devrait générer un mot de passe de 8 caractères par défaut', () => {
        const password = generatePassword();
        expect(password).toBeDefined();
        expect(password).toHaveLength(8);
        expect(typeof password).toBe('string');
    });

    test('devrait générer un mot de passe de la longueur spécifiée', () => {
        const lengths = [5, 12, 16, 20];
        lengths.forEach(len => {
            const password = generatePassword(len);
            expect(password).toHaveLength(len);
        });
    });

    test('devrait uniquement contenir des caractères autorisés', () => {
        const caracteresAutorises = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
        const password = generatePassword(50);
        
        for (let i = 0; i < password.length; i++) {
            expect(caracteresAutorises.includes(password[i])).toBe(true);
        }
    });

    test('devrait générer des mots de passe différents à chaque appel', () => {
        const pwd1 = generatePassword();
        const pwd2 = generatePassword();
        expect(pwd1).not.toBe(pwd2);
    });
});
