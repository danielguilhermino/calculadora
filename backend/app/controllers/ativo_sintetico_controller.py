from sqlalchemy.orm import Session
from ..models import financeiro_model as models
from .. import schemas

def get_ativo_por_id(db: Session, ativo_id: int):
    return db.query(models.AtivoSintetico).filter(models.AtivoSintetico.id == ativo_id).first()

def get_ativo_por_nome(db: Session, nome: str):
    return db.query(models.AtivoSintetico).filter(models.AtivoSintetico.nome == nome).first()

def get_all_ativos(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.AtivoSintetico).offset(skip).limit(limit).all()

def create_ativo(db: Session, ativo: schemas.AtivoSinteticoCreate):
    spread_decimal = ativo.spread / 100.0
    
    db_ativo = models.AtivoSintetico(
        nome=ativo.nome,
        indice_base=ativo.indice_base,
        spread=spread_decimal
    )
    db.add(db_ativo)
    db.commit()
    db.refresh(db_ativo)
    return db_ativo

def update_ativo(db: Session, ativo_id: int, ativo_update: schemas.AtivoSinteticoUpdate):
    db_ativo = get_ativo_por_id(db, ativo_id)
    if db_ativo:
        update_data = ativo_update.dict(exclude_unset=True)
        
        if 'spread' in update_data:
            update_data['spread'] = update_data['spread'] / 100.0
        
        for key, value in update_data.items():
            setattr(db_ativo, key, value)
        db.commit()
        db.refresh(db_ativo)
    return db_ativo

def delete_ativo(db: Session, ativo_id: int):
    db_ativo = get_ativo_por_id(db, ativo_id)
    if db_ativo:
        db.delete(db_ativo)
        db.commit()
    return db_ativo