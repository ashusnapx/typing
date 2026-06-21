import time
import secrets
import uuid


def uuid7() -> uuid.UUID:
    ts_ms = int(time.time() * 1000)
    rand_a = secrets.randbits(12)
    rand_b = secrets.randbits(62)

    uuid_int = (ts_ms << 80) | (7 << 76) | (rand_a << 64) | (2 << 62) | rand_b

    return uuid.UUID(int=uuid_int)
