from sqlalchemy.orm import Session
from datetime import date
from typing import List, Dict, Optional
import pandas as pd
import numpy as np
from ..models import financeiro_model as models
from .. import schemas
from .ativo_sintetico_controller import get_ativo_por_nome

def get_primeira_cotacao_anterior(db: Session, indice: str, data_referencia: date) -> Optional[models.IndiceFinanceiro]:
    return db.query(models.IndiceFinanceiro).filter(
        models.IndiceFinanceiro.indice == indice,
        models.IndiceFinanceiro.data_referencia < data_referencia
    ).order_by(models.IndiceFinanceiro.data_referencia.desc()).first()

def get_cotacoes(db: Session, indice: str, data_inicial: date, data_final: date):
    return db.query(models.IndiceFinanceiro).filter(
        models.IndiceFinanceiro.indice == indice,
        models.IndiceFinanceiro.data_referencia >= data_inicial,
        models.IndiceFinanceiro.data_referencia <= data_final
    ).order_by(models.IndiceFinanceiro.data_referencia).all()

def calcular_rentabilidade_acumulada(db: Session, indice_nome: str, data_inicial: date, data_final: date) -> schemas.RentabilidadeResponse:
    ativo_sintetico = get_ativo_por_nome(db, indice_nome)

    indice_base_nome = indice_nome
    spread_anual = 0.0
    
    if ativo_sintetico:
        indice_base_nome = ativo_sintetico.indice_base
        spread_anual = ativo_sintetico.spread

    cotacoes_periodo = get_cotacoes(db, indice_base_nome, data_inicial, data_final)
    
    if not cotacoes_periodo:
        return schemas.RentabilidadeResponse(rentabilidade_acumulada=0.0, rentabilidades_mensais=[], rentabilidades_anuais=[])

    cotacao_marco_zero = get_primeira_cotacao_anterior(db, indice_base_nome, data_inicial)

    if cotacao_marco_zero:
        cotacoes_completas = [cotacao_marco_zero] + cotacoes_periodo
    else:
        cotacoes_completas = cotacoes_periodo
    
    df = pd.DataFrame([(c.data_referencia, c.cotacao) for c in cotacoes_completas], columns=['data', 'cotacao'])
    df['data'] = pd.to_datetime(df['data'])
    df = df.set_index('data')

    cotacoes_mensais = df['cotacao'].resample('ME').last().dropna()

    if len(cotacoes_mensais) < 2:
        return schemas.RentabilidadeResponse(rentabilidade_acumulada=0.0, rentabilidades_mensais=[], rentabilidades_anuais=[])

    rentabilidades_base_mensais = cotacoes_mensais.pct_change().dropna()

    if ativo_sintetico:
        spread_mensal = (1 + spread_anual)**(1/12) - 1
        fator_base = 1 + rentabilidades_base_mensais
        fator_spread = 1 + spread_mensal
        fator_final = fator_base * fator_spread
        rentabilidades_finais_mensais = fator_final - 1
    else:
        rentabilidades_finais_mensais = rentabilidades_base_mensais
    
    rentabilidades_mensais_schema = []
    for dt, rentabilidade in rentabilidades_finais_mensais.items():
        if pd.notna(rentabilidade):
             rentabilidades_mensais_schema.append(
                 schemas.RentabilidadeMensal(ano=dt.year, mes=dt.month, rentabilidade=rentabilidade)
             )
        
    rentabilidade_acumulada = np.prod(1 + rentabilidades_finais_mensais) - 1

    rentabilidades_anuais_dict: Dict[int, float] = {}
    for rent in rentabilidades_mensais_schema:
        rentabilidades_anuais_dict.setdefault(rent.ano, 1.0)
        rentabilidades_anuais_dict[rent.ano] *= (1 + rent.rentabilidade)
    
    rentabilidades_anuais = [
        schemas.RentabilidadeAnual(ano=ano, rentabilidade=total - 1)
        for ano, total in rentabilidades_anuais_dict.items()
    ]
    
    return schemas.RentabilidadeResponse(
        rentabilidade_acumulada=rentabilidade_acumulada,
        rentabilidades_mensais=rentabilidades_mensais_schema,
        rentabilidades_anuais=rentabilidades_anuais
    )