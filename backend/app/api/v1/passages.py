from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.passage import Passage, PassageCategory, PassageDifficulty, PassageLanguage
from app.schemas.passage import PassageCreate, PassageResponse, PassageListResponse
from app.api.deps import get_current_user, get_admin_user
from app.models.user import User
from app.services.passage_service import passage_service
from typing import Optional, List
from uuid import UUID

router = APIRouter()


@router.get("/", response_model=List[PassageListResponse])
async def list_passages(
    category: Optional[PassageCategory] = None,
    difficulty: Optional[PassageDifficulty] = None,
    language: Optional[PassageLanguage] = None,
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    passages = await passage_service.get_passages(db, category, difficulty, language, limit, offset)
    return passages


@router.get("/random", response_model=PassageResponse)
async def get_random_passage(
    category: PassageCategory = PassageCategory.SSC_CHSL,
    difficulty: PassageDifficulty = PassageDifficulty.MEDIUM,
    db: AsyncSession = Depends(get_db),
):
    passage = await passage_service.get_random_passage(db, category, difficulty)
    if not passage:
        raise HTTPException(status_code=404, detail="No passage found")
    return passage


@router.get("/{passage_id}", response_model=PassageResponse)
async def get_passage(passage_id: UUID, db: AsyncSession = Depends(get_db)):
    passage = await passage_service.get_passage(db, passage_id)
    if not passage:
        raise HTTPException(status_code=404, detail="Passage not found")
    return passage


@router.post("/", response_model=PassageResponse)
async def create_passage(
    data: PassageCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_admin_user),
):
    passage = await passage_service.create_passage(db, data.model_dump())
    return passage
