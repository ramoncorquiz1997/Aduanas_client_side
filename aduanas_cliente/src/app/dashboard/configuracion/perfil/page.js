"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Mail,
  FileText,
  Building2,
  Phone,
  MapPin,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

function InfoField({ label, value, icon: Icon, mono }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
        {Icon && <Icon size={11} className="text-zinc-600" />}
        {label}
      </label>
      <div
        className={`
          bg-[#0d0d0d] border border-zinc-800 rounded-lg px-4 py-3 text-sm
          ${mono ? 'font-mono text-emerald-400' : 'text-zinc-300'}
          ${!value ? 'text-zinc-600 italic' : ''}
        `}
      >
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
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError('');
    try {
      const res = await fetch(`/api/customer/profile?partnerId=${partnerId}`);
      if (!res.ok) throw new Error('No se pudo cargar el perfil');
      const data = await res.json();
      setPartner(data);
    } catch (err) {
      setError(err.message || 'Error al cargar perfil');
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
    fetchPartner(userData.id);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Cargando perfil…</p>
        </div>
      </div>
    );
  }

  // Fallback: show session data if API not yet available
  const displayName = partner?.name || user?.name || '—';
  const displayRfc = partner?.vat || user?.rfc || '—';
  const displayEmail = partner?.email || '—';
  const displayPhone = partner?.phone || partner?.mobile || '—';
  const displayAddress = partner?.street
    ? [partner.street, partner.city, partner.state_id?.[1], partner.zip, partner.country_id?.[1]].filter(Boolean).join(', ')
    : '—';
  const isCompany = partner?.is_company;

  return (
    <div className="px-6 lg:px-8 py-8 space-y-8 max-w-2xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <User size={18} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Información de Perfil</h1>
            <p className="text-zinc-500 text-sm mt-0.5">Datos registrados en el sistema</p>
          </div>
        </div>
        <button
          onClick={() => user && fetchPartner(user.id, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Error state (API not connected yet) */}
      {error && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">No se pudo cargar el perfil completo</p>
            <p className="text-xs text-amber-500/80 mt-0.5">Mostrando datos de sesión. {error}</p>
          </div>
        </div>
      )}

      {/* Avatar */}
      <div className="flex items-center gap-5 rounded-xl border border-zinc-800/60 bg-[#111111] px-6 py-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-800/30 border border-emerald-500/20 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-emerald-400">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <p className="text-lg font-semibold text-white">{displayName}</p>
          <p className="text-sm text-zinc-500 font-mono">{displayRfc}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${
              isCompany
                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            }`}>
              {isCompany !== undefined
                ? (isCompany ? 'Persona Moral' : 'Persona Física')
                : 'Cliente'}
            </span>
          </div>
        </div>
      </div>

      {/* Info fields */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#111111] p-6 space-y-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-1">Datos Generales</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Nombre / Razón Social" value={displayName} icon={User} />
          <InfoField label="RFC" value={displayRfc} icon={FileText} mono />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Correo Electrónico" value={displayEmail} icon={Mail} />
          <InfoField label="Teléfono" value={displayPhone} icon={Phone} />
        </div>

        <InfoField label="Domicilio Fiscal" value={displayAddress} icon={MapPin} />

        {isCompany && partner?.ref && (
          <InfoField label="Referencia / Código" value={partner.ref} icon={Building2} />
        )}
      </div>

      {/* Note */}
      <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 px-5 py-4 text-xs text-zinc-500 leading-relaxed">
        <span className="font-medium text-zinc-400">Nota:</span> Para actualizar tus datos de perfil o corregir información incorrecta, contacta directamente con tu agente aduanal. Los datos son administrados desde el sistema Odoo.
      </div>
    </div>
  );
}
