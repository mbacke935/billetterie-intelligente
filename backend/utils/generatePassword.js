const generatePassword = (longueur = 8) => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$!';
    let motDePasse = '';

    for (let i = 0; i < longueur; i++) {
        const index = Math.floor(Math.random() * caracteres.length);
        motDePasse += caracteres[index];
    }

    return motDePasse;
};

module.exports = generatePassword;