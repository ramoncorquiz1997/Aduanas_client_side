"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Filter, FileDown, ChevronLeft, ChevronRight, RefreshCw, AlertCircle, FileStack, X } from 'lucide-react';

const PAGE_SIZE = 15;

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

function PriorityBadge({ priority }) {
  const map = {
    '0': ['Normal', 'bg-slate-100 text-slate-500 border-slate-200'],
    '1': ['Alta', 'bg-amber-50 text-amber-600 border-amber-200'],
    '2': ['Urgente', 'bg-red-50 text-red-600 border-red-200'],
  };
  const [label, cls] = map[priority] || map['0'];
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-semibold border ${cls}`}>{label}</span>;
}

export default function PedimentosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);

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
    const u = JSON.parse(session); setUser(u); fetchOps(u.id);
  }, [router]);

  const stages = useMemo(() => [...new Set(ops.map(o => o.stage_id?.[1]).filter(Boolean))], [ops]);

  const filtered = useMemo(() => ops.filter(op => {
    const name = (op.display_name || op.name || '').toLowerCase();
    const stage = op.stage_id?.[1] || '';
    return (!search || name.includes(search.toLowerCase()) || String(op.id).includes(search))
      && (!stageFilter || stage === stageFilter)
      && (!priorityFilter || op.priority === priorityFilter);
  }), [ops, search, stageFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const hasFilters = search || stageFilter || priorityFilter;
  const clearFilters = () => { setSearch(''); setStageFilter(''); setPriorityFilter(''); setPage(1); };

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Cargando pedimentos…</p>
      </div>
    </div>
  );

  return (
    <div className="px-6 lg:px-8 py-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#3D6332] shadow-sm">
            <FileStack size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#212121] uppercase tracking-tight">Repositorio de Pedimentos</h1>
            <p className="text-slate-400 text-sm mt-0.5">{filtered.length} operación{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => user && fetchOps(user.id, true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#212121] text-sm shadow-sm transition-all disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Buscar por nombre o ID…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#212121] placeholder-slate-300 focus:outline-none focus:border-[#3D6332] focus:ring-2 focus:ring-[#3D6332]/10 shadow-sm transition-all" />
        </div>
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select value={stageFilter} onChange={e => { setStageFilter(e.target.value); setPage(1); }}
            className="bg-white border border-slate-200 rounded-xl pl-8 pr-8 py-2.5 text-sm text-[#212121] focus:outline-none focus:border-[#3D6332] appearance-none cursor-pointer shadow-sm transition-all">
            <option value="">Todas las etapas</option>
            {stages.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-[#212121] focus:outline-none focus:border-[#3D6332] appearance-none cursor-pointer shadow-sm transition-all">
          <option value="">Todas las prioridades</option>
          <option value="0">Normal</option>
          <option value="1">Alta</option>
          <option value="2">Urgente</option>
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-red-500 hover:border-red-200 text-sm shadow-sm transition-all">
            <X size={13} /> Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <AlertCircle size={20} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">{hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay operaciones registradas'}</p>
            {hasFilters && <button onClick={clearFilters} className="text-xs text-[#3D6332] hover:underline font-semibold mt-1">Limpiar filtros</button>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['ID','Pedimento / Operación','Etapa','Prioridad','Fecha Alta','Acciones'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs text-slate-400 uppercase tracking-wide font-bold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((op, i) => (
                  <tr key={op.id} className={`border-b border-slate-50 hover:bg-slate-50 transition-colors ${i === paged.length-1 ? 'border-none' : ''}`}>
                    <td className="px-5 py-4 font-mono text-xs text-slate-400">#{op.id}</td>
                    <td className="px-5 py-4 max-w-[280px]">
                      <p className="text-[#212121] font-semibold truncate">{op.display_name || op.name}</p>
                    </td>
                    <td className="px-5 py-4"><StageBadge stage={op.stage_id} /></td>
                    <td className="px-5 py-4"><PriorityBadge priority={op.priority} /></td>
                    <td className="px-5 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {op.create_date ? new Date(op.create_date).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <button title="Descargar PDF"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#3D6332] hover:bg-[#3D6332]/10 transition-all"
                        onClick={() => alert(`Descarga PDF operación #${op.id}`)}>
                        <FileDown size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-slate-400 text-xs">
            Mostrando {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-[#212121] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
              <ChevronLeft size={15} />
            </button>
            {Array.from({length:totalPages},(_,i)=>i+1)
              .filter(p=>p===1||p===totalPages||Math.abs(p-page)<=1)
              .reduce((acc,p,i,arr)=>{ if(i>0&&p-arr[i-1]>1) acc.push('…'); acc.push(p); return acc; },[])
              .map((p,i) => p==='…'
                ? <span key={`e${i}`} className="px-2 text-slate-300">…</span>
                : <button key={p} onClick={()=>setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p===page ? 'bg-[#3D6332] text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100'}`}>
                    {p}
                  </button>
              )}
            <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-[#212121] disabled:opacity-40 disabled:cursor-not-allowed shadow-sm transition-all">
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
