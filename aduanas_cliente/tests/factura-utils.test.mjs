import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseCfdiXml,
  normalizeFacturaStatus,
  canSendToOperation,
} from '../src/lib/factura-utils.mjs';

test('parseCfdiXml extrae datos clave de CFDI', () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante Fecha="2026-02-20T13:00:00" Total="1234.56" Moneda="MXN" xmlns:cfdi="http://www.sat.gob.mx/cfd/4">
  <cfdi:Emisor Rfc="AAA010101AAA" />
  <cfdi:Receptor Rfc="BBB010101BBB" />
  <cfdi:Complemento>
    <tfd:TimbreFiscalDigital UUID="abc-def-123" xmlns:tfd="http://www.sat.gob.mx/TimbreFiscalDigital" />
  </cfdi:Complemento>
</cfdi:Comprobante>`;

  const parsed = parseCfdiXml(xml);
  assert.equal(parsed.isCfdi, true);
  assert.equal(parsed.error, '');
  assert.equal(parsed.data.uuid, 'ABC-DEF-123');
  assert.equal(parsed.data.rfcEmisor, 'AAA010101AAA');
  assert.equal(parsed.data.rfcReceptor, 'BBB010101BBB');
  assert.equal(parsed.data.total, '1234.56');
  assert.equal(parsed.data.moneda, 'MXN');
  assert.equal(parsed.data.fecha, '2026-02-20T13:00:00');
});

test('normalizeFacturaStatus soporta aliases', () => {
  assert.equal(normalizeFacturaStatus('valid'), 'valido');
  assert.equal(normalizeFacturaStatus('invalido'), 'invalido');
  assert.equal(normalizeFacturaStatus('NOT_APPLICABLE'), 'no_aplica');
  assert.equal(normalizeFacturaStatus('desconocido'), 'pendiente');
});

test('canSendToOperation aplica reglas de CFDI y extranjero', () => {
  assert.equal(
    canSendToOperation({
      requiresValidCfdi: true,
      status: 'valido',
      documentType: 'cfdi',
      hasEvidence: true,
    }),
    true,
  );

  assert.equal(
    canSendToOperation({
      requiresValidCfdi: true,
      status: 'pendiente',
      documentType: 'cfdi',
      hasEvidence: true,
    }),
    false,
  );

  assert.equal(
    canSendToOperation({
      requiresValidCfdi: false,
      status: 'no_aplica',
      documentType: 'extranjera',
      hasEvidence: true,
    }),
    true,
  );
});
