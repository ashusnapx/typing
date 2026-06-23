'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import { useTypingStore } from '@/store/typing-store';
import { useState, useCallback, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { User, LogOut, LayoutDashboard, BarChart3, Shield, Menu, X, ChevronRight } from 'lucide-react';

const wobbly = { borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' };

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const navHidden = useTypingStore((s) => s.navHidden);

  const closeMobile = useCallback(() => setShowMobileMenu(false), []);

  useEffect(() => {
    if (showMobileMenu) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  if (navHidden) return null;

  const navLinks = [
    { href: '/exam/chsl', label: 'SSC CHSL' },
    { href: '/exam/cgl-dest', label: 'SSC CGL' },
    { href: '/exam/practice', label: 'Practice' },
    { href: '/learn', label: 'Learn' },
    { href: '/leaderboard', label: 'Leaderboard' },
    { href: '/coach', label: 'AI Coach' },
  ];

  const userLinks = isAuthenticated && user ? [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" strokeWidth={2.5} /> },
    { href: '/dashboard/analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" strokeWidth={2.5} /> },
    ...(user.role === 'admin' ? [{ href: '/admin', label: 'Admin', icon: <Shield className="w-4 h-4" strokeWidth={2.5} /> }] : []),
  ] : [];

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-pencil bg-paper">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          <Link
            href="/"
            className="flex items-center space-x-3 -rotate-1 hover:rotate-0 transition-transform duration-100"
          >
            <Image
              src="/images/logo.png?v=2"
              alt="Typing Mania"
              width={40}
              height={40}
              className="w-10 h-10 border-2 border-pencil shadow-hard-sm"
              style={wobbly}
            />
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold text-pencil font-marker -mb-1">Typing Mania</span>
              <span className="text-xs text-pencil/50 font-hand tracking-wide">by Maths Mania</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href}
                    className="px-3 py-1.5 text-base text-pencil font-hand hover:bg-muted transition-colors whitespace-nowrap"
                    style={wobbly}>
                {l.label}
              </Link>
            ))}
            <span className="w-px h-6 bg-pencil/20 mx-1" />
            {isAuthenticated && user ? (
              <div className="relative">
                <button onClick={() => setShowUserMenu(!showUserMenu)}
                        className="flex items-center space-x-2 btn-hand-sm">
                  <User className="w-4 h-4" strokeWidth={3} />
                  <span>{user.full_name}</span>
                  <span className="px-2 py-0.5 text-xs bg-pencil text-paper font-hand rounded-sm">Lvl {user.level}</span>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-pencil shadow-hard py-1" style={wobbly}>
                    {userLinks.map(l => (
                      <Link key={l.href} href={l.href}
                            className="flex items-center space-x-2 px-4 py-2 text-base text-pencil font-hand hover:bg-muted"
                            onClick={() => { setShowUserMenu(false); }}>
                        {l.icon}
                        <span>{l.label}</span>
                      </Link>
                    ))}
                    <button onClick={() => { logout(); setShowUserMenu(false); router.push('/'); }}
                            className="flex items-center space-x-2 w-full text-left px-4 py-2 text-base text-accent font-hand hover:bg-muted">
                      <LogOut className="w-4 h-4" strokeWidth={2.5} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/auth/login" className="btn-hand-sm" style={wobbly}>Login</Link>
                <Link href="/auth/register" className="btn-hand-sm bg-pencil text-paper hover:bg-accent" style={wobbly}>Register</Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setShowMobileMenu(!showMobileMenu)}
                  className="md:hidden flex items-center justify-center w-10 h-10 text-pencil hover:bg-muted transition-colors"
                  style={wobbly}
                  aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}>
            {showMobileMenu ? <X className="w-6 h-6" strokeWidth={3} /> : <Menu className="w-6 h-6" strokeWidth={3} />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 top-16 z-40 bg-paper/95 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-4 space-y-2">
            {/* Nav links */}
            <div className="bg-white border-2 border-pencil shadow-hard-sm divide-y-2 divide-pencil/20" style={wobbly}>
              {navLinks.map(l => (
                <Link key={l.href} href={l.href}
                      onClick={closeMobile}
                      className="flex items-center justify-between px-5 py-4 text-base text-pencil font-hand hover:bg-muted transition-colors">
                  <span>{l.label}</span>
                  <ChevronRight className="w-4 h-4 text-pencil/30" strokeWidth={3} />
                </Link>
              ))}
            </div>

            {/* User section */}
            <div className="bg-white border-2 border-pencil shadow-hard-sm" style={wobbly}>
              {isAuthenticated && user ? (
                <div className="divide-y-2 divide-pencil/20">
                  <div className="px-5 py-3 flex items-center space-x-3">
                    <div className="w-9 h-9 flex items-center justify-center border-2 border-pencil bg-muted" style={wobbly}>
                      <User className="w-5 h-5 text-pencil" strokeWidth={3} />
                    </div>
                    <div>
                      <div className="text-base font-bold text-pencil font-hand">{user.full_name}</div>
                      <div className="text-xs text-pencil/50 font-hand">Lvl {user.level} &middot; {user.xp} XP</div>
                    </div>
                  </div>
                  {userLinks.map(l => (
                    <Link key={l.href} href={l.href}
                          onClick={closeMobile}
                          className="flex items-center space-x-3 px-5 py-3 text-base text-pencil font-hand hover:bg-muted transition-colors">
                      {l.icon}
                      <span>{l.label}</span>
                    </Link>
                  ))}
                  <button onClick={() => { logout(); closeMobile(); router.push('/'); }}
                          className="flex items-center space-x-3 w-full text-left px-5 py-3 text-base text-accent font-hand hover:bg-muted transition-colors">
                    <LogOut className="w-4 h-4" strokeWidth={2.5} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  <Link href="/auth/login" onClick={closeMobile}
                        className="block w-full text-center px-4 py-3 border-2 border-pencil text-base font-hand text-pencil hover:bg-muted transition-colors" style={wobbly}>
                    Login
                  </Link>
                  <Link href="/auth/register" onClick={closeMobile}
                        className="block w-full text-center px-4 py-3 border-2 border-pencil text-base font-hand bg-pencil text-paper hover:bg-accent transition-colors" style={wobbly}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
