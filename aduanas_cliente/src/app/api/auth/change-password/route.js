import { NextResponse } from 'next/server';
const xmlrpc = require('xmlrpc');

const config = {
  url: 'http://127.0.0.1:8069',
  db: 'odoo18',
  username: 'admin',
  password: 'c7923b5f112e5d26bbb25818cc226596077e2c56',
};

/**
 * POST /api/auth/change-password
 * Body: { partnerId, currentPassword, newPassword }
 *
 * Validates the current password (first 4 chars of VAT OR stored x_portal_password),
 * then writes the new password to x_portal_password on res.partner.
 *
 * Requirements on Odoo side:
 *   - Custom field `x_portal_password` (Char) must exist on res.partner model.
 *     If it doesn't exist, the write will fail gracefully.
 */
export async function POST(request) {
  try {
    const { partnerId, currentPassword, newPassword } = await request.json();

    if (!partnerId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    return new Promise((resolve) => {
      const common = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/common` });

      common.methodCall('authenticate', [config.db, config.username, config.password, {}], (authErr, uid) => {
        if (authErr || !uid) {
          return resolve(NextResponse.json({ error: 'Error de autenticación del sistema' }, { status: 500 }));
        }

        const models = xmlrpc.createClient({ url: `${config.url}/xmlrpc/2/object` });

        // Read partner to get VAT and current custom password
        models.methodCall('execute_kw', [
          config.db, uid, config.password,
          'res.partner', 'read',
          [[Number(partnerId)]],
          { fields: ['vat', 'x_portal_password'] },
        ], (readErr, partners) => {
          if (readErr || !Array.isArray(partners) || partners.length === 0) {
            return resolve(NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 }));
          }

          const partner = partners[0];
          const vat = partner.vat || '';

          // Determine valid current password:
          // If x_portal_password is set, use that; otherwise fall back to first 4 chars of VAT
          const storedPassword = partner.x_portal_password;
          const validPassword = storedPassword
            ? storedPassword
            : vat.substring(0, 4).toUpperCase();

          if (currentPassword.toUpperCase() !== validPassword.toUpperCase()) {
            return resolve(NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 }));
          }

          // Write new password to x_portal_password
          models.methodCall('execute_kw', [
            config.db, uid, config.password,
            'res.partner', 'write',
            [[Number(partnerId)], { x_portal_password: newPassword }],
          ], (writeErr, result) => {
            if (writeErr) {
              console.error('Error writing x_portal_password:', writeErr.message);
              // Field may not exist on this Odoo instance — inform the user
              return resolve(NextResponse.json({
                error: 'No se pudo guardar la contraseña. Asegúrate de que el campo x_portal_password existe en res.partner.',
              }, { status: 500 }));
            }

            resolve(NextResponse.json({ success: true, message: 'Contraseña actualizada correctamente' }));
          });
        });
      });
    });
  } catch {
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
