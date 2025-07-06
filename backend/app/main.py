from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import OperationalError
import time
import pandas as pd
import os
from contextlib import asynccontextmanager

from .database import engine, SessionLocal, Base
from .models import financeiro_model
from .routes import ativo_sintetico_route, rentabilidade_route

def tentar_conectar_db():
    """Tenta conectar ao banco de dados com retentativas."""
    retentativas = 5
    delay = 5
    for i in range(retentativas):
        try:
            connection = engine.connect()
            connection.close()
            print("Conexão com o banco de dados bem-sucedida.")
            return True
        except OperationalError as e:
            print(f"Erro ao conectar ao banco de dados: {e}. Tentando novamente em {delay} segundos...")
            time.sleep(delay)
    print("Não foi possível conectar ao banco de dados após várias tentativas.")
    return False

def criar_tabelas():
    try:
        Base.metadata.create_all(bind=engine)
        print("Tabelas criadas com sucesso (se não existiam).")
    except Exception as e:
        print(f"Erro ao criar tabelas: {e}")

def carregar_csv():
    db = SessionLocal()
    try:
        if db.query(financeiro_model.IndiceFinanceiro).first() is None:
            csv_path = 'data/Series_02_07_2025_13_30_29.csv'
            if os.path.exists(csv_path):
                print("Tabela de índices vazia. Carregando dados do CSV...")
                df = pd.read_csv(csv_path, delimiter=';', dtype={'Cota/Preço de Fechamento Ajustados': str}, encoding='latin1')
                df['Cota/Preço de Fechamento Ajustados'] = df['Cota/Preço de Fechamento Ajustados'].str.replace('.', '', regex=False).str.replace(',', '.', regex=False)
                df['Cota/Preço de Fechamento Ajustados'] = pd.to_numeric(df['Cota/Preço de Fechamento Ajustados'], errors='coerce')
                df.rename(columns={'Data': 'data_referencia', 'Nome do Ativo': 'indice', 'Cota/Preço de Fechamento Ajustados': 'cotacao'}, inplace=True)
                df['data_referencia'] = pd.to_datetime(df['data_referencia'], dayfirst=True)
                df.to_sql(financeiro_model.IndiceFinanceiro.__tablename__, engine, if_exists='append', index=False)
                print("Dados carregados com sucesso.")
            else:
                print(f"Arquivo CSV não encontrado em: {csv_path}")
        else:
            print("A tabela de índices já contém dados. Nenhuma ação necessária.")
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Iniciando a aplicação, Go Go Go...")
    if tentar_conectar_db():
        criar_tabelas()
        carregar_csv()

    yield

    print("Finalizando a aplicação, obrigado pela visita! :)")


app = FastAPI(
    title="API de Ativos Financeiros", 
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ativo_sintetico_route.router)
app.include_router(rentabilidade_route.router)