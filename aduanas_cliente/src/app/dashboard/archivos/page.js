"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FolderOpen, Upload, FileText, CheckCircle2, Clock, Eye, RefreshCw, AlertCircle, X, Loader2 } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    cargado: ['Cargado', 'bg-[#3D6332]/10 text-[#3D6332] border-[#3D6332]/20'],
    pendiente_faltante: ['Pendiente', 'bg-amber-50 text-amber-600 border-amber-200'],
  };
  const [label, cls] = map[status] || ['Desconocido', 'bg-slate-100 text-slate-400 border-slate-200'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border ${cls}`}>
      {status === 'cargado' ? <CheckCircle2 size={11} /> : <Clock size={11} />}
      {label}
    </span>
  );
}

function DocumentRow({ doc, uploading, onUpload, onPreview }) {
  const inputRef = useRef(null);
  const isUploading = uploading === doc.key;
  const handleChange = (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (file) onUpload(doc.key, file); };

  return (
    <tr className="border-b border-slate-50 hover:bg-slate-50 transition-colors last:border-none">
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100 shrink-0">
            <FileText size={14} className="text-slate-400" />
          </div>
          <span className="text-sm text-[#212121] font-medium">{doc.label}</span>
        </div>
      </td>
      <td className="px-5 py-4"><StatusBadge status={doc.status} /></td>
      <td className="px-5 py-4 text-xs text-slate-400 max-w-[180px] truncate">{doc.filename || '—'}</td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          {doc.status === 'cargado' && (
            <button onClick={() => onPreview(doc)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="Vista previa">
              <Eye size={15} />
            </button>
          )}
          <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
          <button onClick={() => inputRef.current?.click()} disabled={isUploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#3D6332] text-white hover:bg-[#33542A] shadow-sm transition-all disabled:opacity-50">
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
  const [preview, setPreview] = useState(null);

  const fetchDocuments = async (partnerId, quiet = false) => {
    if (!quiet) setLoading(true); else setRefreshing(true);
    try {
      const res = await fetch(`/api/customer/documents?partnerId=${partnerId}`);
      const data = await res.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setPendingCount(Number(data.pendingCount || 0));
      setPersonType(typeof data.personType === 'string' ? data.personType : '');
    } catch { setDocuments([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    const session = localStorage.getItem('user_session');
    if (!session) { router.push('/'); return; }
    const u = JSON.parse(session); setUser(u); fetchDocuments(u.id);
  }, [router]);

  const handleUpload = async (documentKey, file) => {
    setMessage(''); setError('');
    if (!user?.id) { setError('Sesión inválida'); return; }
    try {
      setUploading(documentKey);
      const formData = new FormData();
      formData.append('partnerId', String(user.id));
      formData.append('documentKey', documentKey);
      formData.append('file', file);
      const res = await fetch('/api/customer/upload-document', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'No se pudo subir el documento'); return; }
      setMessage('Archivo subido exitosamente');
      await fetchDocuments(user.id, true);
    } catch { setError('Error de conexión al subir el documento'); }
    finally { setUploading(''); }
  };

  const handlePreview = (doc) => {
    if (!user?.id) return;
    setPreview({ url: `/api/customer/document-preview?partnerId=${user.id}&documentKey=${doc.key}`, title: doc.filename || doc.label });
  };

  const loaded = documents.filter(d => d.status === 'cargado').length;
  const total = documents.length;
  const pct = total ? Math.round((loaded / total) * 100) : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#3D6332] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Cargando archivos…</p>
      </div>
    </div>
  );

  return (
    <div className="px-6 lg:px-8 py-8 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#3D6332] shadow-sm">
            <FolderOpen size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#212121] uppercase tracking-tight">Mis Archivos</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              Documentos requeridos · <span className="text-[#3D6332] font-semibold">{personType === 'moral' ? 'Persona Moral' : 'Persona Física'}</span>
            </p>
          </div>
        </div>
        <button onClick={() => user && fetchDocuments(user.id, true)} disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-[#212121] text-sm shadow-sm transition-all disabled:opacity-50">
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {pendingCount > 0
              ? <AlertCircle size={15} className="text-amber-500" />
              : <CheckCircle2 size={15} className="text-[#3D6332]" />}
            <span className="text-sm font-semibold text-[#212121]">
              {pendingCount > 0 ? `${pendingCount} documento${pendingCount!==1?'s':''} pendiente${pendingCount!==1?'s':''}` : 'Todos los documentos completos'}
            </span>
          </div>
          <span className="text-sm font-bold text-[#212121]">{loaded}/{total}</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5">
          <div className="bg-[#3D6332] h-2.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2">{pct}% completado</p>
      </div>

      {/* Messages */}
      {message && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#3D6332]/10 border border-[#3D6332]/20 text-[#3D6332] text-sm font-medium">
          <CheckCircle2 size={15} /> {message}
          <button onClick={() => setMessage('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          <AlertCircle size={15} /> {error}
          <button onClick={() => setError('')} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-[#212121] uppercase tracking-tight">Documentos Requeridos</h2>
          <p className="text-xs text-slate-400 mt-0.5">Sube los documentos necesarios para tu expediente</p>
        </div>
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <FolderOpen size={20} className="text-slate-300" />
            </div>
            <p className="text-sm text-slate-400">No hay documentos disponibles para este perfil</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Documento','Estado','Archivo','Acciones'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-xs text-slate-400 uppercase tracking-wide font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documents.map(doc => (
                  <DocumentRow key={doc.key} doc={doc} uploading={uploading} onUpload={handleUpload} onPreview={handlePreview} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview modal */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-slate-400" />
                <span className="text-sm font-semibold text-[#212121]">{preview.title}</span>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-[#212121] hover:bg-slate-100 transition-all">
                <X size={16} />
              </button>
            </div>
            <iframe src={preview.url} className="w-full h-[600px] border-none" title={preview.title} />
          </div>
        </div>
      )}
    </div>
  );
}
