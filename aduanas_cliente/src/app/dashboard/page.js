"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FileText, AlertOctagon, CheckSquare, Gavel,
  Search, ArrowUpRight, Sun, Moon, Loader2, Upload,
  LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import DocumentUploadSection from '../../components/document-upload-section';
import {
  parseCfdiXml,
  fetchWithRetry,
  normalizeFacturaStatus,
  getFacturaStatusLabel,
  canSendToOperation,
} from '../../lib/factura-utils.mjs';

const FACTURA_DOCUMENT_TYPES = [
  { key: 'xml', label: 'Archivo XML', accept: '.xml,text/xml,application/xml', hint: 'CFDI 4.0' },
  { key: 'pdf', label: 'Archivo PDF', accept: '.pdf,application/pdf', hint: 'Representacion impresa' },
];

const INITIAL_FACTURA_STATE = {
  status: 'pendiente',
  statusLabel: 'Pendiente',
  documentType: 'cfdi',
  requiresValidCfdi: true,
  filesByType: { xml: null, pdf: null },
  cfdiData: null,
  validationHistory: [],
  backendMessage: '',
  error: '',
  loadingStatus: false,
  uploadingType: '',
  validating: false,
  sendingOperation: false,
};

function mapFacturaStatusPayload(payload) {
  const normalizedStatus = normalizeFacturaStatus(payload?.status);
  return {
    status: normalizedStatus,
    statusLabel: getFacturaStatusLabel(normalizedStatus),
    documentType: payload?.documentType === 'extranjera' ? 'extranjera' : 'cfdi',
    requiresValidCfdi: Boolean(payload?.requiresValidCfdi ?? true),
    filesByType: {
      xml: payload?.files?.xml || null,
      pdf: payload?.files?.pdf || null,
    },
    cfdiData: payload?.cfdiData || null,
    validationHistory: Array.isArray(payload?.history) ? payload.history : [],
    backendMessage: payload?.message || '',
  };
}

