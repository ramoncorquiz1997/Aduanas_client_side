"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, AlertOctagon, CheckSquare, Gavel, 
  Search, Filter, ArrowUpRight, Sun, Moon, Loader2,
  LogOut // Importamos el icono de cerrar sesión
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

export default function DashboardAduanal() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    const session = localStorage.getItem('user_session');
    if (!session) {
      router.push('/');
      return;
    }
    const userData = JSON.parse(session);
    setUser(userData);
    fetchOperations(userData.id);
  }, []);

  const fetchOperations = async (partnerId) => {
    try {
      const res = await fetch(`/api/operations?partnerId=${partnerId}`);
      const data = await res.json();
      setOps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error cargando operaciones");
    } finally {
      setLoading(false);
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('user_session'); // Limpiamos la sesión
    router.push('/'); // Redirigimos al inicio
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-8 font-sans transition-colors duration-500">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-2">RFC: {user?.rfc}</h2>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Hola, <span className="italic text-slate-400">{user?.name?.split(' ')[0]}</span>
          </h1>
        </div>
        
        <div className="flex gap-3 items-center">
          {/* Botón de Tema */}
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
            title="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-blue-600" />}
          </button>

          {/* Botón de Cerrar Sesión */}
          <button 
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/30 text-red-500 shadow-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-2"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
            <span className="text-xs font-black uppercase hidden md:inline">Salir</span>
          </button>

          <div className="relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar operación..." 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none dark:text-white shadow-sm w-48 md:w-64" 
            />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<FileText className="text-blue-600"/>} label="Total Tráfico" value={ops.length.toString().padStart(2, '0')} sub="Operaciones activas" />
          <StatCard icon={<Gavel className="text-amber-500"/>} label="Pagados" value="--" sub="Sincronizando..." />
          <StatCard icon={<AlertOctagon className="text-red-500"/>} label="Rojos" value="--" sub="Reconocimiento" />
          <StatCard icon={<CheckSquare className="text-emerald-500"/>} label="Concluidos" value="--" sub="Histórico" />
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter text-lg">Tráfico de {user?.name}</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50/50 dark:bg-slate-800/50">
                <tr>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referencia</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></td></tr>
                ) : ops.length > 0 ? ops.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-5">
                      <div className="font-black text-blue-600 text-sm">{op.display_name}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{op.priority === '3' ? 'URGENTE' : 'NORMAL'}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{op.stage_id ? op.stage_id[1] : 'S/E'}</span>
                      </div>
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-500 italic">
                      {op.create_date ? new Date(op.create_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-5 text-right">
                      <button className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all text-slate-400">
                        <ArrowUpRight size={20} />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold uppercase italic text-sm tracking-widest">No se encontraron operaciones activas.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 uppercase italic">{sub}</p>
    </div>
  );
}