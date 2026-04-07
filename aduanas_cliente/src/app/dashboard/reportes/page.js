"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Download,
  BarChart3,
  Package,
  BookOpen,
  Calendar,
  ChevronDown,
  Loader2,
} from 'lucide-react';

const REPORTS = [
  {
    key: 'coves',
    title: 'COVES',
    description: 'Certificado de Valor y Origen en el Extranjero. Documento oficial requerido para operaciones de importación.',
    icon: FileText,
    color: 'emerald',
    formats: ['PDF', 'XLSX'],
  },
  {
    key: 'fracciones',
    title: 'Fracciones Arancelarias',
    description: 'Listado de fracciones arancelarias utilizadas en tus operaciones con descripción y tasas aplicadas.',
    icon: BookOpen,
    color: 'blue',
    formats: ['PDF', 'XLSX'],
  },
  {
    key: 'kardex',
    title: 'Kardex',
    description: 'Control de inventario de entradas y salidas de mercancía para tus operaciones aduanales.',
    icon: Package,
    color: 'amber',
    formats: ['PDF', 'XLSX'],
  },
  {
    key: 'movimientos',
    title: 'Movimientos Mensuales',
    description: 'Resumen mensual de pedimentos agrupados por tipo de operación (importación / exportación).',
    icon: BarChart3,
    color: 'purple',
    formats: ['PDF', 'XLSX'],
  },
];

const COLOR = {
  emerald: {
    card: 'border-[#3D6332]/20 bg-[#3D6332]/5',
    icon: 'text-[#3D6332] bg-[#3D6332]/10',
    btn: 'bg-[#3D6332] hover:bg-[#33542A] text-white',
    btnOutline: 'border-[#3D6332]/30 text-[#3D6332] hover:bg-[#3D6332]/10',
  },
  blue: {
    card: 'border-blue-500/20 bg-blue-500/5',
    icon: 'text-blue-400 bg-blue-400/10',
    btn: 'bg-blue-500 hover:bg-blue-400 text-white',
    btnOutline: 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10',
  },
  amber: {
    card: 'border-amber-500/20 bg-amber-500/5',
    icon: 'text-amber-400 bg-amber-400/10',
    btn: 'bg-amber-500 hover:bg-amber-400 text-black',
    btnOutline: 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10',
  },
  purple: {
    card: 'border-purple-500/20 bg-purple-500/5',
    icon: 'text-purple-400 bg-purple-400/10',
    btn: 'bg-purple-500 hover:bg-purple-400 text-white',
    btnOutline: 'border-purple-500/30 text-purple-400 hover:bg-purple-500/10',
  },
};

function ReportCard({ report, dateFrom, dateTo, onDownload, downloading }) {
  const c = COLOR[report.color];
  const isDownloading = downloading === report.key;

  return (
    <div className={`rounded-xl border ${c.card} p-5 flex flex-col gap-4`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${c.icon} shrink-0`}>
          <report.icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-white">{report.title}</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{report.description}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {report.formats.map((fmt) => (
          <button
            key={fmt}
            onClick={() => onDownload(report.key, fmt)}
            disabled={isDownloading}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all
              ${fmt === 'PDF' ? `${c.btn} border-transparent` : `bg-transparent ${c.btnOutline}`}
              disabled:opacity-60 disabled:cursor-not-allowed
            `}
          >
            {isDownloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
            {fmt}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ReportesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 3);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) { router.push('/'); return; }
    setUser(JSON.parse(session));
  }, [router]);

  const handleDownload = async (key, format) => {
    setDownloading(key);
    // TODO: Connect to actual Odoo report endpoint
    // Example: /api/reportes/[key]?partnerId=...&from=...&to=...&format=...
    await new Promise((r) => setTimeout(r, 1200));
    alert(`Reporte "${key}" en formato ${format} — conectar con endpoint de Odoo para generar descarga real.`);
    setDownloading('');
  };

  return (
    <div className="px-6 lg:px-8 py-8 space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <BarChart3 size={18} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Reportes</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Descarga tus reportes aduanales en PDF o Excel</p>
        </div>
      </div>

      {/* Date range filter */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#111111] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={15} className="text-zinc-500" />
          <h2 className="text-sm font-medium text-zinc-300">Rango de fechas</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">Desde</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-[#0d0d0d] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#3D6332]/50 focus:ring-1 focus:ring-[#3D6332]/20 transition-all [color-scheme:dark]"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-zinc-500">Hasta</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-[#0d0d0d] border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-[#3D6332]/50 focus:ring-1 focus:ring-[#3D6332]/20 transition-all [color-scheme:dark]"
            />
          </div>
          <p className="text-xs text-zinc-600 pb-2">
            El rango se aplicará a todos los reportes generados
          </p>
        </div>
      </div>

      {/* Report cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {REPORTS.map((report) => (
          <ReportCard
            key={report.key}
            report={report}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDownload={handleDownload}
            downloading={downloading}
          />
        ))}
      </div>

      {/* Info note */}
      <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 px-5 py-4 text-xs text-zinc-500 leading-relaxed">
        <span className="font-medium text-zinc-400">Nota:</span> Los reportes se generan en tiempo real consultando los datos de tu cuenta en el sistema Odoo. Para reportes con grandes volúmenes de datos, la generación puede tardar unos segundos.
      </div>
    </div>
  );
}
