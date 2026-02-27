import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const ODOO_CONFIG = {
  url: 'http://127.0.0.1:8069',
  db: 'odoo18',
  username: 'admin',
  password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
};

const FIELD_MAP = {
  xml: {
    fileField: 'x_factura_xml_file',
    filenameField: 'x_factura_xml_filename',
  },
  pdf: {
    fileField: 'x_factura_pdf_file',
    filenameField: 'x_factura_pdf_filename',
  },
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

export async function POST(request, context) {
  try {
    const params = await context?.params;
    const opId = Number(params?.id);
    if (!opId || Number.isNaN(opId)) {
      return NextResponse.json({ error: 'Operacion invalida' }, { status: 400 });
    }

    const formData = await request.formData();
    const action = String(formData.get('action') || '').trim().toLowerCase();
    const fileType = String(formData.get('fileType') || '').trim().toLowerCase();
    const fields = FIELD_MAP[fileType];

    if (!fields) {
      return NextResponse.json({ error: 'Tipo de archivo invalido' }, { status: 400 });
    }

    const { common, models } = getXmlRpcClients();
    const uid = await authenticate(common);

    if (action === 'delete') {
      const ok = await executeKw(
        models,
        uid,
        'crm.lead',
        'write',
        [[opId], { [fields.fileField]: false, [fields.filenameField]: false }],
      );
      if (!ok) {
        return NextResponse.json({ error: 'No se pudo eliminar archivo' }, { status: 500 });
      }
      return NextResponse.json({ success: true, message: 'Archivo eliminado correctamente' });
    }

    const file = formData.get('file');
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 });
    }

    const originalFileName = typeof file.name === 'string' && file.name.trim()
      ? file.name.trim()
      : `factura_${fileType}.bin`;
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!buffer.length) {
      return NextResponse.json({ error: 'Archivo vacio' }, { status: 400 });
    }

    const fileBase64 = buffer.toString('base64');
    const ok = await executeKw(
      models,
      uid,
      'crm.lead',
      'write',
      [[opId], { [fields.fileField]: fileBase64, [fields.filenameField]: originalFileName }],
    );

    if (!ok) {
      return NextResponse.json({ error: 'No se pudo guardar factura en Odoo' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Archivo ${fileType.toUpperCase()} cargado correctamente`,
    });
  } catch (error) {
    const message = error?.faultString || error?.message || 'Error interno';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
