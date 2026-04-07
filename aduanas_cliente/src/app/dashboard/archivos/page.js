"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  FolderOpen,
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  Eye,
  RefreshCw,
  AlertCircle,
  X,
  Loader2,
} from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    cargado: ['Cargado', 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'],
    pendiente_faltante: ['Pendiente', 'bg-amber-500/10 text-amber-400 border-amber-500/20'],
  };
  const [label, cls] = map[status] || ['Desconocido', 'bg-zinc-800 text-zinc-400 border-zinc-700'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${cls}`}>
      {status === 'cargado' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
      {label}
    </span>
  );
}

function DocumentRow({ doc, uploading, onUpload, onPreview }) {
  const inputRef = useRef(null);
  const isUploading = uploading === doc.key;

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onUpload(doc.key, file);
  };

  return (
    <tr className="border-b border-zinc-800/30 hover:bg-white/[0.02] transition-colors last:border-none">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-zinc-800 shrink-0">
            <FileText size={14} className="text-zinc-400" />
          </div>
          <span className="text-sm text-zinc-200">{doc.label}</span>
        </div>
      </td>
      <td className="px-5 py-4">
        <StatusBadge status={doc.status} />
      </td>
      <td className="px-5 py-4 text-xs text-zinc-500 max-w-[180px] truncate">
        {doc.filename || '—'}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {doc.status === 'cargado' && (
            <button
              onClick={() => onPreview(doc)}
              className="p-1.5 rounded-md text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 transition-all"
              title="Vista previa"
            >
              <Eye size={15} />
            </button>
          )}
          <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-zinc-700 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
            {doc.status === 'cargado' ? 'Reemplazar' : 'Subir'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ArchivosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [personType, setPersonType] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Preview modal
  const [preview, setPreview] = useState(null); // { url, title }

  const fetchDocuments = async (partnerId, quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch(`/api/customer/documents?partnerId=${partnerId}`);
      const data = await res.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setPendingCount(Number(data.pendingCount || 0));
      setPersonType(typeof data.personType === 'string' ? data.personType : '');
    } catch {
      setDocuments([]);
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
    fetchDocuments(userData.id);
  }, [router]);

  const handleUpload = async (documentKey, file) => {
    setMessage('');
    setError('');
    if (!user?.id) { setError('Sesión inválida'); return; }

    try {
      setUploading(documentKey);
      const formData = new FormData();
      formData.append('partnerId', String(user.id));
      formData.append('documentKey', documentKey);
      formData.append('file', file);

      const res = await fetch('/api/customer/upload-document', { method: 'POST', body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'No se pudo subir el documento');
        return;
      }
      setMessage('Archivo subido exitosamente');
      await fetchDocuments(user.id, true);
    } catch {
      setError('Error de conexión al subir el documento');
    } finally {
      setUploading('');
    }
  };

  const handlePreview = (doc) => {
    if (!user?.id) return;
    const url = `/api/customer/document-preview?partnerId=${user.id}&documentKey=${doc.key}`;
    setPreview({ url, title: doc.filename || doc.label });
  };

  const loaded = documents.filter((d) => d.status === 'cargado').length;
  const total = documents.length;
  const pct = total ? Math.round((loaded / total) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Cargando archivos…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 lg:px-8 py-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <FolderOpen size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Mis Archivos</h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Gestión de documentos requeridos •{' '}
              <span className="text-zinc-400">{personType === 'moral' ? 'Persona Moral' : 'Persona Física'}</span>
            </p>
          </div>
        </div>
        <button
          onClick={() => user && fetchDocuments(user.id, true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 text-sm transition-all disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Progress bar */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#111111] p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {pendingCount > 0 ? (
              <AlertCircle size={15} className="text-amber-400" />
            ) : (
              <CheckCircle2 size={15} className="text-emerald-400" />
            )}
            <span className="text-sm font-medium text-zinc-300">
              {pendingCount > 0
                ? `${pendingCount} documento${pendingCount !== 1 ? 's' : ''} pendiente${pendingCount !== 1 ? 's' : ''}`
                : 'Todos los documentos completos'}
            </span>
          </div>
          <span className="text-sm font-semibold text-zinc-300">{loaded}/{total}</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <div
            className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-zinc-600 mt-2">{pct}% completado</p>
      </div>

      {/* Feedback messages */}
      {message && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <CheckCircle2 size={15} />
          {message}
          <button onClick={() => setMessage('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={15} />
          {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Documents table */}
      <div className="rounded-xl border border-zinc-800/60 bg-[#111111] overflow-hidden">
        <div className="px-5 py-4 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-white">Documentos Requeridos</h2>
          <p className="text-xs text-zinc-500 mt-0.5">Sube los documentos necesarios para tu expediente</p>
        </div>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
              <FolderOpen size={20} className="text-zinc-600" />
            </div>
            <p className="text-sm text-zinc-500">No hay documentos disponibles para este perfil</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800/60 bg-[#0d0d0d]">
                  {['Documento', 'Estado', 'Archivo', 'Acciones'].map((h) => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs text-zinc-500 uppercase tracking-wide font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map((doc) => (
                  <DocumentRow
                    key={doc.key}
                    doc={doc}
                    uploading={uploading}
                    onUpload={handleUpload}
                    onPreview={handlePreview}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-zinc-400" />
                <span className="text-sm font-medium text-zinc-200">{preview.title}</span>
              </div>
              <button
                onClick={() => setPreview(null)}
                className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={preview.url}
                className="w-full h-[600px] border-none"
                title={preview.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
