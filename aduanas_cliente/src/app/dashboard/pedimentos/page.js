"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  Filter,
  FileDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  FileStack,
  X,
} from 'lucide-react';

const PAGE_SIZE = 15;

function StatusBadge({ stage }) {
  const label = stage?.[1] || stage || 'Sin etapa';
  const l = label.toLowerCase();
  const cls = l.includes('ganado')
    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    : l.includes('perdido')
    ? 'bg-red-500/10 text-red-400 border-red-500/20'
    : 'bg-zinc-800 text-zinc-400 border-zinc-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const map = { '0': ['Normal', 'bg-zinc-800 text-zinc-400 border-zinc-700'], '1': ['Alta', 'bg-amber-500/10 text-amber-400 border-amber-500/20'], '2': ['Urgente', 'bg-red-500/10 text-red-400 border-red-500/20'] };
  const [label, cls] = map[priority] || map['0'];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${cls}`}>
      {label}
    </span>
  );
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

  // Derived values
  const stages = useMemo(() => [...new Set(ops.map((o) => o.stage_id?.[1]).filter(Boolean))], [ops]);

  const filtered = useMemo(() => {
    return ops.filter((op) => {
      const name = (op.display_name || op.name || '').toLowerCase();
      const stage = op.stage_id?.[1] || '';
      const matchSearch = !search || name.includes(search.toLowerCase()) || String(op.id).includes(search);
      const matchStage = !stageFilter || stage === stageFilter;
      const matchPriority = !priorityFilter || op.priority === priorityFilter;
      return matchSearch && matchStage && matchPriority;
    });
  }, [ops, search, stageFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => {
    setSearch('');
    setStageFilter('');
    setPriorityFilter('');
    setPage(1);
  };

  const hasFilters = search || stageFilter || priorityFilter;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Cargando pedimentos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <FileStack size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Repositorio de Pedimentos</h1>
            <p className="text-zinc-500 text-sm mt-0.5">{filtered.length} operación{filtered.length !== 1 ? 'es' : ''} encontrada{filtered.length !== 1 ? 's' : ''}</p>
          </div>
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-[#111111] border border-zinc-800 rounded-lg pl-9 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
          />
        </div>

        {/* Stage filter */}
        <div className="relative">
          <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
          <select
            value={stageFilter}
            onChange={(e) => { setStageFilter(e.target.value); setPage(1); }}
            className="bg-[#111111] border border-zinc-800 rounded-lg pl-8 pr-8 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer transition-all hover:border-zinc-700"
          >
            <option value="">Todas las etapas</option>
            {stages.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Priority filter */}
        <div className="relative">
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
            className="bg-[#111111] border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-zinc-300 focus:outline-none focus:border-emerald-500/50 appearance-none cursor-pointer transition-all hover:border-zinc-700"
          >
            <option value="">Todas las prioridades</option>
            <option value="0">Normal</option>
            <option value="1">Alta</option>
            <option value="2">Urgente</option>
          </select>
        </div>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-800 text-zinc-500 hover:text-red-400 hover:border-red-500/30 text-sm transition-all"
          >
            <X size={13} />
            Limpiar
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#111111] overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <AlertCircle size={20} className="text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">
              {hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay operaciones registradas'}
            </p>
            {hasFilters && (
              <button onClick={clearFilters} className="text-xs text-emerald-400 hover:underline mt-1">
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-[#0d0d0d]">
                  {['ID', 'Pedimento / Operación', 'Etapa', 'Prioridad', 'Fecha Alta', 'Acciones'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs text-zinc-500 uppercase tracking-wide font-medium whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.map((op, i) => (
                  <tr
                    key={op.id}
                    className={`border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors ${i === paged.length - 1 ? 'border-none' : ''}`}
                  >
                    <td className="px-5 py-4 font-mono text-xs text-zinc-400">#{op.id}</td>
                    <td className="px-5 py-4 max-w-[280px]">
                      <p className="text-zinc-200 truncate font-medium">{op.display_name || op.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge stage={op.stage_id} />
                    </td>
                    <td className="px-5 py-4">
                      <PriorityBadge priority={op.priority} />
                    </td>
                    <td className="px-5 py-4 text-xs text-zinc-500 whitespace-nowrap">
                      {op.create_date ? new Date(op.create_date).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          title="Descargar PDF"
                          className="p-1.5 rounded-md text-zinc-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                          onClick={() => alert(`Descarga PDF de operación #${op.id} — conectar con endpoint de descarga`)}
                        >
                          <FileDown size={15} />
                        </button>
                      </div>
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
          <p className="text-zinc-500 text-xs">
            Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={15} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .reduce((acc, p, i, arr) => {
                if (i > 0 && p - arr[i - 1] > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-2 text-zinc-600">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                      p === page
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/5'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
