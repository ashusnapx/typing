import re
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
        is_ssc = category in (PassageCategory.SSC_CHSL, PassageCategory.SSC_CGL)

        if is_ssc:
            query = select(Passage).where(
                Passage.is_active == True,
                Passage.category == category,
                Passage.is_exam_length == True,
            )
            if difficulty:
                query = query.where(Passage.difficulty == difficulty)
            query = query.order_by(func.random()).limit(1)
            result = await db.execute(query)
            passage = result.scalar_one_or_none()
            if passage:
                return passage

        query = select(Passage).where(
            Passage.is_active == True,
            Passage.category == category,
        )
        if difficulty:
            query = query.where(Passage.difficulty == difficulty)
        query = query.order_by(func.random()).limit(1)
        result = await db.execute(query)
        return result.scalar_one_or_none()

    def _format_content(self, content: str, language: Optional[str] = None) -> str:
        if not content:
            return content
        if language == "hindi":
            return content.strip()

        text = content.strip()
        text = re.sub(r'  +', ' ', text)

        words = text.split()
        title_case_words = sum(1 for w in words if w and w[0].isupper() and len(w) > 1)
        total_words = len(words)

        if total_words >= 5 and title_case_words > total_words * 0.8:
            sentence_lowered = []
            for i, w in enumerate(words):
                if i == 0:
                    sentence_lowered.append(w[0].upper() + w[1:].lower() if len(w) > 1 else w.upper())
                else:
                    sentence_lowered.append(w.lower())
            text = ' '.join(sentence_lowered)

        if text and text[0].islower():
            text = text[0].upper() + text[1:]

        sentences = re.split(r'(?<=[.!?])\s+', text)
        formatted = []
        for s in sentences:
            s = s.strip()
            if s and not s[-1] in '.!?':
                s += '.'
            formatted.append(s)
        text = ' '.join(formatted)

        return text

    async def create_passage(self, db: AsyncSession, data: dict) -> Passage:
        for field in ("content", "content_hindi", "title"):
            if data.get(field):
                cleaned = re.sub(r'<[^>]*>', '', str(data[field]))
                cleaned = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', cleaned)
                cleaned = cleaned.replace("javascript:", "").replace("data:", "").replace("vbscript:", "")
                data[field] = cleaned[:10000]

        if data.get("content"):
            data["content"] = self._format_content(data["content"], data.get("language"))
        if data.get("content_hindi"):
            data["content_hindi"] = self._format_content(data["content_hindi"], "hindi")

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
