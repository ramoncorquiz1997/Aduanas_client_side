"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Loader2,
  Info,
} from 'lucide-react';

function PasswordInput({ id, label, value, onChange, show, onToggle, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
        <Lock size={11} className="text-zinc-600" />
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0d0d0d] border border-zinc-800 rounded-lg px-4 py-3 pr-11 text-sm text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-[#3D6332]/50 focus:ring-1 focus:ring-[#3D6332]/20 transition-all"
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {hint && <p className="text-xs text-zinc-600">{hint}</p>}
    </div>
  );
}

function StrengthBar({ password }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Débil', 'Regular', 'Buena', 'Fuerte'];
  const colors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-[#3D6332]'];
  const textColors = ['', 'text-red-400', 'text-amber-400', 'text-blue-400', 'text-[#3D6332]'];

  if (!password) return null;

  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : 'bg-zinc-800'}`}
          />
        ))}
      </div>
      <span className={`text-xs font-medium w-12 ${textColors[score]}`}>
        {labels[score]}
      </span>
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
    setError('');
    setSuccess('');

    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerId: user.id,
          currentPassword: current,
          newPassword: next,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo cambiar la contraseña');
        return;
      }

      setSuccess(data.message || 'Contraseña actualizada correctamente');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch {
      setError('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = current && next && confirm && !loading;

  return (
    <div className="px-6 lg:px-8 py-8 space-y-8 max-w-lg">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <ShieldCheck size={18} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Seguridad</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Administra tu contraseña de acceso</p>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-xl border border-zinc-800/40 bg-zinc-900/30 px-5 py-4 flex items-start gap-3">
        <Info size={15} className="text-zinc-500 shrink-0 mt-0.5" />
        <div className="text-xs text-zinc-500 leading-relaxed space-y-1">
          <p>Tu contraseña inicial es <span className="font-mono text-zinc-400">los primeros 4 caracteres de tu RFC</span> en mayúsculas.</p>
          <p>Al cambiarla, la nueva contraseña se guardará en el sistema. Recuerda no compartirla.</p>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#3D6332]/10 border border-[#3D6332]/20 text-[#3D6332] text-sm">
          <CheckCircle2 size={16} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto shrink-0">
            <X size={14} />
          </button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto shrink-0">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800/60 bg-[#111111] p-6 space-y-5">
        <h2 className="text-sm font-semibold text-zinc-300">Cambiar Contraseña</h2>

        <PasswordInput
          id="current"
          label="Contraseña Actual"
          value={current}
          onChange={setCurrent}
          show={showCurrent}
          onToggle={() => setShowCurrent((v) => !v)}
        />

        <div className="border-t border-zinc-800/60 pt-5 space-y-4">
          <PasswordInput
            id="next"
            label="Nueva Contraseña"
            value={next}
            onChange={setNext}
            show={showNext}
            onToggle={() => setShowNext((v) => !v)}
            hint="Mínimo 6 caracteres"
          />

          {next && <StrengthBar password={next} />}

          <PasswordInput
            id="confirm"
            label="Confirmar Nueva Contraseña"
            value={confirm}
            onChange={setConfirm}
            show={showConfirm}
            onToggle={() => setShowConfirm((v) => !v)}
          />

          {confirm && next && (
            <p className={`text-xs flex items-center gap-1.5 ${next === confirm ? 'text-[#3D6332]' : 'text-red-400'}`}>
              {next === confirm
                ? <><CheckCircle2 size={12} /> Las contraseñas coinciden</>
                : <><AlertCircle size={12} /> Las contraseñas no coinciden</>
              }
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#3D6332] hover:bg-[#33542A] text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#3D6332] mt-2"
        >
          {loading ? (
            <><Loader2 size={15} className="animate-spin" /> Guardando…</>
          ) : (
            <><ShieldCheck size={15} /> Guardar nueva contraseña</>
          )}
        </button>
      </form>
    </div>
  );
}
