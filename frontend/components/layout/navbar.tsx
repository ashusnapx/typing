'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/store/auth-store';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, LogOut, LayoutDashboard, BarChart3, Shield } from 'lucide-react';

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  return (
    <nav className="sticky top-0 z-50 border-b-2 border-pencil bg-paper">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex justify-between h-16 items-center">
          <Link
            href="/"
            className="flex items-center space-x-3 -rotate-1 hover:rotate-0 transition-transform duration-100"
          >
            <Image
              src="/images/logo.jpg"
              alt="Maths Mania"
              width={40}
              height={40}
              className="w-10 h-10 border-2 border-pencil shadow-hard-sm"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            />
            <span className="text-2xl font-bold text-pencil font-marker">Maths Mania</span>
          </Link>

          <div className="hidden md:flex items-center space-x-2">
            <Link
              href="/exam/chsl"
              className="px-3 py-1.5 text-base text-pencil font-hand hover:bg-muted transition-colors"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              SSC CHSL
            </Link>
            <Link
              href="/exam/cgl-dest"
              className="px-3 py-1.5 text-base text-pencil font-hand hover:bg-muted transition-colors"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              SSC CGL
            </Link>
            <Link
              href="/exam/practice"
              className="px-3 py-1.5 text-base text-pencil font-hand hover:bg-muted transition-colors"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              Practice
            </Link>
            <Link
              href="/leaderboard"
              className="px-3 py-1.5 text-base text-pencil font-hand hover:bg-muted transition-colors"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              Leaderboard
            </Link>
            <Link
              href="/coach"
              className="px-3 py-1.5 text-base text-pencil font-hand hover:bg-muted transition-colors"
              style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            >
              AI Coach
            </Link>

            {isAuthenticated && user ? (
              <div className="relative ml-3">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center space-x-2 btn-hand-sm"
                >
                  <User className="w-4 h-4" strokeWidth={3} />
                  <span>{user.full_name}</span>
                  <span className="px-2 py-0.5 text-xs bg-pencil text-paper font-hand rounded-sm">
                    Lvl {user.level}
                  </span>
                </button>
                {showMenu && (
                  <div
                    className="absolute right-0 mt-2 w-48 bg-white border-2 border-pencil shadow-hard py-1"
                    style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                  >
                    <Link
                      href="/dashboard"
                      className="flex items-center space-x-2 px-4 py-2 text-base text-pencil font-hand hover:bg-muted"
                      onClick={() => setShowMenu(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" strokeWidth={2.5} />
                      <span>Dashboard</span>
                    </Link>
                    <Link
                      href="/dashboard/analytics"
                      className="flex items-center space-x-2 px-4 py-2 text-base text-pencil font-hand hover:bg-muted"
                      onClick={() => setShowMenu(false)}
                    >
                      <BarChart3 className="w-4 h-4" strokeWidth={2.5} />
                      <span>Analytics</span>
                    </Link>
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="flex items-center space-x-2 px-4 py-2 text-base text-pencil font-hand hover:bg-muted"
                        onClick={() => setShowMenu(false)}
                      >
                        <Shield className="w-4 h-4" strokeWidth={2.5} />
                        <span>Admin</span>
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setShowMenu(false);
                        router.push('/');
                      }}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 text-base text-accent font-hand hover:bg-muted"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={2.5} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-3">
                <Link href="/auth/login" className="btn-hand-sm">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-hand-sm bg-pencil text-paper hover:bg-accent">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
