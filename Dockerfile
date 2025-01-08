# Usar una imagen base de Node.js
FROM node:23-slim

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar los archivos necesarios
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma

# Instalar dependencias
RUN npm install

# Copiar el resto del código de la aplicación
COPY . .

# Construir la app
RUN npm run build

# Exponer el puerto en el que la aplicación corre
EXPOSE 3000

# Comando para ejecutar la aplicación
CMD ["npm", "start"]