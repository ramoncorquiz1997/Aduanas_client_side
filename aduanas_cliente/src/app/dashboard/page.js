"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  TrendingUp,
  Package,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n) {
  return new Intl.NumberFormat('es-MX').format(n);
}

function fmtCurrency(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);
}

// Derive months from operations list
function buildMonthlyData(ops) {
  const map = {};
  ops.forEach((op) => {
    const raw = op.create_date || op.date_deadline || '';
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map[key] = (map[key] || 0) + 1;
  });

  const sorted = Object.keys(map).sort().slice(-6);
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  return sorted.map((key) => {
    const [, m] = key.split('-');
    return { mes: monthNames[parseInt(m, 10) - 1], pedimentos: map[key] };
  });
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ title, value, sub, icon: Icon, color, trend }) {
  const colors = {
    emerald: 'border-[#3D6332]/20 bg-[#3D6332]/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
  };
  const iconColors = {
    emerald: 'text-[#3D6332] bg-[#3D6332]/10',
    blue: 'text-blue-400 bg-blue-400/10',
    amber: 'text-amber-400 bg-amber-400/10',
    purple: 'text-purple-400 bg-purple-400/10',
  };

  return (
    <div className={`rounded-xl border ${colors[color]} p-5 flex flex-col gap-4`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        <div className={`p-2.5 rounded-lg ${iconColors[color]}`}>
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        {trend === 'up' && <ArrowUpRight size={14} className="text-[#3D6332]" />}
        {trend === 'down' && <ArrowDownRight size={14} className="text-red-400" />}
        <span>{sub}</span>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

function OpStatusBadge({ stage }) {
  const label = stage?.[1] || stage || 'Sin etapa';
  const colors = {
    ganado: 'bg-[#3D6332]/10 text-[#3D6332] border-[#3D6332]/20',
    perdido: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  const key = label.toLowerCase();
  const cls = colors[key] || 'bg-zinc-800 text-zinc-400 border-zinc-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOps = async (partnerId, quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/operations?partnerId=${partnerId}`);
      const data = await res.json();
      setOps(Array.isArray(data) ? data : []);
    } catch {
      setOps([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) { router.push('/'); return; }
    const userData = JSON.parse(session);
    setUser(userData);
    fetchOps(userData.id);
  }, [router]);

  const monthlyData = buildMonthlyData(ops);
  const recentOps = ops.slice(0, 5);

  // Stats derived from real data
  const stats = [
    {
      title: 'Pedimentos Activos',
      value: fmt(ops.length),
      sub: 'Operaciones registradas',
      icon: Package,
      color: 'emerald',
      trend: 'up',
    },
    {
      title: 'Facturas Registradas',
      value: fmt(ops.filter((o) => o.priority === '1' || o.priority === '2').length),
      sub: 'Con prioridad alta',
      icon: FileText,
      color: 'blue',
    },
    {
      title: 'Pendientes',
      value: fmt(ops.filter((o) => {
        const stage = (o.stage_id?.[1] || '').toLowerCase();
        return !stage.includes('ganado') && !stage.includes('perdido');
      }).length),
      sub: 'En proceso',
      icon: Clock,
      color: 'amber',
    },
    {
      title: 'Cerrados',
      value: fmt(ops.filter((o) => {
        const stage = (o.stage_id?.[1] || '').toLowerCase();
        return stage.includes('ganado') || stage.includes('perdido');
      }).length),
      sub: 'Completados',
      icon: CheckCircle2,
      color: 'purple',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Cargando dashboard…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-0.5">
            Bienvenido, <span className="text-zinc-300">{user?.name}</span>
          </p>
        </div>
        <button
          onClick={() => user && fetchOps(user.id, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.title} {...s} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar chart - movimiento mensual */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#111111] p-5">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white">Movimiento Mensual</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Pedimentos por mes (últimos 6 meses)</p>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="pedimentos" name="Pedimentos" fill="#3D6332" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm">
              Sin datos suficientes para graficar
            </div>
          )}
        </div>

        {/* Line chart - tendencia acumulada */}
        <div className="rounded-xl border border-zinc-800/60 bg-[#111111] p-5">
          <div className="mb-5">
            <h2 className="text-sm font-semibold text-white">Tendencia Acumulada</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Pedimentos acumulados por mes</p>
          </div>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData.map((d, i) => ({
                ...d,
                acumulado: monthlyData.slice(0, i + 1).reduce((s, x) => s + x.pedimentos, 0),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="acumulado"
                  name="Acumulado"
                  stroke="#3D6332"
                  strokeWidth={2}
                  dot={{ fill: '#3D6332', r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm">
              Sin datos suficientes para graficar
            </div>
          )}
        </div>
      </div>

      {/* Recent Operations */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#111111]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60">
          <div>
            <h2 className="text-sm font-semibold text-white">Operaciones Recientes</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Últimas {recentOps.length} operaciones</p>
          </div>
          <button
            onClick={() => router.push('/dashboard/pedimentos')}
            className="text-xs text-[#3D6332] hover:text-[#4a7a3c] flex items-center gap-1 transition-colors"
          >
            Ver todas <ArrowUpRight size={12} />
          </button>
        </div>

        {recentOps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <AlertCircle size={20} className="text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No hay operaciones registradas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60">
                  {['ID', 'Nombre', 'Etapa', 'Prioridad', 'Fecha'].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-zinc-500 uppercase tracking-wide font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentOps.map((op, i) => (
                  <tr
                    key={op.id}
                    className={`border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors ${i === recentOps.length - 1 ? 'border-none' : ''}`}
                  >
                    <td className="px-5 py-3.5 font-mono text-xs text-zinc-400">{op.id}</td>
                    <td className="px-5 py-3.5 text-zinc-200 max-w-[240px] truncate">{op.display_name || op.name}</td>
                    <td className="px-5 py-3.5">
                      <OpStatusBadge stage={op.stage_id} />
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      {op.priority === '0' ? 'Normal' : op.priority === '1' ? 'Alta' : 'Urgente'}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-zinc-500">
                      {op.create_date ? new Date(op.create_date).toLocaleDateString('es-MX') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
