import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const config = {
  url: 'http://127.0.0.1:8069',
  db: 'aduanex_pro_v1',
  username: 'admin',
  password: '50e07cd9a97f6a3c0ef3c7c0412be1c995591c73',
};

/**
 * POST /api/auth/register
 * Body: { name, email, phone, password, rfc, csf_b64, csf_filename }
 *
 * Crea un res.partner con x_portal_status='pending' vía XML-RPC.
 * La agencia aprueba desde Odoo antes de que el cliente pueda iniciar sesión.
 */
export async function POST(request) {
  try {
    const { name, email, phone, password, rfc, csf_b64, csf_filename } = await request.json();

    if (!name || !email || !phone || !password || !rfc || !csf_b64) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'El correo electrónico no es válido' }, { status: 400 });
    }

    return new Promise((resolve) => {
      const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

      common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authErr, uid) => {
        if (authErr || !uid || typeof uid !== 'number') {
          console.error('register auth error:', authErr);
          return resolve(NextResponse.json({ error: 'Error de autenticación con el servidor' }, { status: 500 }));
        }

        const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });

        // Verificar que el RFC no exista ya
        models.methodCall('execute_kw', [
          config.db, uid, config.password,
          'res.partner', 'search_read',
          [[['vat', '=', rfc.trim().toUpperCase()]]],
          { fields: ['id'], limit: 1 },
        ], (searchErr, existing) => {
          if (searchErr) {
            return resolve(NextResponse.json({ error: 'Error verificando el RFC' }, { status: 500 }));
          }

          if (existing && existing.length > 0) {
            return resolve(NextResponse.json(
              { error: 'Este RFC ya está registrado. Si ya tienes cuenta, inicia sesión.' },
              { status: 409 }
            ));
          }

          // Crear el partner con estado pendiente
          models.methodCall('execute_kw', [
            config.db, uid, config.password,
            'res.partner', 'create',
            [{
              name: name.trim(),
              email: email.trim().toLowerCase(),
              phone: phone.trim(),
              vat: rfc.trim().toUpperCase(),
              x_contact_role: 'cliente',
              x_portal_status: 'pending',
              x_portal_password: password,
              x_csf_file: csf_b64,
              x_csf_filename: csf_filename || 'csf.pdf',
              is_company: false,
              customer_rank: 1,
            }],
          ], (createErr, partnerId) => {
            if (createErr) {
              console.error('register create error:', createErr.message || createErr);
              return resolve(NextResponse.json({ error: 'Error al crear el registro en el servidor' }, { status: 500 }));
            }

            console.log(`Portal: nuevo registro pendiente partner_id=${partnerId} rfc=${rfc}`);
            resolve(NextResponse.json({
              success: true,
              message: 'Solicitud enviada. La agencia revisará tu información y recibirás confirmación por correo.',
            }));
          });
        });
      });
    });
  } catch (err) {
    console.error('register route error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