export default function DashboardAduanal() {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [ops, setOps] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('principal');
  const [personType, setPersonType] = useState('');
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [uploadingDocumentKey, setUploadingDocumentKey] = useState('');
  const [docMessage, setDocMessage] = useState('');
  const [docError, setDocError] = useState('');
  const [selectedDocumentKey, setSelectedDocumentKey] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const documentInputRef = useRef(null);
  const [selectedOperationId, setSelectedOperationId] = useState('');
  const [facturaState, setFacturaState] = useState(INITIAL_FACTURA_STATE);

  useEffect(() => {
    setMounted(true);
    const session = localStorage.getItem('user_session');
    if (!session) {
      router.push('/');
      return;
    }

    const userData = JSON.parse(session);
    setUser(userData);
    fetchOperations(userData.id);
    fetchDocuments(userData.id);
  }, [router]);

  useEffect(() => {
    if (!ops.length) {
      setSelectedOperationId('');
      setFacturaState(INITIAL_FACTURA_STATE);
      return;
    }

    if (!selectedOperationId) {
      setSelectedOperationId(String(ops[0].id));
    }
  }, [ops, selectedOperationId]);

  const fetchOperations = async (partnerId) => {
    try {
      const res = await fetch(`/api/operations?partnerId=${partnerId}`);
      const data = await res.json();
      setOps(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error cargando operaciones');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (partnerId) => {
    try {
      setDocumentsLoading(true);
      const res = await fetch(`/api/customer/documents?partnerId=${partnerId}`);
      const data = await res.json();
      setDocuments(Array.isArray(data.documents) ? data.documents : []);
      setPendingCount(Number(data.pendingCount || 0));
      setPersonType(typeof data.personType === 'string' ? data.personType : '');
    } catch (err) {
      console.error('Error cargando documentos');
      setDocuments([]);
      setPendingCount(0);
      setPersonType('');
    } finally {
      setDocumentsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    router.push('/');
  };

  const openFileSelectorForDocument = (documentKey) => {
    setSelectedDocumentKey(documentKey);
    documentInputRef.current?.click();
  };

  const uploadDocument = async (selectedFile, documentKey) => {
    setDocMessage('');
    setDocError('');

    if (!user?.id) {
      setDocError('No se encontro sesion valida del cliente');
      return;
    }

    if (!documentKey) {
      setDocError('Documento invalido');
      return;
    }

    if (!selectedFile) {
      setDocError('Selecciona un archivo');
      return;
    }

    try {
      setUploadingDocumentKey(documentKey);
      const formData = new FormData();
      formData.append('partnerId', String(user.id));
      formData.append('documentKey', documentKey);
      formData.append('file', selectedFile);

      const response = await fetch('/api/customer/upload-document', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        setDocError(data.error || 'No se pudo subir el documento');
        return;
      }

      setDocMessage('Archivo subido exitosamente');
      await fetchDocuments(user.id);
    } catch (error) {
      setDocError('Error de conexion al subir el documento');
    } finally {
      setUploadingDocumentKey('');
    }
  };

  const handleDocumentFileSelected = async (event) => {
    const selectedFile = event.target.files?.[0] || null;
    const documentKey = selectedDocumentKey;
    event.target.value = '';
    setSelectedDocumentKey('');
    await uploadDocument(selectedFile, documentKey);
  };

  const openDocumentPreview = (doc) => {
    if (!user?.id) return;
    const url = `/api/customer/document-preview?partnerId=${user.id}&documentKey=${doc.key}`;
    setPreviewTitle(doc.filename || doc.label);
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const closeDocumentPreview = () => {
    setPreviewOpen(false);
    setPreviewUrl('');
    setPreviewTitle('');
  };

  const selectedOperation = ops.find((item) => String(item.id) === String(selectedOperationId)) || null;

  const setFacturaError = (message) => {
    setFacturaState((prev) => ({ ...prev, error: message || '' }));
  };

  const fetchFacturaStatus = useCallback(async (operationId, showLoader = true) => {
    if (!operationId) return;
    if (showLoader) {
      setFacturaState((prev) => ({ ...prev, loadingStatus: true, error: '' }));
    }

    try {
      const response = await fetchWithRetry(`/api/operaciones/${operationId}/factura/status`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo consultar estatus de factura');
      }

      const mapped = mapFacturaStatusPayload(data);
      setFacturaState((prev) => ({
        ...prev,
        ...mapped,
        loadingStatus: false,
        error: '',
      }));
    } catch (error) {
      setFacturaState((prev) => ({
        ...prev,
        loadingStatus: false,
        error: error.message || 'Error consultando estatus de factura',
      }));
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'operacion_docs' || !selectedOperationId) return;
    fetchFacturaStatus(selectedOperationId);
  }, [activeTab, selectedOperationId, fetchFacturaStatus]);

  const pushHistoryEntry = (result, message) => {
    setFacturaState((prev) => ({
      ...prev,
      validationHistory: [
        {
          date: new Date().toISOString(),
          result,
          message: message || '',
        },
        ...prev.validationHistory,
      ],
    }));
  };

  const validateCfdiWithBackend = async (operationId, cfdiData) => {
    setFacturaState((prev) => ({ ...prev, validating: true, error: '' }));
    try {
      const response = await fetchWithRetry('/api/cfdi/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operationId,
          ...cfdiData,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo validar CFDI');
      }

      const status = normalizeFacturaStatus(data?.status || 'pendiente');
      setFacturaState((prev) => ({
        ...prev,
        status,
        statusLabel: getFacturaStatusLabel(status),
        backendMessage: data?.message || '',
      }));
      pushHistoryEntry(status, data?.message || 'Validacion SAT ejecutada');
      await fetchFacturaStatus(operationId, false);
    } catch (error) {
      setFacturaState((prev) => ({
        ...prev,
        status: 'error_validacion',
        statusLabel: getFacturaStatusLabel('error_validacion'),
        backendMessage: '',
        error: error.message || 'Error durante validacion SAT',
      }));
      pushHistoryEntry('error_validacion', error.message || 'Error de validacion');
    } finally {
      setFacturaState((prev) => ({ ...prev, validating: false }));
    }
  };

  const uploadFacturaFile = async (typeKey, file) => {
    if (!selectedOperationId) {
      setFacturaError('Selecciona una operacion');
      return;
    }

    if (!file) {
      setFacturaError('Selecciona un archivo');
      return;
    }

    const allowed = typeKey === 'xml' ? /\.xml$/i : /\.pdf$/i;
    if (!allowed.test(file.name || '')) {
      setFacturaError(typeKey === 'xml' ? 'Solo se permite XML' : 'Solo se permite PDF');
      return;
    }

    setFacturaState((prev) => ({ ...prev, uploadingType: typeKey, error: '' }));

    try {
      let parsedCfdi = null;
      if (typeKey === 'xml' && facturaState.documentType === 'cfdi') {
        const xmlText = await file.text();
        const parsed = parseCfdiXml(xmlText);
        if (!parsed.isCfdi || parsed.error) {
          throw new Error(parsed.error || 'XML CFDI invalido');
        }
        parsedCfdi = parsed.data;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', typeKey);
      formData.append('documentType', facturaState.documentType);
      if (parsedCfdi) {
        formData.append('cfdiData', JSON.stringify(parsedCfdi));
      }

      const response = await fetchWithRetry(`/api/operaciones/${selectedOperationId}/factura/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo subir factura');
      }

      const nowLabel = new Date().toLocaleString();
      const uploadedBy = user?.name || user?.rfc || 'Usuario';
      setFacturaState((prev) => ({
        ...prev,
        filesByType: {
          ...prev.filesByType,
          [typeKey]: {
            name: file.name,
            uploadedAt: nowLabel,
            uploadedBy,
          },
        },
        cfdiData: parsedCfdi || prev.cfdiData,
        backendMessage: data?.message || '',
      }));

      if (facturaState.documentType === 'extranjera') {
        setFacturaState((prev) => ({
          ...prev,
          status: 'no_aplica',
          statusLabel: getFacturaStatusLabel('no_aplica'),
        }));
        pushHistoryEntry('no_aplica', 'Factura extranjera: no aplica validacion SAT');
      } else if (typeKey === 'xml' && parsedCfdi) {
        pushHistoryEntry('pendiente', 'XML cargado, iniciando validacion SAT');
        await validateCfdiWithBackend(selectedOperationId, parsedCfdi);
      } else {
        await fetchFacturaStatus(selectedOperationId, false);
      }
    } catch (error) {
      setFacturaState((prev) => ({
        ...prev,
        status: 'error_validacion',
        statusLabel: getFacturaStatusLabel('error_validacion'),
        error: error.message || 'No se pudo subir el archivo',
      }));
      pushHistoryEntry('error_validacion', error.message || 'Error en carga de factura');
    } finally {
      setFacturaState((prev) => ({ ...prev, uploadingType: '' }));
    }
  };

  const deleteFacturaFile = async (typeKey) => {
    if (!selectedOperationId) return;

    setFacturaState((prev) => ({ ...prev, uploadingType: typeKey, error: '' }));
    try {
      const formData = new FormData();
      formData.append('action', 'delete');
      formData.append('fileType', typeKey);
      const response = await fetchWithRetry(`/api/operaciones/${selectedOperationId}/factura/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'No se pudo eliminar archivo');
      }

      setFacturaState((prev) => ({
        ...prev,
        filesByType: { ...prev.filesByType, [typeKey]: null },
        backendMessage: data?.message || '',
      }));
      await fetchFacturaStatus(selectedOperationId, false);
    } catch (error) {
      setFacturaError(error.message || 'Error al eliminar archivo');
    } finally {
      setFacturaState((prev) => ({ ...prev, uploadingType: '' }));
    }
  };

  const canSendCurrentOperation = canSendToOperation({
    requiresValidCfdi: facturaState.requiresValidCfdi,
    status: facturaState.status,
    documentType: facturaState.documentType,
    hasEvidence: Boolean(facturaState.filesByType.xml || facturaState.filesByType.pdf),
  });

  const handleSendToOperation = async () => {
    if (!canSendCurrentOperation) {
      setFacturaError('No puedes enviar mientras la factura no cumpla la politica de validacion');
      return;
    }
    setFacturaState((prev) => ({ ...prev, sendingOperation: true, error: '' }));
    setTimeout(() => {
      setFacturaState((prev) => ({
        ...prev,
        sendingOperation: false,
        backendMessage: 'Operacion lista para envio',
      }));
    }, 600);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#212121] p-4 lg:p-8 font-sans transition-colors duration-500">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-xs font-black text-[#3D6332] uppercase tracking-[0.3em] mb-2">RFC: {user?.rfc}</h2>
          <h1 className="text-4xl font-black text-[#212121] dark:text-white tracking-tight">
            Hola, <span className="italic text-slate-400">{user?.name?.split(' ')[0]}</span>
          </h1>
        </div>

        <div className="flex gap-3 items-center">
          <div className="relative ml-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar operacion..."
              className="bg-white dark:bg-[#2A2A2A] border border-slate-200 dark:border-[#3A3A3A] rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none dark:text-white shadow-sm w-48 md:w-64"
            />
          </div>

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl bg-white dark:bg-[#2A2A2A] border border-slate-200 dark:border-[#3A3A3A] shadow-sm hover:bg-slate-50 dark:hover:bg-[#333333] transition-all"
            title="Cambiar tema"
          >
            {theme === 'dark' ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-[#3D6332]" />}
          </button>

          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl bg-white dark:bg-[#2A2A2A] border border-red-100 dark:border-red-900/30 text-red-500 shadow-sm hover:bg-red-50 dark:hover:bg-red-950/30 transition-all flex items-center gap-2"
            title="Cerrar sesion"
          >
            <LogOut size={20} />
            <span className="text-xs font-black uppercase hidden md:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        <div className="bg-white dark:bg-[#2A2A2A] rounded-2xl border border-slate-200 dark:border-[#3A3A3A] p-2 inline-flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('principal')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'principal'
                ? 'bg-[#3D6332] text-white'
                : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-[#333333]'
            }`}
          >
            Principal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('documentacion')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'documentacion'
                ? 'bg-[#3D6332] text-white'
                : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-[#333333]'
            }`}
          >
            Documentacion
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('operacion_docs')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === 'operacion_docs'
                ? 'bg-[#3D6332] text-white'
                : 'bg-transparent text-slate-500 hover:bg-slate-100 dark:hover:bg-[#333333]'
            }`}
          >
            Documentos operacion
          </button>
        </div>

        {activeTab === 'principal' && (
          <>
            {pendingCount > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                <p className="text-xs font-black uppercase tracking-widest text-amber-700 dark:text-amber-300">
                  Documentos pendientes, favor de verificar
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard icon={<FileText className="text-[#3D6332]" />} label="Total Trafico" value={ops.length.toString().padStart(2, '0')} sub="Operaciones activas" />
              <StatCard icon={<Gavel className="text-amber-500" />} label="Pagados" value="--" sub="Sincronizando..." />
              <StatCard icon={<AlertOctagon className="text-red-500" />} label="Rojos" value="--" sub="Reconocimiento" />
              <StatCard icon={<CheckSquare className="text-emerald-500" />} label="Concluidos" value="--" sub="Historico" />
            </div>

            <div className="bg-white dark:bg-[#262626] rounded-[2.5rem] border border-slate-200 dark:border-[#3A3A3A] overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 dark:border-[#3A3A3A] flex justify-between items-center">
                <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter text-lg">Trafico de {user?.name}</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50/50 dark:bg-[#303030]/70">
                    <tr>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Referencia</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estatus</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vencimiento</th>
                      <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-[#3A3A3A]">
                    {loading ? (
                      <tr><td colSpan="4" className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#3D6332]" /></td></tr>
                    ) : ops.length > 0 ? ops.map((op) => (
                      <tr key={op.id} className="hover:bg-slate-50/80 dark:hover:bg-[#303030] transition-colors">
                        <td className="p-5">
                          <div className="font-black text-[#3D6332] text-sm">{op.display_name}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">{op.priority === '3' ? 'URGENTE' : 'NORMAL'}</div>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#3D6332] animate-pulse"></span>
                            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">{op.stage_id ? op.stage_id[1] : 'S/E'}</span>
                          </div>
                        </td>
                        <td className="p-5 text-sm font-bold text-slate-500 italic">
                          {op.create_date ? new Date(op.create_date).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-5 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedOperationId(String(op.id));
                              setActiveTab('operacion_docs');
                            }}
                            className="p-2 hover:bg-[#3D6332] hover:text-white rounded-xl transition-all text-slate-400"
                          >
                            <ArrowUpRight size={20} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-bold uppercase italic text-sm tracking-widest">No se encontraron operaciones activas.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'documentacion' && (
          <div className="bg-white dark:bg-[#262626] rounded-[2.5rem] border border-slate-200 dark:border-[#3A3A3A] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-[#3A3A3A] flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter text-lg">
                Documentacion
              </h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                Tipo: {personType === 'moral' ? 'Persona moral' : 'Persona fisica'}
              </p>
            </div>

            <div className="p-6">
              <input
                type="file"
                ref={documentInputRef}
                onChange={handleDocumentFileSelected}
                className="hidden"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {documentsLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="animate-spin text-[#3D6332] mx-auto" size={20} />
                  </div>
                ) : documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.key} className="border border-slate-200 dark:border-[#3A3A3A] rounded-2xl p-4 dark:bg-[#242424]">
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => openFileSelectorForDocument(doc.key)}
                          disabled={uploadingDocumentKey === doc.key}
                          className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${
                            uploadingDocumentKey === doc.key
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-[#3D6332] text-white hover:bg-[#33542A]'
                          }`}
                        >
                          {uploadingDocumentKey === doc.key ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                          {uploadingDocumentKey === doc.key ? 'Subiendo...' : 'Subir'}
                        </button>

                        {doc.status === 'cargado' && (
                          <button
                            type="button"
                            onClick={() => openDocumentPreview(doc)}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#3D6332] text-[#3D6332] dark:text-[#A7D19B] bg-[#3D6332]/10 dark:bg-[#3D6332]/25 hover:bg-[#3D6332] hover:text-white transition-all"
                          >
                            Ver
                          </button>
                        )}

                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase">{doc.label}</p>

                        <div className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${
                          doc.status === 'cargado'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {doc.status === 'cargado' ? 'Cargado' : 'Pendiente faltante'}
                        </div>
                      </div>

                      <p className="mt-2 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {doc.filename || 'Sin archivo cargado'}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400">No hay documentos configurados.</p>
                )}
              </div>
            </div>

            {(docMessage || docError) && (
              <div className="px-6 pb-6">
                {docMessage && (
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{docMessage}</p>
                )}
                {docError && (
                  <p className="text-xs font-bold text-red-500 uppercase tracking-wider">{docError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'operacion_docs' && (
          <div className="bg-white dark:bg-[#262626] rounded-[2.5rem] border border-slate-200 dark:border-[#3A3A3A] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 dark:border-[#3A3A3A] space-y-4">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase tracking-tighter text-lg">
                    Documentos de operacion
                  </h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-1">
                    Factura de mercancia por operacion
                  </p>
                </div>

                <div className="w-full md:w-[320px]">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Operacion</label>
                  <select
                    value={selectedOperationId}
                    onChange={(event) => setSelectedOperationId(event.target.value)}
                    className="mt-1 w-full bg-slate-50 dark:bg-[#2E2E2E] border border-slate-200 dark:border-[#3A3A3A] rounded-xl py-3 px-3 text-sm font-bold outline-none text-slate-800 dark:text-slate-100"
                  >
                    {!ops.length && <option value="">Sin operaciones</option>}
                    {ops.map((op) => (
                      <option key={op.id} value={op.id}>
                        {op.display_name || op.name || `Operacion ${op.id}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedOperation && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <InfoPill label="Referencia" value={selectedOperation.display_name || `Operacion ${selectedOperation.id}`} />
                  <InfoPill label="Estatus Odoo" value={selectedOperation.stage_id?.[1] || 'S/E'} />
                  <InfoPill
                    label="Alta"
                    value={selectedOperation.create_date ? new Date(selectedOperation.create_date).toLocaleDateString() : 'Sin fecha'}
                  />
                </div>
              )}
            </div>

            <div className="p-6 space-y-6">
              {facturaState.loadingStatus ? (
                <div className="py-8 text-center">
                  <Loader2 className="animate-spin text-[#3D6332] mx-auto" size={20} />
                </div>
              ) : !selectedOperationId ? (
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Selecciona una operacion para comenzar.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-4">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <input
                        type="radio"
                        checked={facturaState.documentType === 'cfdi'}
                        onChange={() => setFacturaState((prev) => ({ ...prev, documentType: 'cfdi' }))}
                      />
                      Factura CFDI
                    </label>
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                      <input
                        type="radio"
                        checked={facturaState.documentType === 'extranjera'}
                        onChange={() => setFacturaState((prev) => ({ ...prev, documentType: 'extranjera' }))}
                      />
                      Factura extranjera / No CFDI
                    </label>
                  </div>

                  <DocumentUploadSection
                    title="Factura de mercancia"
                    subtitle={facturaState.requiresValidCfdi ? 'Politica: CFDI valido requerido' : 'Politica: evidencia documental'}
                    status={facturaState.status}
                    statusLabel={facturaState.statusLabel}
                    documentTypes={FACTURA_DOCUMENT_TYPES}
                    filesByType={facturaState.filesByType}
                    onFileSelected={uploadFacturaFile}
                    onDeleteFile={deleteFacturaFile}
                    isUploading={Boolean(facturaState.uploadingType)}
                    uploadTarget={facturaState.uploadingType}
                  />

                  {facturaState.cfdiData && (
                    <div className="border border-slate-200 dark:border-[#3A3A3A] rounded-xl p-4 bg-slate-50/60 dark:bg-[#2D2D2D]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Datos CFDI detectados</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                        <p>UUID: {facturaState.cfdiData.uuid || 'N/A'}</p>
                        <p>RFC Emisor: {facturaState.cfdiData.rfcEmisor || 'N/A'}</p>
                        <p>RFC Receptor: {facturaState.cfdiData.rfcReceptor || 'N/A'}</p>
                        <p>Total: {facturaState.cfdiData.total || 'N/A'} {facturaState.cfdiData.moneda || ''}</p>
                        <p>Fecha: {facturaState.cfdiData.fecha || 'N/A'}</p>
                      </div>
                    </div>
                  )}

                  <div className="border border-slate-200 dark:border-[#3A3A3A] rounded-xl p-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-3">Historial de validaciones</p>
                    {facturaState.validationHistory.length ? (
                      <div className="space-y-2">
                        {facturaState.validationHistory.map((entry, idx) => (
                          <div key={`${entry.date || idx}-${idx}`} className="rounded-lg border border-slate-200 dark:border-[#3A3A3A] p-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                              {entry.date ? new Date(entry.date).toLocaleString() : 'Sin fecha'} · {getFacturaStatusLabel(entry.result)}
                            </p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">{entry.message || 'Sin detalle'}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Sin validaciones registradas.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSendToOperation}
                      disabled={!canSendCurrentOperation || facturaState.sendingOperation || facturaState.validating}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        !canSendCurrentOperation || facturaState.sendingOperation || facturaState.validating
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-[#3D6332] text-white hover:bg-[#33542A]'
                      }`}
                    >
                      {facturaState.sendingOperation ? 'Enviando...' : 'Enviar a operacion'}
                    </button>

                    <button
                      type="button"
                      onClick={() => fetchFacturaStatus(selectedOperationId)}
                      className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#3D6332] text-[#3D6332] dark:text-[#A7D19B] hover:bg-[#3D6332] hover:text-white transition-all"
                    >
                      Refrescar estatus
                    </button>

                    {facturaState.validating && (
                      <p className="text-[11px] font-black uppercase tracking-widest text-[#3D6332]">Validando en SAT...</p>
                    )}
                  </div>

                  {facturaState.backendMessage && (
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">{facturaState.backendMessage}</p>
                  )}
                  {facturaState.error && (
                    <p className="text-xs font-bold text-red-500 uppercase tracking-wider">{facturaState.error}</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {previewOpen && (
          <div className="fixed inset-0 z-50 bg-[#212121]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-5xl h-[80vh] bg-white dark:bg-[#262626] rounded-2xl border border-slate-200 dark:border-[#3A3A3A] overflow-hidden shadow-2xl">
              <div className="h-14 px-4 border-b border-slate-200 dark:border-[#3A3A3A] flex items-center justify-between">
                <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{previewTitle}</p>
                <button
                  type="button"
                  onClick={closeDocumentPreview}
                  className="px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wide bg-slate-100 dark:bg-[#333333] text-slate-700 dark:text-slate-200"
                >
                  Cerrar
                </button>
              </div>
              <iframe
                title="Preview documento"
                src={previewUrl}
                className="w-full h-[calc(80vh-56px)] bg-white"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="bg-white dark:bg-[#262626] p-6 rounded-3xl border border-slate-200 dark:border-[#3A3A3A] shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-[#333333] flex items-center justify-center mb-4">{icon}</div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{value}</h3>
      <p className="text-[10px] font-bold text-slate-500 uppercase italic">{sub}</p>
    </div>
  );
}

function InfoPill({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#3A3A3A] px-3 py-2 bg-slate-50/70 dark:bg-[#2C2C2C]">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-1">{value}</p>
    </div>
  );
}
