from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.passage import Passage, PassageCategory, PassageDifficulty, PassageLanguage
from uuid import UUID


class PassageService:
    async def get_passage(self, db: AsyncSession, passage_id: UUID) -> Optional[Passage]:
        result = await db.execute(select(Passage).where(Passage.id == passage_id, Passage.is_active == True))
        return result.scalar_one_or_none()

    async def get_passages(
        self,
        db: AsyncSession,
        category: Optional[PassageCategory] = None,
        difficulty: Optional[PassageDifficulty] = None,
        language: Optional[PassageLanguage] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Passage]:
        query = select(Passage).where(Passage.is_active == True)

        if category:
            query = query.where(Passage.category == category)
        if difficulty:
            query = query.where(Passage.difficulty == difficulty)
        if language:
            query = query.where(Passage.language == language)

        query = query.order_by(Passage.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()

    async def get_random_passage(
        self,
        db: AsyncSession,
        category: PassageCategory = PassageCategory.SSC_CHSL,
        difficulty: PassageDifficulty = PassageDifficulty.MEDIUM,
    ) -> Optional[Passage]:
        query = select(Passage).where(
            Passage.is_active == True,
            Passage.category == category,
            Passage.difficulty == difficulty,
        ).order_by(func.random()).limit(1)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    async def create_passage(self, db: AsyncSession, data: dict) -> Passage:
        passage = Passage(**data)
        db.add(passage)
        await db.flush()
        await db.refresh(passage)
        return passage

    async def increment_usage(self, db: AsyncSession, passage_id: UUID):
        passage = await self.get_passage(db, passage_id)
        if passage:
            passage.times_used += 1
            await db.flush()


passage_service = PassageService()
