"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, FileText, Building2, Phone, MapPin, AlertCircle, RefreshCw } from 'lucide-react';

function InfoField({ label, value, icon: Icon, mono }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
        {Icon && <Icon size={11} className="text-slate-300" />}
        {label}
      </label>
      <div className={`bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm ${mono ? 'font-mono text-[#3D6332] font-semibold' : 'text-[#212121]'} ${!value ? 'text-slate-300 italic' : ''}`}>
        {value || 'Sin información'}
      </div>
    </div>
  );
}

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchPartner = async (partnerId, quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const res = await fetch(`/api/customer/profile?partnerId=${partnerId}`);
      if (!res.ok) throw new Error('No se pudo cargar el perfil');
      setPartner(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) { router.push('/'); return; }
    const u = JSON.parse(session); setUser(u); fetchPartner(u.id);
  }, [router]);

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Cargando perfil…</p>
      </div>
    </div>
  );

  const name = partner?.name || user?.name || '—';
  const rfc = partner?.vat || user?.rfc || '—';
  const email = partner?.email || '—';
  const phone = partner?.phone || partner?.mobile || '—';
  const address = partner?.street
    ? [partner.street, partner.city, partner.state_id?.[1], partner.zip, partner.country_id?.[1]].filter(Boolean).join(', ')
    : '—';
  const isCompany = partner?.is_company;

  return (
    <div className="px-6 lg:px-8 py-8 space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#3D6332] shadow-sm">
            <User size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#212121] uppercase tracking-tight">Información de Perfil</h1>
            <p className="text-slate-400 text-sm mt-0.5">Datos registrados en el sistema</p>
          </div>
        </div>
        <button onClick={() => user && fetchPartner(user.id, true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#212121] text-sm shadow-sm transition-all disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">No se pudo cargar el perfil completo</p>
            <p className="text-xs text-amber-600 mt-0.5">Mostrando datos de sesión. {error}</p>
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-5 bg-white rounded-2xl border border-slate-200 px-6 py-5 shadow-sm">
        <div className="w-16 h-16 rounded-2xl bg-[#3D6332] flex items-center justify-center shrink-0 shadow-sm">
          <span className="text-2xl font-black text-white">{name.charAt(0).toUpperCase()}</span>
        </div>
        <div>
          <p className="text-lg font-black text-[#212121] uppercase tracking-tight">{name}</p>
          <p className="text-sm text-slate-400 font-mono">{rfc}</p>
          <span className={`inline-flex mt-2 px-2.5 py-1 rounded-lg text-xs font-bold border ${
            isCompany !== undefined
              ? (isCompany ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-[#3D6332]/10 text-[#3D6332] border-[#3D6332]/20')
              : 'bg-[#3D6332]/10 text-[#3D6332] border-[#3D6332]/20'
          }`}>
            {isCompany !== undefined ? (isCompany ? 'Persona Moral' : 'Persona Física') : 'Cliente'}
          </span>
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Datos Generales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Nombre / Razón Social" value={name} icon={User} />
          <InfoField label="RFC" value={rfc} icon={FileText} mono />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Correo Electrónico" value={email} icon={Mail} />
          <InfoField label="Teléfono" value={phone} icon={Phone} />
        </div>
        <InfoField label="Domicilio Fiscal" value={address} icon={MapPin} />
        {isCompany && partner?.ref && <InfoField label="Referencia / Código" value={partner.ref} icon={Building2} />}
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs text-slate-400 leading-relaxed">
        <span className="font-bold text-slate-500">Nota:</span> Para actualizar tus datos contacta directamente con tu agente aduanal. Los datos son administrados desde Odoo.
      </div>
    </div>
  );
}
