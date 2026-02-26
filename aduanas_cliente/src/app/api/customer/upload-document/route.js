import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const ALLOWED_KEYS = new Set([
  'x_pf_programa_fomento',
  'x_pf_fotos_instalaciones',
  'x_pf_sellos_vucem',
  'x_pf_contrato_servicios',
  'x_pf_carta_69b',
  'x_pf_cuestionario_oea_ctpat',
  'x_pf_autorizacion_shipper_export',
  'x_pf_convenio_confidencialidad',
  'x_pf_info_atencion_ce',
  'x_pf_opinion_cumplimiento_mensual',
  'x_pf_pantalla_domicilio_localizado',
  'x_pm_acta_constitutiva',
  'x_pm_poder_representante',
  'x_pm_doc_propiedad_posesion',
  'x_pm_rep_identificacion',
  'x_pm_rep_rfc_csf',
  'x_pm_rep_opinion_cumplimiento',
  'x_pm_acta_verificacion_domicilio',
  'x_pm_comprobante_domicilio',
  'x_pm_opinion_32d',
  'x_pm_carta_encomienda',
  'x_pm_acuse_encargo_conferido',
  'x_pm_programa_fomento',
  'x_pm_sellos_vucem',
  'x_pm_fotos_instalaciones',
  'x_pm_contrato_servicios',
  'x_pm_carta_69b',
  'x_pm_cuestionarios_oea_ctpat',
  'x_pm_autorizacion_shipper_export',
  'x_pm_convenio_confidencialidad',
]);

export async function POST(request) {
  try {
    const formData = await request.formData();
    const partnerIdRaw = formData.get('partnerId');
    const documentKeyRaw = formData.get('documentKey');
    const file = formData.get('file');

    const partnerId = Number(partnerIdRaw);
    const documentKey = typeof documentKeyRaw === 'string' ? documentKeyRaw.trim() : '';

    if (!partnerId || Number.isNaN(partnerId)) {
      return NextResponse.json({ error: 'partnerId invalido' }, { status: 400 });
    }

    if (!documentKey || !ALLOWED_KEYS.has(documentKey)) {
      return NextResponse.json({ error: 'Documento invalido' }, { status: 400 });
    }

    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const originalFileName = typeof file.name === 'string' && file.name.trim()
      ? file.name.trim()
      : `${documentKey}_sin_nombre`;

    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: 'Archivo vacio' }, { status: 400 });
    }

    const fileBase64 = buffer.toString('base64');

    const config = {
      url: 'http://127.0.0.1:8069',
      db: 'odoo18',
      username: 'admin',
      password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
    };

    const fileField = `${documentKey}_file`;
    const filenameField = `${documentKey}_filename`;

    return new Promise((resolve) => {
      const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

      common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authError, uid) => {
        if (authError || !uid) {
          return resolve(NextResponse.json({ error: 'Auth failed' }, { status: 500 }));
        }

        const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
        models.methodCall('execute_kw', [
          config.db,
          uid,
          config.password,
          'res.partner',
          'write',
          [[partnerId], { [fileField]: fileBase64, [filenameField]: originalFileName }],
        ], (writeError, writeOk) => {
          if (writeError || !writeOk) {
            return resolve(NextResponse.json({ error: 'No se pudo guardar el documento en Odoo' }, { status: 500 }));
          }

          return resolve(NextResponse.json({ success: true }));
        });
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
