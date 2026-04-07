"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Package, FileText, Clock, CheckCircle2, AlertCircle, RefreshCw, ArrowUpRight } from 'lucide-react';

const MonthlyBarChart = dynamic(
  () => import('../../components/DashboardCharts').then((m) => m.MonthlyBarChart),
  { ssr: false, loading: () => <div className="h-[220px] flex items-center justify-center text-slate-300 text-xs">Cargando gráfica…</div> }
);
const CumulativeLineChart = dynamic(
  () => import('../../components/DashboardCharts').then((m) => m.CumulativeLineChart),
  { ssr: false, loading: () => <div className="h-[220px] flex items-center justify-center text-slate-300 text-xs">Cargando gráfica…</div> }
);

function buildMonthlyData(ops) {
  const map = {};
  ops.forEach((op) => {
    const raw = op.create_date || '';
    if (!raw) return;
    const d = new Date(raw);
    if (isNaN(d)) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map[key] = (map[key] || 0) + 1;
  });
  const sorted = Object.keys(map).sort().slice(-6);
  const names = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return sorted.map((k) => { const [,m] = k.split('-'); return { mes: names[+m-1], pedimentos: map[k] }; });
}

function StatCard({ title, value, sub, icon: Icon, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-bold mb-1">{title}</p>
          <p className="text-3xl font-black text-[#212121]">{value}</p>
        </div>
        <div className="p-2.5 rounded-xl" style={{ background: accent + '18' }}>
          <Icon size={20} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-xs text-slate-400">{sub}</p>
    </div>
  );
}

function StageBadge({ stage }) {
  const label = stage?.[1] || stage || 'Sin etapa';
  const l = label.toLowerCase();
  const cls = l.includes('ganado')
    ? 'bg-[#3D6332]/10 text-[#3D6332] border-[#3D6332]/20'
    : l.includes('perdido')
    ? 'bg-red-50 text-red-600 border-red-200'
    : 'bg-slate-100 text-slate-500 border-slate-200';
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>{label}</span>;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOps = async (partnerId, quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch(`/api/operations?partnerId=${partnerId}`);
      const data = await res.json();
      setOps(Array.isArray(data) ? data : []);
    } catch { setOps([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) { router.push('/'); return; }
    const u = JSON.parse(session);
    setUser(u);
    fetchOps(u.id);
  }, [router]);

  const monthly = buildMonthlyData(ops);
  const recent = ops.slice(0, 5);

  const stats = [
    { title: 'Pedimentos Activos', value: ops.length, sub: 'Operaciones registradas', icon: Package, accent: '#3D6332' },
    { title: 'Facturas Registradas', value: ops.filter(o => o.priority === '1' || o.priority === '2').length, sub: 'Con prioridad alta', icon: FileText, accent: '#2563eb' },
    { title: 'En Proceso', value: ops.filter(o => { const s = (o.stage_id?.[1]||'').toLowerCase(); return !s.includes('ganado') && !s.includes('perdido'); }).length, sub: 'Pendientes de cerrar', icon: Clock, accent: '#d97706' },
    { title: 'Cerrados', value: ops.filter(o => { const s = (o.stage_id?.[1]||'').toLowerCase(); return s.includes('ganado') || s.includes('perdido'); }).length, sub: 'Completados', icon: CheckCircle2, accent: '#7c3aed' },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Cargando dashboard…</p>
      </div>
    </div>
  );

  return (
    <div className="px-6 lg:px-8 py-8 space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#212121] uppercase tracking-tight">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-0.5">Bienvenido, <span className="text-[#3D6332] font-semibold">{user?.name}</span></p>
        </div>
        <button onClick={() => user && fetchOps(user.id, true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#212121] hover:border-slate-300 text-sm shadow-sm transition-all disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.title} {...s} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#212121] uppercase tracking-tight">Movimiento Mensual</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-5">Pedimentos por mes (últimos 6 meses)</p>
          <MonthlyBarChart data={monthly} />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-bold text-[#212121] uppercase tracking-tight">Tendencia Acumulada</p>
          <p className="text-xs text-slate-400 mt-0.5 mb-5">Pedimentos acumulados por mes</p>
          <CumulativeLineChart data={monthly} />
        </div>
      </div>

      {/* Recent ops */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="text-sm font-bold text-[#212121] uppercase tracking-tight">Operaciones Recientes</p>
            <p className="text-xs text-slate-400 mt-0.5">Últimas {recent.length} operaciones</p>
          </div>
          <button onClick={() => router.push('/dashboard/pedimentos')}
            className="text-xs text-[#3D6332] hover:text-[#33542A] font-semibold flex items-center gap-1 transition-colors">
            Ver todas <ArrowUpRight size={12} />
          </button>
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">No hay operaciones registradas aún</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['ID','Nombre','Etapa','Prioridad','Fecha'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-slate-400 uppercase tracking-wide font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((op, i) => (
                  <tr key={op.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === recent.length-1 ? 'border-none' : ''}`}>
                    <td className="px-5 py-3.5 font-mono text-xs text-slate-400">#{op.id}</td>
                    <td className="px-5 py-3.5 text-[#212121] font-medium max-w-[240px] truncate">{op.display_name || op.name}</td>
                    <td className="px-5 py-3.5"><StageBadge stage={op.stage_id} /></td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{op.priority==='0'?'Normal':op.priority==='1'?'Alta':'Urgente'}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{op.create_date ? new Date(op.create_date).toLocaleDateString('es-MX') : '—'}</td>
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
