"use client";

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  AlertOctagon, 
  CheckSquare, 
  Gavel, 
  Search,
  Filter,
  ArrowUpRight,
  Sun,
  Moon,
  Clock
} from 'lucide-react';
import { useTheme } from 'next-themes';

const operations = [
  {
    referencia: "AA-2026-001",
    pedimento: "26 47 3901 6001234",
    estatus: "Reconocimiento Aduanero", // Semáforo Rojo
    colorEstatus: "bg-red-500",
    cliente: "Importadora Global AC",
    tipo: "IMPO A1",
    vencimiento: "12 Feb, 2026",
    aduana: "Manzanillo (470)",
    alertas: true
  },
  {
    referencia: "AA-2026-005",
    pedimento: "26 47 3901 6005678",
    estatus: "Desaduanamiento Libre", // Semáforo Verde
    colorEstatus: "bg-emerald-500",
    cliente: "Tech logistics SA",
    tipo: "EXPO RT",
    vencimiento: "15 Feb, 2026",
    aduana: "Nuevo Laredo (240)",
    alertas: false
  }
];

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 uppercase italic">{sub}</p>
    </div>
  );
}

export default function DashboardAduanal() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-8 font-sans transition-colors duration-500">
      
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-2">Agencia Aduanal - Tráfico</h2>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Despacho <span className="italic text-slate-400">Operativo</span>
          </h1>
        </div>
        
        <div className="flex gap-3 items-center">
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:scale-105 transition-all shadow-sm"
          >
            {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-blue-600" />}
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Referencia o Pedimento..." 
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 ring-blue-500 outline-none transition-all w-full md:w-64 dark:text-white shadow-sm"
            />
          </div>
          
          <button className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <Filter size={20} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        
        {/* Resumen Operativo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={<FileText className="text-blue-600"/>} label="En Captura" value="08" sub="Pendientes de validación" />
          <StatCard icon={<Gavel className="text-amber-500"/>} label="Pagados" value="15" sub="Listos para modular" />
          <StatCard icon={<AlertOctagon className="text-red-500"/>} label="Rojos" value="02" sub="En reconocimiento" />
          <StatCard icon={<CheckSquare className="text-emerald-500"/>} label="Concluidos" value="124" sub="Este mes" />
        </div>

        {/* Tabla de Tráfico Aduanal */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter text-lg">Tráfico Activo</h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-50 dark:bg-slate-800 px-3 py-1 rounded-full">Actualizado: 11:00 AM</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50">
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referencia / Cliente</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pedimento / Aduana</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus Aduanal</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vence Libres</th>
                  <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {operations.map((op) => (
                  <tr key={op.referencia} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-5">
                      <div className="font-black text-blue-600 text-sm mb-1">{op.referencia}</div>
                      <div className="text-xs font-bold text-slate-500 uppercase">{op.cliente}</div>
                    </td>
                    <td className="p-5">
                      <div className="font-bold text-slate-900 dark:text-white text-sm mb-1">{op.pedimento}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{op.aduana}</div>
                    </td>
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${op.colorEstatus} ${op.alertas ? 'animate-pulse' : ''}`}></span>
                        <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{op.estatus}</span>
                      </div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 block">{op.tipo}</span>
                    </td>
                    <td className="p-5 text-sm font-bold text-slate-600 dark:text-slate-400 italic">
                      {op.vencimiento}
                    </td>
                    <td className="p-5 text-right">
                      <button className="p-2 hover:bg-blue-600 hover:text-white rounded-xl transition-all text-slate-400">
                        <ArrowUpRight size={20} />
                      </button>
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