"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { Ship, Lock, Eye, EyeOff, CheckCircle, AlertCircle, ArrowRight, Sun, Moon } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from 'next-themes';

function SetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [partnerInfo, setPartnerInfo] = useState(null);
  const [tokenError, setTokenError] = useState('');
  const [mounted, setMounted] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setTokenError('No se encontró el token de invitación.');
      setIsValidating(false);
      return;
    }
    validateToken(token);
  }, [searchParams]);

  const validateToken = async (token) => {
    try {
      const res = await fetch(`/api/auth/validate-token?token=${encodeURIComponent(token)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setPartnerInfo(data);
      } else {
        setTokenError(data.error || 'El link de invitación no es válido o ya expiró.');
      }
    } catch {
      setTokenError('Error al verificar el link. Intenta de nuevo.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setIsLoading(true);
    try {
      const token = searchParams.get('token');
      const res = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Error al establecer la contraseña.');
      }
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] flex items-center justify-center p-4 font-sans text-[#212121] dark:text-slate-100 transition-colors duration-500 relative">

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-600 dark:text-slate-400"
      >
        {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-[#3D6332]" />}
      </button>

      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#3D6332] rounded-3xl text-white shadow-2xl shadow-[#3D6332]/30 mb-6 transform hover:rotate-6 transition-transform">
            <Ship size={40} />
          </div>
          <h1 className="text-4xl font-black text-[#212121] dark:text-white tracking-tighter uppercase italic">
            Aduan<span className="text-[#3D6332]">ex</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-bold text-sm uppercase tracking-widest">
            Portal de Clientes
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none">

          {/* Validating token */}
          {isValidating && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="w-10 h-10 border-4 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Verificando invitación...</p>
            </div>
          )}

          {/* Token error */}
          {!isValidating && tokenError && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-black text-[#212121] dark:text-white uppercase tracking-tight mb-2">Link inválido</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{tokenError}</p>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Solicita un nuevo link de invitación a tu agencia aduanal.
              </p>
            </div>
          )}

          {/* Success */}
          {!isValidating && !tokenError && success && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-500" />
              </div>
              <div className="text-center">
                <p className="font-black text-[#212121] dark:text-white uppercase tracking-tight mb-2">¡Contraseña creada!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Tu cuenta está lista. Ya puedes iniciar sesión con tu RFC.
                </p>
              </div>
              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-[#3D6332] text-white hover:bg-[#33542A] shadow-xl hover:shadow-[#3D6332]/40 active:scale-[0.97] transition-all"
              >
                Ir al inicio de sesión
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* Form */}
          {!isValidating && !tokenError && !success && partnerInfo && (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Welcome */}
              <div className="text-center pb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Bienvenido</p>
                <p className="text-lg font-black text-[#212121] dark:text-white">{partnerInfo.name}</p>
                {partnerInfo.email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{partnerInfo.email}</p>
                )}
              </div>

              <div className="h-px bg-slate-100 dark:bg-slate-800" />

              <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                Crea tu contraseña para acceder al portal de Aduanex.
              </p>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center">
                  {error}
                </div>
              )}

              {/* Password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Nueva contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3D6332] transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#3D6332] focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold transition-all outline-none text-[#212121] dark:text-white shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#3D6332] transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Confirmar contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3D6332] transition-colors">
                    <Lock size={20} />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite tu contraseña"
                    className={`w-full bg-slate-50 dark:bg-slate-800 border-2 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold transition-all outline-none text-[#212121] dark:text-white shadow-inner ${
                      confirmPassword && confirmPassword !== password
                        ? 'border-red-400 focus:border-red-400'
                        : confirmPassword && confirmPassword === password
                        ? 'border-green-400 focus:border-green-400'
                        : 'border-transparent focus:border-[#3D6332]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#3D6332] transition-colors"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full group flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${
                  isLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#3D6332] text-white hover:bg-[#33542A] hover:shadow-[#3D6332]/40 active:scale-[0.97]'
                }`}
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Crear contraseña
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            © 2026 Aduanex. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-[#212121] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SetPasswordContent />
    </Suspense>
  );
}
