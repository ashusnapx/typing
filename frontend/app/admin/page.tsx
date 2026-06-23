'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Shield, Users, Activity, BarChart3, Zap, TrendingUp } from 'lucide-react';
import { CSS, ROUTES } from '@/lib/config';

const wobbly = { borderRadius: CSS.radii.sm };

export default function AdminPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'super_admin')) {
        router.push(ROUTES.home);
      }
    }
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      api.request<any>('/admin/dashboard').then(setDashboard).catch(() => {});
      api.request<any[]>('/admin/users').then(setUsers).catch(() => {});
    }
  }, [isAuthenticated, user]);

  if (isLoading || !user) return null;

  return (
    <div className="min-h-screen bg-paper">
      <div className="bg-pencil text-paper px-6 py-4 border-b-2 border-pencil flex items-center space-x-3">
        <Shield className="w-6 h-6" strokeWidth={3} />
        <h1 className="text-xl font-bold font-marker">Admin Dashboard</h1>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {dashboard && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { value: dashboard.dau, label: 'Daily Active Users', icon: <Activity className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-1' },
              { value: dashboard.mau, label: 'Monthly Active Users', icon: <BarChart3 className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
              { value: dashboard.total_users, label: 'Total Users', icon: <Users className="w-5 h-5" strokeWidth={3} />, rotate: '-rotate-2' },
              { value: dashboard.active_tests, label: 'Active Tests', icon: <Zap className="w-5 h-5" strokeWidth={3} />, rotate: 'rotate-1' },
            ].map((stat) => (
              <div key={stat.label}
                   className={`bg-white border-2 border-pencil ${CSS.shadows.sm} p-4 text-center ${CSS.shadows.mdHover} transition-all`}
                   style={{ borderRadius: CSS.radii.md, transform: `rotate(${stat.rotate})` }}>
                <div className="flex justify-center mb-2 text-pencil">{stat.icon}</div>
                <div className="text-2xl font-bold text-pencil font-marker">{stat.value}</div>
                <div className="text-sm text-pencil/60 font-hand mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className={`bg-white border-2 border-pencil ${CSS.shadows.sm}`}>
          <div className="px-6 py-4 border-b-2 border-pencil bg-muted/30 flex items-center space-x-2">
            <Users className="w-5 h-5 text-pencil" strokeWidth={3} />
            <h2 className="text-lg font-bold font-marker text-pencil">Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="border-b-2 border-pencil">
                  <th className="text-left px-6 py-3 font-bold text-pencil/60 font-hand uppercase tracking-wider">Name</th>
                  <th className="text-left px-6 py-3 font-bold text-pencil/60 font-hand uppercase tracking-wider">Email</th>
                  <th className="text-left px-6 py-3 font-bold text-pencil/60 font-hand uppercase tracking-wider">Role</th>
                  <th className="text-right px-6 py-3 font-bold text-pencil/60 font-hand uppercase tracking-wider">Tests</th>
                  <th className="text-right px-6 py-3 font-bold text-pencil/60 font-hand uppercase tracking-wider">XP</th>
                  <th className="text-right px-6 py-3 font-bold text-pencil/60 font-hand uppercase tracking-wider">Premium</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-pencil/20 font-hand">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-bold text-pencil">{u.full_name}</td>
                    <td className="px-6 py-3 text-pencil/70">{u.email}</td>
                    <td className="px-6 py-3">
                      <span className="px-2 py-0.5 text-xs font-bold bg-muted border-2 border-pencil font-hand"
                            style={wobbly}>{u.role}</span>
                    </td>
                    <td className="px-6 py-3 text-right font-bold text-pencil">{u.total_tests_taken}</td>
                    <td className="px-6 py-3 text-right font-bold text-accent">{u.xp}</td>
                    <td className="px-6 py-3 text-right">
                      {u.is_premium
                        ? <span className="font-bold text-green-600">Yes</span>
                        : <span className="text-pencil/40">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
