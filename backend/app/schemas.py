from pydantic import BaseModel
from datetime import date
from typing import List, Optional

# --- Inicio Ativo Sintético---

class AtivoSinteticoBase(BaseModel):
    nome: str
    indice_base: str
    spread: float

class AtivoSinteticoCreate(AtivoSinteticoBase):
    pass

class AtivoSinteticoUpdate(AtivoSinteticoBase):
    pass

class AtivoSintetico(AtivoSinteticoBase):
    id: int
    
    class Config:
        orm_mode = True

# --- Inicio Rentabilidade ---

class RentabilidadeMensal(BaseModel):
    ano: int
    mes: int
    rentabilidade: float

class RentabilidadeAnual(BaseModel):
    ano: int
    rentabilidade: float

class RentabilidadeResponse(BaseModel):
    rentabilidade_acumulada: float
    rentabilidades_mensais: List[RentabilidadeMensal]
    rentabilidades_anuais: List[RentabilidadeAnual]