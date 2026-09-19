FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
# logs/ est exclu du build (voir .dockerignore, .gitignore) : le dossier doit néanmoins
# exister pour que winston-daily-rotate-file puisse y écrire.
RUN mkdir -p logs

EXPOSE 5002

CMD ["npm", "start"]
