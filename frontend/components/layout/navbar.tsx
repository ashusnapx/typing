'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LogOut,
  LayoutDashboard,
  BarChart3,
  Shield,
  Menu,
  X,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useTypingStore } from '@/store/typing-store';
import { APP } from '@/lib/config';

/** The two things a visitor is here to do. Everything else lives further in. */
const PRIMARY = [
  { href: '/exam', label: 'Tests' },
  { href: '/learn', label: 'Learn' },
] as const;

const SECONDARY = [
  { href: '/coach', label: 'Coach' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/faq', label: 'FAQ' },
] as const;

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const navHidden = useTypingStore((s) => s.navHidden);

  const closeMobile = useCallback(() => setShowMobileMenu(false), []);

  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  useEffect(() => {
    if (!showUserMenu) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setShowUserMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowUserMenu(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [showUserMenu]);

  // Sign-in and sign-up are focused, single-task screens: the split layout
  // carries its own mark, and site navigation only invites people away from
  // the form they came to fill in.
  if (navHidden || pathname.startsWith('/auth/')) return null;

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const userLinks =
    isAuthenticated && user
      ? [
          { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
          ...(user.role === 'admin'
            ? [{ href: '/admin', label: 'Admin', icon: Shield }]
            : []),
        ]
      : [];

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
      {/* A floating capsule rather than a full-width bar — the cream ground
          shows around it, which is what makes the chrome feel light. */}
      <nav className="mx-auto flex w-full max-w-content items-center gap-3 rounded-2xl border-2 border-vast bg-lumen px-3 py-2.5 sm:gap-4 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src={APP.logo}
            alt=""
            width={30}
            height={30}
            className="h-[30px] w-[30px] rounded-md"
            priority
          />
          <span className="font-display text-xl leading-none tracking-tight">
            {APP.name}
          </span>
        </Link>

        {/* Segmented pill for the two primary destinations. */}
        <div className="segment hidden md:inline-flex">
          {PRIMARY.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              data-active={isActive(l.href)}
              className="segment-item"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="ml-auto hidden items-center gap-5 md:flex">
          {SECONDARY.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-base transition-colors hover:text-vast ${
                isActive(l.href) ? 'text-vast' : 'text-vast/60'
              }`}
            >
              {l.label}
            </Link>
          ))}

          {isAuthenticated && user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowUserMenu((v) => !v)}
                aria-expanded={showUserMenu}
                aria-haspopup="menu"
                className="btn btn-cream btn-sm gap-2"
              >
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-dawn text-[10px] font-bold">
                  {(user.full_name || 'U').charAt(0).toUpperCase()}
                </span>
                <span className="max-w-[8rem] truncate">{user.full_name}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform ${showUserMenu ? 'rotate-180' : ''}`}
                  strokeWidth={2}
                />
              </button>

              {showUserMenu && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border-2 border-vast bg-lumen p-1"
                >
                  <div className="border-b-2 border-vast/10 px-3 py-2.5">
                    <p className="truncate text-sm font-semibold">
                      {user.full_name}
                    </p>
                    <p className="mt-0.5 text-xs text-vast/50">
                      Level {user.level} · <span className="tnum">{user.xp} XP</span>
                    </p>
                  </div>
                  {userLinks.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      role="menuitem"
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-vast/5"
                    >
                      <l.icon className="h-4 w-4" strokeWidth={1.8} />
                      {l.label}
                    </Link>
                  ))}
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                      router.push('/');
                    }}
                    role="menuitem"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-err transition-colors hover:bg-err-bg"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.8} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/auth/login" className="text-base text-vast/60 transition-colors hover:text-vast">
                Sign in
              </Link>
              <Link href="/exam/chsl" className="btn btn-primary btn-sm">
                Start free test
              </Link>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowMobileMenu((v) => !v)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border-2 border-vast md:hidden"
          aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
          aria-expanded={showMobileMenu}
        >
          {showMobileMenu ? (
            <X className="h-4 w-4" strokeWidth={2.5} />
          ) : (
            <Menu className="h-4 w-4" strokeWidth={2.5} />
          )}
        </button>
      </nav>

      {showMobileMenu && (
        <div className="fixed inset-x-0 bottom-0 top-[76px] z-40 overflow-y-auto bg-lumen px-5 py-6 md:hidden">
          <div className="space-y-1">
            {[...PRIMARY, ...SECONDARY].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={closeMobile}
                className={`block rounded-xl px-4 py-3 font-display text-3xl transition-colors ${
                  isActive(l.href) ? 'bg-dawn' : ''
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {isAuthenticated && user ? (
            <div className="mt-6 space-y-1 border-t-2 border-vast/10 pt-6">
              <div className="flex items-center gap-3 px-4 pb-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-vast bg-dawn text-sm font-bold">
                  {(user.full_name || 'U').charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{user.full_name}</p>
                  <p className="text-xs text-vast/50">
                    Level {user.level} · <span className="tnum">{user.xp} XP</span>
                  </p>
                </div>
              </div>
              {userLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={closeMobile}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                >
                  <l.icon className="h-4 w-4" strokeWidth={1.8} />
                  {l.label}
                </Link>
              ))}
              <button
                onClick={() => {
                  logout();
                  closeMobile();
                  router.push('/');
                }}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-err"
              >
                <LogOut className="h-4 w-4" strokeWidth={1.8} />
                Sign out
              </button>
            </div>
          ) : (
            <div className="mt-6 space-y-3 border-t-2 border-vast/10 pt-6">
              <Link
                href="/exam/chsl"
                onClick={closeMobile}
                className="btn btn-primary btn-lg w-full"
              >
                Start free test
              </Link>
              <Link
                href="/auth/login"
                onClick={closeMobile}
                className="btn btn-outline btn-lg w-full"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
