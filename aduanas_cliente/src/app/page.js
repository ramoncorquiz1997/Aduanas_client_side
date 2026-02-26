"use client";

import React, { useState, useEffect } from 'react';
import { Ship, Lock, User, Eye, EyeOff, ArrowRight, Sun, Moon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';

export default function Login() {
  // Estados para el formulario
  const [rfc, setRfc] = useState('');
  const [password, setPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rfc: rfc.trim().toUpperCase(), password }),
        });

        const data = await response.json();

        if (response.ok) {
          // --- ESTA LÍNEA ES LA IMPORTANTE ---
          // Guardamos el ID y Nombre que vienen de Odoo en el navegador
          localStorage.setItem('user_session', JSON.stringify(data.user));
          
          router.push('/dashboard');
        } else {
          setError(data.error || 'Credenciales incorrectas');
        }
      } catch (err) {
        setError('Error de conexión con el servidor');
      } finally {
        setIsLoading(false);
      }
    };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-500 relative">
      
      {/* Botón de Cambio de Tema */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-6 right-6 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl hover:scale-110 active:scale-95 transition-all text-slate-600 dark:text-slate-400"
      >
        {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-blue-600" />}
      </button>

      <div className="w-full max-w-md">
        
        {/* Logo y Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-3xl text-white shadow-2xl shadow-blue-500/30 mb-6 transform hover:rotate-6 transition-transform">
            <Ship size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">
            Nexus<span className="text-blue-600">Aduana</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-3 font-bold text-sm uppercase tracking-widest">
            Sistema de Gestión Logística
          </p>
        </div>

        {/* Tarjeta de Login */}
        <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-200/60 dark:shadow-none">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Mostrar error si existe */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-[10px] font-black uppercase tracking-widest p-4 rounded-xl text-center">
                {error}
              </div>
            )}

            {/* Campo RFC */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                RFC del Contribuyente
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  required
                  value={rfc}
                  onChange={(e) => setRfc(e.target.value)}
                  placeholder="XAXX010101000"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white shadow-inner uppercase"
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Clave de Acceso
                </label>
                <a href="#" className="text-[10px] font-black text-blue-600 uppercase hover:underline decoration-2 underline-offset-4">
                  Recuperar
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-blue-600 focus:bg-white dark:focus:bg-slate-900 rounded-2xl py-4 pl-12 pr-12 text-sm font-bold transition-all outline-none text-slate-900 dark:text-white shadow-inner"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Botón de Entrada */}
            <button 
              type="submit"
              disabled={isLoading}
              className={`w-full group flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl ${
                isLoading 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/40 active:scale-[0.97]'
              }`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  Iniciar Sesión
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Soporte */}
          <div className="mt-10 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-[11px] text-slate-500 font-bold text-center uppercase tracking-tighter">
              ¿Problemas con el acceso? <a href="#" className="text-blue-600 hover:underline">Contactar a TI</a>
            </p>
          </div>
        </div>

        {/* Footer legal */}
        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">
            © 2026 Aduanex. Todos los derechos reservados.
          </p>
          <div className="flex gap-4">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Privacidad</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase">Seguridad SSL</span>
          </div>
        </div>
      </div>
    </div>
  );
}