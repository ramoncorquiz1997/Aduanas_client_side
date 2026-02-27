# Implementacion factura por operacion

## Supuestos de API
- `POST /api/operaciones/:id/factura/upload` recibe `multipart/form-data`:
  - `file`: archivo binario.
  - `fileType`: `xml` o `pdf`.
  - `documentType`: `cfdi` o `extranjera`.
  - `cfdiData` (opcional): JSON con UUID, RFC emisor/receptor, total, moneda, fecha.
  - `action=delete` para eliminar un archivo por `fileType`.
- `GET /api/operaciones/:id/factura/status` devuelve:
  - `status`, `documentType`, `requiresValidCfdi`, `files`, `cfdiData`, `history`, `message`.
- `POST /api/cfdi/validate` devuelve:
  - `status` y `message` tras consulta SAT.

## Reglas implementadas
- CFDI:
  - Se parsea XML en frontend.
  - Si el XML no contiene datos CFDI requeridos, se marca error de validacion.
  - Si parsea correctamente, se invoca validacion SAT y se refresca estatus.
- Factura extranjera/no CFDI:
  - Se marca `No aplica` al subir evidencia.
  - No se invoca validacion SAT.
- Boton `Enviar a operacion`:
  - Si `requiresValidCfdi=true`, exige estatus `Valido`.
  - Si `documentType=extranjera`, exige `No aplica` + evidencia.

## Estados considerados
- `Pendiente`
- `Valido`
- `Invalido`
- `No aplica`
- `Error de validacion`
