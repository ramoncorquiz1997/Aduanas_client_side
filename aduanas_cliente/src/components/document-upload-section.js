"use client";

import React, { useRef, useState } from 'react';
import { Upload, FileText, Trash2, RefreshCw, Loader2 } from 'lucide-react';

const STATUS_STYLES = {
  pendiente: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  valido: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  invalido: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  no_aplica: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  error_validacion: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
};

export function StatusBadge({ status, label }) {
  return (
    <span
      className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
        STATUS_STYLES[status] || STATUS_STYLES.pendiente
      }`}
    >
      {label}
    </span>
  );
}

export default function DocumentUploadSection({
  title,
  subtitle,
  status,
  statusLabel,
  documentTypes,
  filesByType,
  onFileSelected,
  onDeleteFile,
  isUploading,
  uploadTarget,
}) {
  const [dragOverKey, setDragOverKey] = useState('');
  const fileInputRefs = useRef({});

  const openSelector = (typeKey) => {
    fileInputRefs.current[typeKey]?.click();
  };

  const handlePick = (event, typeKey) => {
    const selectedFile = event.target.files?.[0] || null;
    event.target.value = '';
    if (!selectedFile) return;
    onFileSelected(typeKey, selectedFile);
  };

  const handleDrop = (event, typeKey) => {
    event.preventDefault();
    setDragOverKey('');
    const droppedFile = event.dataTransfer.files?.[0] || null;
    if (!droppedFile) return;
    onFileSelected(typeKey, droppedFile);
  };

  return (
    <section className="border border-slate-200 dark:border-[#3A3A3A] rounded-2xl p-4 dark:bg-[#242424] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-black uppercase tracking-wide text-slate-900 dark:text-slate-100">{title}</h4>
          {subtitle && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        <StatusBadge status={status} label={statusLabel} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {documentTypes.map((docType) => {
          const file = filesByType[docType.key] || null;
          const isBusy = isUploading && uploadTarget === docType.key;
          const isDragOver = dragOverKey === docType.key;

          return (
            <div
              key={docType.key}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOverKey(docType.key);
              }}
              onDragLeave={() => setDragOverKey('')}
              onDrop={(event) => handleDrop(event, docType.key)}
              className={`rounded-xl border-2 border-dashed p-4 transition-all ${
                isDragOver
                  ? 'border-[#3D6332] bg-[#3D6332]/10'
                  : 'border-slate-200 dark:border-[#454545] bg-slate-50/50 dark:bg-[#2F2F2F]/60'
              }`}
            >
              <input
                type="file"
                ref={(el) => {
                  fileInputRefs.current[docType.key] = el;
                }}
                accept={docType.accept}
                onChange={(event) => handlePick(event, docType.key)}
                className="hidden"
              />

              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">
                    {docType.label}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {docType.hint}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openSelector(docType.key)}
                  disabled={isBusy}
                  className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                    isBusy
                      ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      : 'bg-[#3D6332] text-white hover:bg-[#33542A]'
                  }`}
                >
                  {isBusy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {file ? 'Reemplazar' : 'Seleccionar'}
                </button>
              </div>

              {file ? (
                <div className="mt-3 rounded-lg bg-white dark:bg-[#262626] border border-slate-200 dark:border-[#3A3A3A] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText size={15} className="text-[#3D6332]" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    Cargado por {file.uploadedBy || 'Usuario'} · {file.uploadedAt || 'Sin fecha'}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => openSelector(docType.key)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border border-[#3D6332] text-[#3D6332] dark:text-[#A7D19B] hover:bg-[#3D6332] hover:text-white transition-all flex items-center gap-1"
                    >
                      <RefreshCw size={12} />
                      Reemplazar
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteFile(docType.key)}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wide border border-red-300 text-red-600 hover:bg-red-600 hover:text-white transition-all flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Arrastra y suelta el archivo o usa seleccionar.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
