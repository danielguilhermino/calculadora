from sqlalchemy import Column, Integer, String, Float, Date
from ..database import Base

class IndiceFinanceiro(Base):
    __tablename__ = "indices_financeiros"
    
    id = Column(Integer, primary_key=True, index=True)
    data_referencia = Column(Date, nullable=False, index=True)
    indice = Column(String, index=True, nullable=False)
    cotacao = Column(Float, nullable=False)

class AtivoSintetico(Base):
    __tablename__ = "ativos_sinteticos"
    
    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String, unique=True, index=True, nullable=False)
    indice_base = Column(String, nullable=False)
    spread = Column(Float, nullable=False)