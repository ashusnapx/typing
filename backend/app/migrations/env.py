from alembic.config import Config
from alembic import command
from app.database import engine, Base
from app.models import *


async def run_migrations():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Database tables created successfully")


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_migrations())
