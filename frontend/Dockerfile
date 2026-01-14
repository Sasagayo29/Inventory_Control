# --- Estágio 1: Build do Angular ---
# CORREÇÃO: Mudamos de node:18 para node:22 para atender os requisitos do Angular novo
FROM node:22 as build

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia código e faz o build
COPY . .
RUN npm run build -- --configuration production

# --- Estágio 2: Servidor Nginx ---
FROM nginx:alpine

# Copia os arquivos compilados do estágio anterior
# Nota: O Angular moderno gera arquivos em dist/frontend/browser
COPY --from=build /app/dist/*/browser /usr/share/nginx/html

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]