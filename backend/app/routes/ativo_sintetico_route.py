from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from .. import schemas
from ..database import get_db
from ..controllers import ativo_sintetico_controller as controller

router = APIRouter(
    prefix="/api/ativos-sinteticos",
    tags=["Ativos Sintéticos"]
)

@router.post("/", response_model=schemas.AtivoSintetico, status_code=status.HTTP_201_CREATED)
def criar_ativo_sintetico(ativo: schemas.AtivoSinteticoCreate, db: Session = Depends(get_db)):
    """Informações importantes: 

        1) O nome do ativo deve ser único.
        2) Índices disponíveis: CDI, Ibovespa e IPCA.
        3) O spread é um valor percentual anual que será aplicado ao rendimento do ativo.
    """
    db_ativo = controller.get_ativo_por_nome(db, nome=ativo.nome)
    errors = []
    if db_ativo:
        errors.append("Ativo com este nome já existe")
    if ativo.spread < 0:
        errors.append("O spread não pode ser negativo")
    if ativo.indice_base not in {"CDI", "Ibovespa", "IPCA"}:
        errors.append("Índice base inválido. Deve ser CDI, Ibovespa ou IPCA")
    if errors:
        raise HTTPException(status_code=400, detail=f"Erros encontrados: {', '.join(errors)}")
    return controller.criar_ativo(db=db, ativo=ativo)

@router.get("/", response_model=List[schemas.AtivoSintetico])
def get_ativos_sinteticos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return controller.get_todos_ativos(db, skip=skip, limit=limit)

@router.put("/{ativo_id}", response_model=schemas.AtivoSintetico)
def update_ativo_sintetico(ativo_id: int, ativo: schemas.AtivoSinteticoUpdate, db: Session = Depends(get_db)):
    db_ativo = controller.update_ativo(db, ativo_id, ativo)
    if db_ativo is None:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return db_ativo

@router.delete("/{ativo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ativo_sintetico(ativo_id: int, db: Session = Depends(get_db)):
    db_ativo = controller.delete_ativo(db, ativo_id)
    if db_ativo is None:
        raise HTTPException(status_code=404, detail="Ativo não encontrado")
    return {"ok": True}