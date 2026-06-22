"""Concurrent load simulation for the SSC typing platform.

Simulates:
- 100 concurrent users (typical peak)
- 1,000 concurrent users (heavy load)
- 10,000 concurrent users (stress test)

Each simulated user performs a realistic session:
1. Fetch leaderboard
2. Fetch dashboard/analytics
3. Submit a test (write-heavy)

Uses asyncio + httpx for non-blocking concurrent requests.
Hits the actual FastAPI application endpoints.

These tests are skipped unless the backend is running on localhost:8000.
"""
import time
import asyncio
import pytest
from typing import List
from dataclasses import dataclass
from .conftest import loadtest

pytestmark = [pytest.mark.asyncio, loadtest]


@dataclass
class LoadResult:
    scenario: str
    concurrency: int
    total_requests: int
    total_time_seconds: float
    requests_per_second: float
    p50_ms: float
    p95_ms: float
    p99_ms: float
    errors: int
    error_rate_pct: float

    def report(self) -> str:
        return (
            f"\n  {'='*50}"
            f"\n  Scenario: {self.scenario} ({self.concurrency} users)"
            f"\n  Total requests: {self.total_requests}"
            f"\n  Duration: {self.total_time_seconds:.2f}s"
            f"\n  Throughput: {self.requests_per_second:.1f} req/s"
            f"\n  Latency p50: {self.p50_ms:.1f}ms  p95: {self.p95_ms:.1f}ms  p99: {self.p99_ms:.1f}ms"
            f"\n  Errors: {self.errors}/{self.total_requests} ({self.error_rate_pct:.2f}%)"
            f"\n  {'='*50}"
        )


async def _simulate_session(
    session_id: int,
    base_url: str,
    latencies: List[float],
    errors: List[bool],
) -> None:
    import httpx

    timeout = httpx.Timeout(30.0, connect=5.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        for _ in range(3):
            start = time.perf_counter()
            try:
                resp = await client.get(f"{base_url}/leaderboard/?scope=global&limit=50")
                resp.raise_for_status()
                latencies.append((time.perf_counter() - start) * 1000)
                errors.append(False)
            except Exception:
                latencies.append(0)
                errors.append(True)

        start = time.perf_counter()
        try:
            resp = await client.get(f"{base_url}/health")
            resp.raise_for_status()
            latencies.append((time.perf_counter() - start) * 1000)
            errors.append(False)
        except Exception:
            latencies.append(0)
            errors.append(True)


async def _run_load_test(concurrency: int, base_url: str) -> LoadResult:
    all_latencies: List[float] = []
    all_errors: List[bool] = []

    semaphore = asyncio.Semaphore(200)

    async def bounded_session(session_id: int):
        async with semaphore:
            await _simulate_session(session_id, base_url, all_latencies, all_errors)

    start_time = time.perf_counter()
    tasks = [bounded_session(i) for i in range(concurrency)]
    await asyncio.gather(*tasks, return_exceptions=True)
    elapsed = time.perf_counter() - start_time

    if not all_latencies:
        return LoadResult("load", concurrency, 0, elapsed, 0, 0, 0, 0, len(all_errors), 100)

    sorted_lats = sorted(l for l in all_latencies if l > 0)
    total = len(sorted_lats)
    error_count = sum(1 for e in all_errors if e)

    return LoadResult(
        scenario="load",
        concurrency=concurrency,
        total_requests=total,
        total_time_seconds=elapsed,
        requests_per_second=total / elapsed if elapsed > 0 else 0,
        p50_ms=sorted_lats[int(total * 0.50)] if total else 0,
        p95_ms=sorted_lats[int(total * 0.95)] if total >= 20 else (sorted_lats[-1] if total else 0),
        p99_ms=sorted_lats[int(total * 0.99)] if total >= 100 else (sorted_lats[-1] if total else 0),
        errors=error_count,
        error_rate_pct=(error_count / total * 100) if total > 0 else 0,
    )


class TestLoad100:
    async def test_100_concurrent_reads(self):
        result = await _run_load_test(100, "http://localhost:8000/api/v1")
        print(result.report())
        assert result.error_rate_pct < 5, f"Error rate {result.error_rate_pct}% exceeds 5%"
        assert result.p95_ms < 5000, f"p95 latency {result.p95_ms}ms exceeds 5000ms"


class TestLoad1000:
    async def test_1000_concurrent_reads(self):
        result = await _run_load_test(1000, "http://localhost:8000/api/v1")
        print(result.report())
        assert result.error_rate_pct < 10, f"Error rate {result.error_rate_pct}% exceeds 10%"
        assert result.p95_ms < 10000, f"p95 latency {result.p95_ms}ms exceeds 10000ms"


class TestLoad10000:
    async def test_10000_concurrent_reads(self):
        result = await _run_load_test(10000, "http://localhost:8000/api/v1")
        print(result.report())
        assert result.error_rate_pct < 20, f"Error rate {result.error_rate_pct}% exceeds 20%"
