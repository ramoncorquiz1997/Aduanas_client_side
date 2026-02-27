import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const ODOO_CONFIG = {
  url: 'http://127.0.0.1:8069',
  db: 'odoo18',
  username: 'admin',
  password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
};

function getXmlRpcClients() {
  return {
    common: xmlrpc.createClient({ url: `${ODOO_CONFIG.url}/xmlrpc/2/common` }),
    models: xmlrpc.createClient({ url: `${ODOO_CONFIG.url}/xmlrpc/2/object` }),
  };
}

function authenticate(common) {
  return new Promise((resolve, reject) => {
    common.methodCall(
      'authenticate',
      [ODOO_CONFIG.db, ODOO_CONFIG.username, ODOO_CONFIG.password, {}],
      (error, uid) => {
        if (error || !uid) {
          reject(new Error('No se pudo autenticar en Odoo'));
          return;
        }
        resolve(uid);
      },
    );
  });
}

function executeKw(models, uid, model, method, args, kwargs = {}) {
  return new Promise((resolve, reject) => {
    models.methodCall(
      'execute_kw',
      [ODOO_CONFIG.db, uid, ODOO_CONFIG.password, model, method, args, kwargs],
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
}

export async function GET(_request, { params }) {
  try {
    const opId = Number(params?.id);
    if (!opId || Number.isNaN(opId)) {
      return NextResponse.json({ error: 'Operacion invalida' }, { status: 400 });
    }

    const { common, models } = getXmlRpcClients();
    const uid = await authenticate(common);

    const leads = await executeKw(
      models,
      uid,
      'crm.lead',
      'read',
      [[opId]],
      {
        fields: [
          'x_factura_xml_file',
          'x_factura_xml_filename',
          'x_factura_pdf_file',
          'x_factura_pdf_filename',
        ],
      },
    );

    if (!Array.isArray(leads) || !leads.length) {
      return NextResponse.json({ error: 'Operacion no encontrada' }, { status: 404 });
    }

    const lead = leads[0];
    const hasXml = Boolean(lead.x_factura_xml_file);
    const hasPdf = Boolean(lead.x_factura_pdf_file);

    let status = 'pendiente';
    let documentType = 'cfdi';
    if (!hasXml && hasPdf) {
      status = 'no_aplica';
      documentType = 'extranjera';
    } else if (hasXml) {
      status = 'pendiente';
      documentType = 'cfdi';
    }

    return NextResponse.json({
      status,
      documentType,
      requiresValidCfdi: true,
      files: {
        xml: hasXml
          ? {
              name: lead.x_factura_xml_filename || 'factura.xml',
              uploadedAt: '',
              uploadedBy: '',
            }
          : null,
        pdf: hasPdf
          ? {
              name: lead.x_factura_pdf_filename || 'factura.pdf',
              uploadedAt: '',
              uploadedBy: '',
            }
          : null,
      },
      cfdiData: null,
      history: [],
      message: '',
    });
  } catch (error) {
    const message = error?.faultString || error?.message || 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
