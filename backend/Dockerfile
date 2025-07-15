# Estágio 1: Build - Usando Python 3.13
FROM python:3.13-slim as builder

WORKDIR /usr/src/app

# Copia e instala as dependências Python
COPY requirements.txt ./
RUN pip wheel --no-cache-dir --wheel-dir /usr/src/app/wheels -r requirements.txt

# Estágio 2: Produção - Usando a mesma versão do Python
FROM python:3.13-slim

WORKDIR /code

# Copia as dependências pré-compiladas do estágio builder
COPY --from=builder /usr/src/app/wheels /wheels
COPY --from=builder /usr/src/app/requirements.txt .

# Instala as dependências a partir dos wheels, o que é mais rápido
RUN pip install --no-cache /wheels/*

# Copia o código da aplicação
COPY ./app /code/app

# Expõe a porta que a aplicação vai rodar
EXPOSE 8000

# Comando para rodar a aplicação com Uvicorn
# O host 0.0.0.0 torna a aplicação acessível de fora do container
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]