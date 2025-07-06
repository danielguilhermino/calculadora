from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date
from .. import schemas
from ..database import get_db
from ..controllers import rentabilidade_controller as controller

router = APIRouter(
    prefix="/api/rentabilidade",
    tags=["Rentabilidade"]
)

@router.get("/", response_model=schemas.RentabilidadeResponse)
def get_rentabilidade(
    indice: str = Query(..., description="CDI, Ibovespa, IPCA ou Nome do Ativo Sintético"),
    data_inicial: date = Query(..., description="Data inicial no formato YYYY-MM-DD"),
    data_final: date = Query(..., description="Data final no formato YYYY-MM-DD"),
    db: Session = Depends(get_db)
):
    try:
        resultado = controller.calcular_rentabilidade_acumulada(db, indice, data_inicial, data_final)
        return resultado
    except Exception as e:
        """
        Preciso guardar o erro em log para análise posterior, mas não quero expor detalhes técnicos ao usuário.
        """
        raise HTTPException(status_code=500, detail=f"Ocorreu um erro interno: {e}")