"use client";

import React, { useState, useRef, useCallback } from 'react';
import {
  Ship, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft,
  Mail, Phone, Upload, CheckCircle, FileText, X, Sun, Moon, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

const STEPS = {
  CSF: 'csf',
  DATOS: 'datos',
  EXITO: 'exito',
};

export default function Register() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(STEPS.CSF);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtractingCSF, setIsExtractingCSF] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [csfError, setCsfError] = useState('');
  const [formError, setFormError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Datos del CSF extraídos
  const [csfFile, setCsfFile] = useState(null);       // File object
  const [csfB64, setCsfB64] = useState('');           // base64 del PDF
  const [extractedRfc, setExtractedRfc] = useState('');

  // Formulario
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleField = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setFormError('');
  };

  // ─── Manejo del CSF ──────────────────────────────────────────────────────────

  const processCSF = useCallback(async (file) => {
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setCsfError('El archivo debe ser un PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setCsfError('El archivo no debe superar 10 MB.');
      return;
    }

    setCsfError('');
    setIsExtractingCSF(true);

    try {
      // Convertir a base64
      const b64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          // reader.result = "data:application/pdf;base64,XXXX" → tomamos solo la parte XXXX
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Llamar a la API para extraer RFC del CSF
      const res = await fetch('/api/auth/extract-csf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file_b64: b64 }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setCsfError(data.error || 'No se pudo leer el CSF. Verifica que sea el PDF original del SAT.');
        return;
      }

      if (!data.data?.vat) {
        setCsfError('No se encontró el RFC en el CSF. Verifica que sea el PDF original del SAT.');
        return;
      }

      setCsfFile(file);
      setCsfB64(b64);
      setExtractedRfc(data.data.vat);
      setStep(STEPS.DATOS);
    } catch {
      setCsfError('Error al procesar el archivo. Inténtalo de nuevo.');
    } finally {
      setIsExtractingCSF(false);
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) processCSF(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processCSF(file);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  // ─── Envío del formulario ────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (form.password !== form.confirmPassword) {
      setFormError('Las contraseñas no coinciden.');
      return;
    }
    if (form.password.length < 6) {
      setFormError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setFormError('Todos los campos son requeridos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          rfc: extractedRfc,
          csf_b64: csfB64,
          csf_filename: csfFile?.name || 'csf.pdf',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(data.error || 'Error al enviar la solicitud. Inténtalo de nuevo.');
        return;
      }

      setStep(STEPS.EXITO);
    } catch {
      setFormError('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] flex items-center justify-center p-4 font-sans text-[#212121] dark:text-slate-100 transition-colors duration-500 relative">

      {/* Botón de tema */}
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
            Crear cuenta de cliente
          </p>
        </div>

        {/* ── Paso 1: Subir CSF ── */}
        {step === STEPS.CSF && (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none">

            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Paso 1 de 2</p>
              <h2 className="text-lg font-black text-[#212121] dark:text-white">Sube tu CSF</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tu RFC se extraerá automáticamente de la Constancia de Situación Fiscal del SAT.
              </p>
            </div>

            {/* Zona de drag-and-drop */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all ${
                isDragging
                  ? 'border-[#3D6332] bg-[#3D6332]/5'
                  : 'border-slate-200 dark:border-slate-700 hover:border-[#3D6332] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {isExtractingCSF ? (
                <>
                  <div className="w-10 h-10 border-4 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    Leyendo QR del CSF...
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                    <FileText size={32} className="text-[#3D6332]" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-[#212121] dark:text-white">
                      Arrastra tu CSF aquí
                    </p>
                    <p className="text-xs text-slate-400 mt-1">o haz clic para seleccionar</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">PDF · Máx. 10 MB</p>
                  </div>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {csfError && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span>{csfError}</span>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#3D6332] transition-colors"
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 2: Datos del cliente ── */}
        {step === STEPS.DATOS && (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none">

            <div className="mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Paso 2 de 2</p>
              <h2 className="text-lg font-black text-[#212121] dark:text-white">Completa tus datos</h2>
            </div>

            {/* RFC extraído */}
            <div className="flex items-center gap-3 bg-[#3D6332]/8 dark:bg-[#3D6332]/15 border border-[#3D6332]/20 rounded-2xl px-4 py-3 mb-6">
              <CheckCircle size={18} className="text-[#3D6332] shrink-0" />
              <div>
                <p className="text-[9px] font-black text-[#3D6332] uppercase tracking-widest">RFC extraído del CSF</p>
                <p className="text-sm font-black text-[#212121] dark:text-white">{extractedRfc}</p>
              </div>
              <button
                onClick={() => { setStep(STEPS.CSF); setCsfFile(null); setCsfB64(''); setExtractedRfc(''); }}
                className="ml-auto text-slate-400 hover:text-red-400 transition-colors"
                title="Cambiar CSF"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">

              {formError && (
                <div className="flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nombre */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Nombre completo / Razón social
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3D6332] transition-colors">
                    <User size={18} />
                  </div>
                  <input
                    type="text"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleField}
                    placeholder="Juan Pérez García"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#3D6332] focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none text-[#212121] dark:text-white shadow-inner"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Correo electrónico
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3D6332] transition-colors">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleField}
                    placeholder="correo@empresa.com"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#3D6332] focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none text-[#212121] dark:text-white shadow-inner"
                  />
                </div>
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Teléfono de contacto
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3D6332] transition-colors">
                    <Phone size={18} />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleField}
                    placeholder="55 1234 5678"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#3D6332] focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none text-[#212121] dark:text-white shadow-inner"
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3D6332] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    value={form.password}
                    onChange={handleField}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#3D6332] focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold transition-all outline-none text-[#212121] dark:text-white shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#3D6332] transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                  Confirmar contraseña
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#3D6332] transition-colors">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    value={form.confirmPassword}
                    onChange={handleField}
                    placeholder="Repite tu contraseña"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-[#3D6332] focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold transition-all outline-none text-[#212121] dark:text-white shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-[#3D6332] transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Botón enviar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full group flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl mt-2 ${
                  isSubmitting
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-[#3D6332] text-white hover:bg-[#33542A] hover:shadow-[#3D6332]/40 active:scale-[0.97]'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-6 h-6 border-3 border-slate-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Enviar solicitud
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => router.push('/')}
                className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-[#3D6332] transition-colors"
              >
                <ArrowLeft size={14} />
                Volver al inicio de sesión
              </button>
            </div>
          </div>
        )}

        {/* ── Paso 3: Éxito ── */}
        {step === STEPS.EXITO && (
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none text-center">

            <div className="inline-flex items-center justify-center w-20 h-20 bg-[#3D6332]/10 rounded-full mb-6">
              <CheckCircle size={44} className="text-[#3D6332]" />
            </div>

            <h2 className="text-2xl font-black text-[#212121] dark:text-white mb-3">
              ¡Solicitud enviada!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-2">
              Tu cuenta está en revisión. La agencia validará tu información y recibirás confirmación en tu correo.
            </p>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">
              RFC registrado: {extractedRfc}
            </p>

            <button
              onClick={() => router.push('/')}
              className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] bg-[#3D6332] text-white hover:bg-[#33542A] hover:shadow-[#3D6332]/40 active:scale-[0.97] transition-all shadow-xl"
            >
              <ArrowLeft size={18} />
              Ir al inicio de sesión
            </button>
          </div>
        )}

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
