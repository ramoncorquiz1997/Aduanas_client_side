"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, RefreshCw, Search, AlertCircle,
  Building2, Mail, Phone, FileText, Upload, X,
  CheckCircle, ArrowLeft, Eye
} from 'lucide-react';

// ── Add Client Modal ──────────────────────────────────────────────────────────

function AddClientModal({ ffPartnerId, onClose, onSuccess }) {
  const fileInputRef = useRef(null);

  const [step, setStep] = useState('csf'); // 'csf' | 'form'
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csfError, setCsfError] = useState('');
  const [formError, setFormError] = useState('');
  const [csfFile, setCsfFile] = useState(null);
  const [csfB64, setCsfB64] = useState('');
  const [rfcWarning, setRfcWarning] = useState(false);
  const [form, setForm] = useState({ rfc: '', name: '', email: '', phone: '' });

  const handleField = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  const readFileAsB64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const processCSF = async (file) => {
    if (!file || file.type !== 'application/pdf') {
      setCsfError('Solo se aceptan archivos PDF.');
      return;
    }
    setCsfError('');
    setIsExtracting(true);
    try {
      const b64 = await readFileAsB64(file);
      setCsfFile(file);
      setCsfB64(b64);

      const res = await fetch('/api/auth/extract-csf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_b64: b64 }),
      });
      const data = await res.json();

      if (res.ok && data.rfc) {
        setForm((prev) => ({ ...prev, rfc: data.rfc, name: data.name || prev.name }));
        setRfcWarning(false);
      } else {
        setRfcWarning(true);
      }
      setStep('form');
    } catch {
      setCsfError('Error procesando el PDF. Intenta de nuevo.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processCSF(file);
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files[0]) processCSF(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.rfc || !form.name) {
      setFormError('RFC y nombre son requeridos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ff/add-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ffPartnerId,
          rfc: form.rfc.trim().toUpperCase(),
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          csf_file_b64: csfB64 || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setFormError(data.error || 'Error al crear el cliente.');
      }
    } catch {
      setFormError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {step === 'form' && (
              <button onClick={() => setStep('csf')} className="text-slate-400 hover:text-[#212121] transition-colors">
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <p className="font-black text-[#212121] uppercase tracking-tight text-sm">Agregar Cliente</p>
              <p className="text-xs text-slate-400">{step === 'csf' ? 'Sube el CSF del cliente' : 'Completa los datos'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-[#212121] transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* CSF Step */}
          {step === 'csf' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500">
                Sube la Constancia de Situación Fiscal del cliente para extraer automáticamente su RFC.
              </p>

              {csfError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase tracking-wide p-3 rounded-xl text-center">
                  {csfError}
                </div>
              )}

              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all ${
                  isDragging ? 'border-[#3D6332] bg-[#3D6332]/5' : 'border-slate-200 hover:border-[#3D6332]/50 hover:bg-slate-50'
                }`}
              >
                {isExtracting ? (
                  <>
                    <div className="w-10 h-10 border-4 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-bold text-slate-500">Leyendo CSF...</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-2xl bg-[#3D6332]/10 flex items-center justify-center">
                      <Upload size={24} className="text-[#3D6332]" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-[#212121] text-sm uppercase tracking-tight">Subir CSF</p>
                      <p className="text-xs text-slate-400 mt-1">Arrastra aquí o haz clic para seleccionar</p>
                      <p className="text-xs text-slate-400">PDF original del SAT</p>
                    </div>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />

              <button
                type="button"
                onClick={() => setStep('form')}
                className="w-full py-3 rounded-2xl border-2 border-slate-200 text-slate-500 font-black text-xs uppercase tracking-wide hover:border-[#3D6332] hover:text-[#3D6332] transition-all"
              >
                Ingresar datos manualmente
              </button>
            </div>
          )}

          {/* Form Step */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {csfFile && (
                <div className="flex items-center gap-3 bg-[#3D6332]/5 border border-[#3D6332]/20 rounded-xl px-4 py-3">
                  <FileText size={16} className="text-[#3D6332] flex-shrink-0" />
                  <span className="text-xs font-bold text-[#3D6332] truncate">{csfFile.name}</span>
                </div>
              )}

              {rfcWarning && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <AlertCircle size={14} className="text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">No se pudo extraer el RFC automáticamente. Ingrésalo manualmente.</p>
                </div>
              )}

              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold uppercase p-3 rounded-xl text-center">
                  {formError}
                </div>
              )}

              {/* RFC */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">RFC *</label>
                <input
                  type="text"
                  name="rfc"
                  required
                  value={form.rfc}
                  onChange={handleField}
                  placeholder="XAXX010101000"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-[#3D6332] focus:bg-white rounded-2xl py-3 px-4 text-sm font-bold uppercase outline-none transition-all text-[#212121]"
                />
              </div>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Razón Social / Nombre *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleField}
                  placeholder="Empresa S.A. de C.V."
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-[#3D6332] focus:bg-white rounded-2xl py-3 px-4 text-sm font-bold outline-none transition-all text-[#212121]"
                />
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Correo (opcional)</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleField}
                  placeholder="contacto@empresa.com"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-[#3D6332] focus:bg-white rounded-2xl py-3 px-4 text-sm font-bold outline-none transition-all text-[#212121]"
                />
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Teléfono (opcional)</label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleField}
                  placeholder="+52 55 1234 5678"
                  className="w-full bg-slate-50 border-2 border-transparent focus:border-[#3D6332] focus:bg-white rounded-2xl py-3 px-4 text-sm font-bold outline-none transition-all text-[#212121]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-lg ${
                  isSubmitting
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#3D6332] text-white hover:bg-[#33542A] hover:shadow-[#3D6332]/40 active:scale-[0.97]'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus size={16} />
                    Agregar cliente
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Client Card ───────────────────────────────────────────────────────────────

function ClientCard({ client }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-[#3D6332]/30 transition-all">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-[#3D6332]/10 flex items-center justify-center flex-shrink-0">
          <Building2 size={22} className="text-[#3D6332]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-[#212121] text-sm truncate">{client.name}</p>
          <p className="text-xs font-mono text-slate-400 mt-0.5">{client.vat || 'Sin RFC'}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {client.email && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Mail size={11} /> {client.email}
              </span>
            )}
            {client.phone && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Phone size={11} /> {client.phone}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MisClientesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchClients = async (partnerId, quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch(`/api/ff/clients?ffPartnerId=${partnerId}`);
      const data = await res.json();
      setClients(Array.isArray(data) ? data : []);
    } catch { setClients([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) { router.push('/'); return; }
    const u = JSON.parse(session);
    if (u.role !== 'freight_forwarder') { router.push('/dashboard'); return; }
    setUser(u);
    fetchClients(u.id);
  }, [router]);

  const handleAddSuccess = () => {
    setShowModal(false);
    setSuccessMsg('Cliente agregado exitosamente.');
    fetchClients(user.id, true);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      !q ||
      (c.name || '').toLowerCase().includes(q) ||
      (c.vat || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q)
    );
  });

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Cargando clientes...</p>
      </div>
    </div>
  );

  return (
    <>
      {showModal && (
        <AddClientModal
          ffPartnerId={user?.id}
          onClose={() => setShowModal(false)}
          onSuccess={handleAddSuccess}
        />
      )}

      <div className="px-6 lg:px-8 py-8 space-y-6 max-w-[1200px]">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-[#212121] uppercase tracking-tight">Mis Clientes</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {user?.name} · <span className="text-[#3D6332] font-semibold">{clients.length} cliente{clients.length !== 1 ? 's' : ''}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => user && fetchClients(user.id, true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#212121] hover:border-slate-300 text-sm shadow-sm transition-all disabled:opacity-50"
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Actualizar
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-[#3D6332] text-white font-black text-xs uppercase tracking-wide hover:bg-[#33542A] shadow-lg hover:shadow-[#3D6332]/30 active:scale-[0.97] transition-all"
            >
              <Plus size={16} />
              Agregar cliente
            </button>
          </div>
        </div>

        {/* Success toast */}
        {successMsg && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 rounded-2xl px-5 py-4">
            <CheckCircle size={18} className="flex-shrink-0" />
            <p className="text-sm font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, RFC o correo..."
            className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:border-[#3D6332] transition-all shadow-sm text-[#212121]"
          />
        </div>

        {/* Client grid */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
              {search ? <Search size={24} className="text-slate-300" /> : <Users size={24} className="text-slate-300" />}
            </div>
            <div className="text-center">
              <p className="font-black text-slate-400 uppercase tracking-tight text-sm">
                {search ? 'Sin resultados' : 'Sin clientes aún'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {search
                  ? 'Intenta con otro término de búsqueda'
                  : 'Agrega tu primer cliente usando el botón de arriba'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
