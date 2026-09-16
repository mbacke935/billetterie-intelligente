const dns = require('dns');
const mongoose = require('mongoose');

// Sur Windows, le proxy DNS local installé par le partage de connexion (ICS) pour
// Hyper-V/WSL (127.0.0.1:53) refuse les requêtes DNS de type SRV, ce dont a besoin
// une URI mongodb+srv://. On force donc Node à interroger directement un résolveur
// public pour ses propres résolutions DNS, sans toucher à la configuration système.
if (process.platform === 'win32') {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
}

const connectDB = async() => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB connecté : ${conn.connection.host}`);
    } catch (error) {
        console.error(`Erreur de connexion : ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;