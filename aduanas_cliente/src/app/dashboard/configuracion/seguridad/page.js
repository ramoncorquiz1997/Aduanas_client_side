"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, X, Loader2, Info } from 'lucide-react';

function PasswordInput({ id, label, value, onChange, show, onToggle, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
        <Lock size={11} className="text-slate-300" />{label}
      </label>
      <div className="relative">
        <input id={id} type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm text-[#212121] placeholder-slate-300 focus:outline-none focus:border-[#3D6332] focus:ring-2 focus:ring-[#3D6332]/10 shadow-sm transition-all"
          placeholder="••••••••" autoComplete="new-password" />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

function StrengthBar({ password }) {
  const score = [password.length>=8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
  const labels = ['','Débil','Regular','Buena','Fuerte'];
  const colors = ['','bg-red-400','bg-amber-400','bg-blue-400','bg-[#3D6332]'];
  const textColors = ['','text-red-500','text-amber-500','text-blue-500','text-[#3D6332]'];
  if (!password) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1 flex-1">
        {[1,2,3,4].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i<=score ? colors[score] : 'bg-slate-200'}`} />)}
      </div>
      <span className={`text-xs font-bold w-12 ${textColors[score]}`}>{labels[score]}</span>
    </div>
  );
}

export default function SeguridadPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) { router.push('/'); return; }
    setUser(JSON.parse(session));
  }, [router]);

  const validate = () => {
    if (!current) return 'Ingresa tu contraseña actual';
    if (!next) return 'Ingresa la nueva contraseña';
    if (next.length < 6) return 'La nueva contraseña debe tener al menos 6 caracteres';
    if (next !== confirm) return 'Las contraseñas no coinciden';
    if (next === current) return 'La nueva contraseña debe ser diferente a la actual';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId: user.id, currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'No se pudo cambiar la contraseña'); return; }
      setSuccess(data.message || 'Contraseña actualizada correctamente');
      setCurrent(''); setNext(''); setConfirm('');
    } catch { setError('Error de conexión. Intenta nuevamente.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="px-6 lg:px-8 py-8 space-y-8 max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-[#3D6332] shadow-sm">
          <ShieldCheck size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black text-[#212121] uppercase tracking-tight">Seguridad</h1>
          <p className="text-slate-400 text-sm mt-0.5">Administra tu contraseña de acceso</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Info size={15} className="text-[#3D6332] shrink-0 mt-0.5" />
        <div className="text-xs text-slate-500 leading-relaxed space-y-1">
          <p>Tu contraseña inicial son <span className="font-mono font-bold text-[#212121]">los primeros 4 caracteres de tu RFC</span> en mayúsculas.</p>
          <p>Al cambiarla, la nueva contraseña quedará guardada en el sistema.</p>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#3D6332]/10 border border-[#3D6332]/20 text-[#3D6332] text-sm font-semibold">
          <CheckCircle2 size={16} /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold">
          <AlertCircle size={16} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cambiar Contraseña</h2>

        <PasswordInput id="current" label="Contraseña Actual" value={current} onChange={setCurrent} show={showCurrent} onToggle={() => setShowCurrent(v => !v)} />

        <div className="border-t border-slate-100 pt-5 space-y-4">
          <PasswordInput id="next" label="Nueva Contraseña" value={next} onChange={setNext} show={showNext} onToggle={() => setShowNext(v => !v)} hint="Mínimo 6 caracteres" />
          {next && <StrengthBar password={next} />}
          <PasswordInput id="confirm" label="Confirmar Nueva Contraseña" value={confirm} onChange={setConfirm} show={showConfirm} onToggle={() => setShowConfirm(v => !v)} />
          {confirm && next && (
            <p className={`text-xs flex items-center gap-1.5 font-semibold ${next===confirm ? 'text-[#3D6332]' : 'text-red-500'}`}>
              {next===confirm ? <><CheckCircle2 size={12} /> Las contraseñas coinciden</> : <><AlertCircle size={12} /> Las contraseñas no coinciden</>}
            </p>
          )}
        </div>

        <button type="submit" disabled={!current || !next || !confirm || loading}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#3D6332] hover:bg-[#33542A] text-white font-black text-sm uppercase tracking-tight shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
          {loading ? <><Loader2 size={15} className="animate-spin" /> Guardando…</> : <><ShieldCheck size={15} /> Guardar nueva contraseña</>}
        </button>
      </form>
    </div>
  );
}
