import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const PF_DOCUMENTS = [
  { key: 'x_pf_programa_fomento', label: 'Programa fomento / certificacion' },
  { key: 'x_pf_fotos_instalaciones', label: 'Fotografias instalaciones' },
  { key: 'x_pf_sellos_vucem', label: 'Sellos VUCEM' },
  { key: 'x_pf_contrato_servicios', label: 'Contrato servicios' },
  { key: 'x_pf_carta_69b', label: 'Carta 69-B/49 Bis' },
  { key: 'x_pf_cuestionario_oea_ctpat', label: 'Cuestionarios OEA/CTPAT' },
  { key: 'x_pf_autorizacion_shipper_export', label: 'Autorizacion Shipper Export' },
  { key: 'x_pf_convenio_confidencialidad', label: 'Convenio confidencialidad' },
  { key: 'x_pf_info_atencion_ce', label: 'Info atencion Comercio Exterior' },
  { key: 'x_pf_opinion_cumplimiento_mensual', label: 'Opinion cumplimiento mensual' },
  { key: 'x_pf_pantalla_domicilio_localizado', label: 'Pantalla domicilio localizado' },
];

const PM_DOCUMENTS = [
  { key: 'x_pm_acta_constitutiva', label: 'Acta constitutiva' },
  { key: 'x_pm_poder_representante', label: 'Poder representante legal' },
  { key: 'x_pm_doc_propiedad_posesion', label: 'Documento propiedad/posesion' },
  { key: 'x_pm_rep_identificacion', label: 'Identificacion representante' },
  { key: 'x_pm_rep_rfc_csf', label: 'RFC personal representante (CSF)' },
  { key: 'x_pm_rep_opinion_cumplimiento', label: 'Opinion cumplimiento representante' },
  { key: 'x_pm_acta_verificacion_domicilio', label: 'Acta verificacion domicilio' },
  { key: 'x_pm_comprobante_domicilio', label: 'Comprobante domicilio' },
  { key: 'x_pm_opinion_32d', label: 'Opinion cumplimiento 32-D' },
  { key: 'x_pm_carta_encomienda', label: 'Carta encomienda' },
  { key: 'x_pm_acuse_encargo_conferido', label: 'Acuse encargo conferido' },
  { key: 'x_pm_programa_fomento', label: 'Programa fomento/certificacion' },
  { key: 'x_pm_sellos_vucem', label: 'Sellos VUCEM' },
  { key: 'x_pm_fotos_instalaciones', label: 'Fotografias instalaciones' },
  { key: 'x_pm_contrato_servicios', label: 'Contrato servicios' },
  { key: 'x_pm_carta_69b', label: 'Carta 69-B' },
  { key: 'x_pm_cuestionarios_oea_ctpat', label: 'Cuestionarios OEA/CTPAT' },
  { key: 'x_pm_autorizacion_shipper_export', label: 'Autorizacion Shipper Export' },
  { key: 'x_pm_convenio_confidencialidad', label: 'Convenio confidencialidad' },
];

function isMoralPerson(value) {
  if (value === true || value === 't' || value === 'T' || value === 'true') return true;
  return false;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const partnerIdRaw = searchParams.get('partnerId');
  const partnerId = Number(partnerIdRaw);

  if (!partnerId || Number.isNaN(partnerId)) {
    return NextResponse.json({ error: 'partnerId invalido' }, { status: 400 });
  }

  const config = {
    url: 'http://127.0.0.1:8069',
    db: 'odoo18',
    username: 'admin',
    password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
  };

  return new Promise((resolve) => {
    const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

    common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authError, uid) => {
      if (authError || !uid) {
        return resolve(NextResponse.json({ error: 'Auth failed' }, { status: 500 }));
      }

      const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });
      const fields = ['is_company'];
      PF_DOCUMENTS.forEach((doc) => {
        fields.push(`${doc.key}_file`, `${doc.key}_filename`);
      });
      PM_DOCUMENTS.forEach((doc) => {
        fields.push(`${doc.key}_file`, `${doc.key}_filename`);
      });

      models.methodCall('execute_kw', [
        config.db,
        uid,
        config.password,
        'res.partner',
        'read',
        [[partnerId]],
        { fields },
      ], (readError, partners) => {
        if (readError || !Array.isArray(partners) || partners.length === 0) {
          return resolve(NextResponse.json({ error: 'No se pudo leer documentos del cliente' }, { status: 500 }));
        }

        const partner = partners[0];
        const personType = isMoralPerson(partner.is_company) ? 'moral' : 'fisica';
        const sourceDocs = personType === 'moral' ? PM_DOCUMENTS : PF_DOCUMENTS;

        const documents = sourceDocs.map((doc) => {
          const fileField = `${doc.key}_file`;
          const filenameField = `${doc.key}_filename`;
          const hasFile = Boolean(partner[fileField]);
          return {
            key: doc.key,
            label: doc.label,
            fileField,
            filenameField,
            status: hasFile ? 'cargado' : 'pendiente_faltante',
            filename: hasFile ? (partner[filenameField] || 'Archivo sin nombre') : '',
          };
        }).sort((a, b) => {
          if (a.status === b.status) return a.label.localeCompare(b.label);
          return a.status === 'pendiente_faltante' ? -1 : 1;
        });

        const pendingCount = documents.filter((doc) => doc.status === 'pendiente_faltante').length;

        return resolve(NextResponse.json({ personType, pendingCount, documents }));
      });
    });
  });
}
