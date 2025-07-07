# Estágio 1: Build da aplicação React
# Usamos uma imagem Node.js para instalar as dependências e compilar o projeto.
FROM node:18-alpine as build

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de definição de pacotes
COPY package.json ./
COPY package-lock.json ./

# Instala todas as dependências do projeto
RUN npm install

# Copia todo o resto do código do projeto para o container
COPY . .

# Executa o script de build do React, que cria uma pasta 'build' com os arquivos estáticos
RUN npm run build

# ---

# Estágio 2: Servir os arquivos com Nginx
# Usamos uma imagem Nginx leve para servir os arquivos estáticos gerados no estágio anterior.
FROM nginx:stable-alpine

# Copia os arquivos de build do estágio anterior para a pasta padrão do Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Remove a configuração padrão do Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia nosso arquivo de configuração personalizado do Nginx para o container.
# Este arquivo é crucial para servir a aplicação React corretamente e redirecionar
# as chamadas de API para o backend.
COPY nginx.conf /etc/nginx/conf.d

# Expõe a porta 80, que é a porta padrão do Nginx
EXPOSE 80

# O comando para iniciar o servidor Nginx em modo foreground
CMD ["nginx", "-g", "daemon off;"]