from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any

from database import get_db
from app.schemas.area import AreaResponse, AreaCreate, AreaUpdate
from app.services.area import area_service

router = APIRouter()

@router.get("/", response_model=list[AreaResponse])
def read_areas(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    return area_service.get_areas(db, skip=skip, limit=limit)

@router.post("/", response_model=AreaResponse, status_code=status.HTTP_201_CREATED)
def create_area(
    *,
    db: Session = Depends(get_db),
    area_in: AreaCreate,
) -> Any:
    return area_service.create_area(db, area_in=area_in)

@router.put("/{area_id}", response_model=AreaResponse)
def update_area(
    *,
    db: Session = Depends(get_db),
    area_id: int,
    area_in: AreaUpdate,
) -> Any:
    return area_service.update_area(db, area_id=area_id, area_in=area_in)

@router.delete("/{area_id}", response_model=AreaResponse)
def delete_area(
    *,
    db: Session = Depends(get_db),
    area_id: int,
) -> Any:
    return area_service.delete_area(db, area_id=area_id)
