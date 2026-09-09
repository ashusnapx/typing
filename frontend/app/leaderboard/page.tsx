'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { useLeaderboard, useMyRank, useLeaderboardStates } from '@/lib/queries';
import { useAuthStore } from '@/store/auth-store';
import type { LeaderboardRow } from '@/src/server/trpc/routers/leaderboard';

/**
 * The board.
 *
 * This page was `return null` — linked from the navbar and the footer, and
 * rendering nothing at all. What sat behind it read from a Redis sorted set
 * that production does not have, and decorated the rows from three columns on
 * `users` that nothing writes, so there was nothing to render either.
 *
 * It is built from the attempts now, and it ranks on attempts that cleared
 * their bar rather than on raw speed — the exam is a pass or a fail, and a
 * board that puts a fast, inaccurate typist above someone who actually passed
 * teaches the wrong lesson to the people reading it.
 */

function Row({ row, isMe }: { row: LeaderboardRow; isMe: boolean }) {
  return (
    <li
      className={`flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 sm:px-5 ${
        isMe ? 'bg-accent-soft' : ''
      }`}
    >
      <span className="tnum w-8 shrink-0 text-base font-semibold text-vast/60">
        {row.rank}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-base font-semibold">
            {row.fullName}
            {isMe && <span className="ml-2 text-[13px] font-normal text-vast/60">you</span>}
          </span>
          {row.qualified && (
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-vast text-white"
              title="Has cleared the bar for their post"
            >
              <Check className="h-2.5 w-2.5" strokeWidth={4} aria-hidden />
              <span className="sr-only">cleared</span>
            </span>
          )}
        </span>
        <span className="block truncate text-[13px] text-vast/50">
          {row.state ?? '—'} · {row.testsTaken} test{row.testsTaken === 1 ? '' : 's'}
        </span>
      </span>

      <span className="tnum shrink-0 text-right">
        <span className="block text-base font-semibold">{row.bestWpm.toFixed(1)} WPM</span>
        <span className="block text-[13px] text-vast/50">{row.bestAccuracy.toFixed(1)}%</span>
      </span>
    </li>
  );
}

export default function LeaderboardPage() {
  const [state, setState] = useState<string | undefined>(undefined);
  const { data: rows, isLoading } = useLeaderboard(state);
  const { data: me } = useMyRank();
  const { data: states } = useLeaderboardStates();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const list = rows ?? [];
  const meInList = me ? list.some((r) => r.userId === me.userId) : false;

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12 sm:px-8 sm:py-16">
      <h1 className="text-5xl sm:text-6xl">Leaderboard</h1>
      <p className="mt-4 max-w-lg text-lg text-vast/60">
        Ranked on the fastest attempt that cleared its bar. Speed alone does not
        count.
      </p>

      {(states?.length ?? 0) > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          <button
            onClick={() => setState(undefined)}
            aria-pressed={state === undefined}
            className={`btn btn-sm ${state === undefined ? 'btn-ink' : 'btn-outline'}`}
          >
            All India
          </button>
          {states!.map((s) => (
            <button
              key={s}
              onClick={() => setState(s)}
              aria-pressed={state === s}
              className={`btn btn-sm ${state === s ? 'btn-ink' : 'btn-outline'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="card mt-8 overflow-hidden">
        {isLoading ? (
          <p className="px-5 py-10 text-center text-base text-vast/50">Loading…</p>
        ) : list.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-base text-vast/60">
              {state
                ? `Nobody from ${state} has taken a test yet.`
                : 'Nobody has taken a test yet. Be the first.'}
            </p>
            <Link href="/exam" className="btn btn-primary btn-md mt-5 inline-flex">
              Take a test
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden />
            </Link>
          </div>
        ) : (
          <ul className="divide-y-2 divide-vast/10">
            {list.map((row) => (
              <Row key={row.userId} row={row} isMe={me?.userId === row.userId} />
            ))}
          </ul>
        )}
      </div>

      {/* A board you cannot find yourself on is no use to the person it is
          meant to motivate, so an unlisted candidate gets their own row. */}
      {me && !meInList && (
        <div className="card mt-4 overflow-hidden">
          <ul>
            <Row row={me} isMe />
          </ul>
        </div>
      )}

      {isAuthenticated && !me && !isLoading && (
        <p className="mt-4 text-base text-vast/55">
          Take a full test and you will appear here.
        </p>
      )}
    </div>
  );
}
