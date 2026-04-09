import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const config = {
  url: 'http://127.0.0.1:8069',
  db: 'aduanex_pro_v1',
  username: 'admin',
  password: '50e07cd9a97f6a3c0ef3c7c0412be1c995591c73',
};

export async function POST(request) {
  try {
    const { rfc, password } = await request.json();

    return new Promise((resolve) => {
      const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

      common.methodCall('authenticate', [config.db, config.username, config.password, {}], (error, uid) => {
        if (error || !uid || typeof uid !== 'number') {
          console.error('Error Auth:', error || 'UID Inválido');
          return resolve(NextResponse.json({ error: 'Fallo de autenticación sistema' }, { status: 500 }));
        }

        const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });

        models.methodCall('execute_kw', [
          config.db, uid, config.password,
          'res.partner', 'search_read',
          [[['vat', '=', rfc.trim().toUpperCase()]]],
          { fields: ['name', 'vat', 'email', 'id', 'x_portal_password', 'x_portal_status', 'x_contact_role'], limit: 1 }
        ], (err, partners) => {
          if (err || !partners || partners.length === 0) {
            return resolve(NextResponse.json({ error: 'RFC no encontrado' }, { status: 401 }));
          }

          const user = partners[0];

          // Verificar estado de aprobación portal
          if (user.x_portal_status === 'pending') {
            return resolve(NextResponse.json({
              error: 'Tu cuenta está pendiente de aprobación. La agencia revisará tu información y te contactará pronto.',
              portal_status: 'pending',
            }, { status: 403 }));
          }

          if (user.x_portal_status === 'rejected') {
            return resolve(NextResponse.json({
              error: 'Tu solicitud de registro fue rechazada. Contacta a la agencia para más información.',
              portal_status: 'rejected',
            }, { status: 403 }));
          }

          // Validar contraseña: si tiene x_portal_password la usa; si no, los primeros 4 del RFC
          const storedPassword = user.x_portal_password;
          const userVat = user.vat || '';
          const fallbackPassword = userVat.substring(0, 4).toUpperCase();
          const validPassword = storedPassword ? storedPassword : fallbackPassword;

          const inputPassword = password || '';
          const passwordMatch = storedPassword
            ? inputPassword === validPassword
            : inputPassword.toUpperCase() === validPassword;

          if (!passwordMatch || userVat === '') {
            return resolve(NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 }));
          }

          const role = user.x_contact_role === 'freight_forwarder' ? 'freight_forwarder' : 'client';

          return resolve(NextResponse.json({
            success: true,
            user: { id: user.id, name: user.name, rfc: user.vat, role }
          }));
        });
      });
    });
  } catch (globalError) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
