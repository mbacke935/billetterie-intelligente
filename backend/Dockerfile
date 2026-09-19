# Utilise l'image officielle Node.js version 22 basée sur Alpine (version légère et sécurisée)
FROM node:22-alpine

# Définit le répertoire de travail /app comme dossier principal à l'intérieur du conteneur
WORKDIR /app

# Copie les fichiers de description des dépendances (package.json et package-lock.json)
COPY package*.json ./

# Installe uniquement les dépendances nécessaires à la production pour alléger l'image
RUN npm ci --omit=dev

# Copie l'ensemble du code source du backend dans le conteneur
COPY . .

# Indique que le conteneur écoute sur le port 8000
EXPOSE 8000

# Définit la commande par défaut pour lancer l'application Node.js au démarrage
CMD ["npm", "start"]