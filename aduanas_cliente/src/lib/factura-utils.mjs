const STATUS_LABELS = {
  pendiente: 'Pendiente',
  valido: 'Valido',
  invalido: 'Invalido',
  no_aplica: 'No aplica',
  error_validacion: 'Error de validacion',
};

const STATUS_ALIASES = {
  pending: 'pendiente',
  pendiente: 'pendiente',
  valid: 'valido',
  valido: 'valido',
  invalid: 'invalido',
  invalido: 'invalido',
  no_aplica: 'no_aplica',
  not_applicable: 'no_aplica',
  error: 'error_validacion',
  error_validacion: 'error_validacion',
};

function pickFirstMatch(xmlText, expressions) {
  for (const expr of expressions) {
    const match = xmlText.match(expr);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

export function normalizeFacturaStatus(rawStatus) {
  if (!rawStatus || typeof rawStatus !== 'string') return 'pendiente';
  const cleaned = rawStatus.trim().toLowerCase();
  return STATUS_ALIASES[cleaned] || 'pendiente';
}

export function getFacturaStatusLabel(status) {
  const normalized = normalizeFacturaStatus(status);
  return STATUS_LABELS[normalized] || STATUS_LABELS.pendiente;
}

export function parseCfdiXml(xmlText) {
  if (!xmlText || typeof xmlText !== 'string') {
    return { isCfdi: false, error: 'XML vacio o invalido', data: null };
  }

  const isCfdi = /<(?:\w+:)?Comprobante[\s>]/i.test(xmlText);
  if (!isCfdi) {
    return { isCfdi: false, error: 'No se detecto nodo Comprobante CFDI', data: null };
  }

  const uuid = pickFirstMatch(xmlText, [
    /<(?:\w+:)?TimbreFiscalDigital[^>]*\bUUID="([^"]+)"/i,
    /<(?:\w+:)?TimbreFiscalDigital[^>]*\buuid="([^"]+)"/i,
  ]);
  const rfcEmisor = pickFirstMatch(xmlText, [
    /<(?:\w+:)?Emisor[^>]*\bRfc="([^"]+)"/i,
    /<(?:\w+:)?Emisor[^>]*\brfc="([^"]+)"/i,
  ]);
  const rfcReceptor = pickFirstMatch(xmlText, [
    /<(?:\w+:)?Receptor[^>]*\bRfc="([^"]+)"/i,
    /<(?:\w+:)?Receptor[^>]*\brfc="([^"]+)"/i,
  ]);
  const total = pickFirstMatch(xmlText, [
    /<(?:\w+:)?Comprobante[^>]*\bTotal="([^"]+)"/i,
    /<(?:\w+:)?Comprobante[^>]*\btotal="([^"]+)"/i,
  ]);
  const moneda = pickFirstMatch(xmlText, [
    /<(?:\w+:)?Comprobante[^>]*\bMoneda="([^"]+)"/i,
    /<(?:\w+:)?Comprobante[^>]*\bmoneda="([^"]+)"/i,
  ]);
  const fecha = pickFirstMatch(xmlText, [
    /<(?:\w+:)?Comprobante[^>]*\bFecha="([^"]+)"/i,
    /<(?:\w+:)?Comprobante[^>]*\bfecha="([^"]+)"/i,
  ]);

  const parsed = {
    uuid: uuid.toUpperCase(),
    rfcEmisor: rfcEmisor.toUpperCase(),
    rfcReceptor: rfcReceptor.toUpperCase(),
    total,
    moneda: moneda.toUpperCase(),
    fecha,
  };

  const missing = Object.entries(parsed)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  return {
    isCfdi: true,
    data: parsed,
    error: missing.length ? `Faltan campos CFDI: ${missing.join(', ')}` : '',
  };
}

export function canSendToOperation({
  requiresValidCfdi,
  status,
  documentType,
  hasEvidence,
}) {
  const normalized = normalizeFacturaStatus(status);

  if (documentType === 'extranjera') {
    return normalized === 'no_aplica' && Boolean(hasEvidence);
  }

  if (requiresValidCfdi) {
    return normalized === 'valido';
  }

  return Boolean(hasEvidence);
}

export async function fetchWithRetry(url, options = {}, retryConfig = {}) {
  const retries = Number.isInteger(retryConfig.retries) ? retryConfig.retries : 2;
  const retryDelayMs = Number.isInteger(retryConfig.retryDelayMs) ? retryConfig.retryDelayMs : 900;
  const retryOnStatuses = Array.isArray(retryConfig.retryOnStatuses)
    ? retryConfig.retryOnStatuses
    : [429, 500, 502, 503, 504];

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (!retryOnStatuses.includes(response.status) || attempt === retries) {
        return response;
      }
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    } catch (error) {
      lastError = error;
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    }
  }

  throw lastError || new Error('No se pudo completar la solicitud');
}
