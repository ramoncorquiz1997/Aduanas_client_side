"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, BarChart3, Package, BookOpen, Calendar, Loader2 } from 'lucide-react';

const REPORTS = [
  { key: 'coves', title: 'COVES', description: 'Certificado de Valor y Origen en el Extranjero. Documento oficial requerido para operaciones de importación.', icon: FileText, formats: ['PDF', 'XLSX'] },
  { key: 'fracciones', title: 'Fracciones Arancelarias', description: 'Listado de fracciones arancelarias utilizadas en tus operaciones con descripción y tasas aplicadas.', icon: BookOpen, formats: ['PDF', 'XLSX'] },
  { key: 'kardex', title: 'Kardex', description: 'Control de inventario de entradas y salidas de mercancía para tus operaciones aduanales.', icon: Package, formats: ['PDF', 'XLSX'] },
  { key: 'movimientos', title: 'Movimientos Mensuales', description: 'Resumen mensual de pedimentos agrupados por tipo de operación (importación / exportación).', icon: BarChart3, formats: ['PDF', 'XLSX'] },
];

function ReportCard({ report, onDownload, downloading }) {
  const isDownloading = downloading === report.key;
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-5">
        <div className="p-3 rounded-xl bg-[#3D6332]/10 shrink-0">
          <report.icon size={22} className="text-[#3D6332]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#212121] uppercase tracking-tight">{report.title}</h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{report.description}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {report.formats.map((fmt) => (
          <button key={fmt} onClick={() => onDownload(report.key, fmt)} disabled={isDownloading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              fmt === 'PDF'
                ? 'bg-[#3D6332] text-white hover:bg-[#33542A] shadow-sm'
                : 'border border-[#3D6332]/30 text-[#3D6332] hover:bg-[#3D6332]/5'
            }`}>
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
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth()-3); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [downloading, setDownloading] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) router.push('/');
  }, [router]);

  const handleDownload = async (key, format) => {
    setDownloading(key);
    await new Promise(r => setTimeout(r, 1200));
    alert(`Reporte "${key}" en formato ${format} — conectar con endpoint de Odoo.`);
    setDownloading('');
  };

  const inputCls = "bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-[#212121] focus:outline-none focus:border-[#3D6332] focus:ring-2 focus:ring-[#3D6332]/10 shadow-sm transition-all";

  return (
    <div className="px-6 lg:px-8 py-8 space-y-8 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#3D6332] shadow-sm">
          <BarChart3 size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#212121] uppercase tracking-tight">Reportes</h1>
          <p className="text-slate-400 text-sm mt-0.5">Descarga tus reportes aduanales en PDF o Excel</p>
        </div>
      </div>

      {/* Date range */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={15} className="text-[#3D6332]" />
          <h2 className="text-sm font-bold text-[#212121] uppercase tracking-tight">Rango de fechas</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Desde</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Hasta</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className={inputCls} />
          </div>
          <p className="text-xs text-slate-300 pb-2">El rango se aplicará a todos los reportes</p>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {REPORTS.map(r => <ReportCard key={r.key} report={r} onDownload={handleDownload} downloading={downloading} />)}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs text-slate-400 leading-relaxed">
        <span className="font-bold text-slate-500">Nota:</span> Los reportes se generan en tiempo real consultando los datos en Odoo. Para grandes volúmenes puede tardar unos segundos.
      </div>
    </div>
  );
}
