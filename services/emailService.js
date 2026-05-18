import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || 'Plaza de Abastos <onboarding@resend.dev>';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Plantilla HTML base ──────────────────────────────────────────
const wrapHtml = (title, body) => `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <!-- Header -->
        <tr>
          <td style="background:#8b2332;padding:24px 32px;text-align:center;">
            <h1 style="margin:0;font-size:22px;color:#fff;font-family:Georgia,serif;">Plaza de Abastos</h1>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;background:#fafafa;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#999;">
              Este es un proyecto académico sin ánimo de lucro. Todos los datos son ficticios.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Verificación de email ────────────────────────────────────────
export const sendVerificationEmail = async (to, nombre, token) => {
  const link = `${FRONTEND_URL}?verify=${token}`;
  const html = wrapHtml('Verifica tu email', `
    <h2 style="margin:0 0 12px;color:#333;font-size:20px;">¡Hola ${nombre}!</h2>
    <p style="color:#555;line-height:1.6;">
      Gracias por registrarte en Plaza de Abastos. Para activar tu cuenta, confirma tu dirección de email:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}" style="background:#8b2332;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Verificar email
      </a>
    </div>
    <p style="color:#999;font-size:13px;">Si no creaste esta cuenta, ignora este mensaje.</p>
  `);

  await resend.emails.send({ from: FROM, to, subject: 'Verifica tu email — Plaza de Abastos', html });
};

// ── Reset de contraseña ──────────────────────────────────────────
export const sendPasswordResetEmail = async (to, nombre, token) => {
  const link = `${FRONTEND_URL}?reset=${token}`;
  const html = wrapHtml('Restablecer contraseña', `
    <h2 style="margin:0 0 12px;color:#333;font-size:20px;">Hola ${nombre},</h2>
    <p style="color:#555;line-height:1.6;">
      Hemos recibido una solicitud para restablecer la contraseña de tu cuenta. Haz clic en el botón para crear una nueva:
    </p>
    <div style="text-align:center;margin:28px 0;">
      <a href="${link}" style="background:#8b2332;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;">
        Restablecer contraseña
      </a>
    </div>
    <p style="color:#999;font-size:13px;">Este enlace expira en 1 hora. Si no solicitaste el cambio, ignora este mensaje.</p>
  `);

  await resend.emails.send({ from: FROM, to, subject: 'Restablecer contraseña — Plaza de Abastos', html });
};

// ── Confirmación de pedido ───────────────────────────────────────
export const sendOrderConfirmationEmail = async (to, nombre, order, subOrders) => {
  let itemsHtml = '';
  for (const sub of subOrders) {
    itemsHtml += `<tr><td colspan="3" style="padding:12px 0 4px;font-weight:700;color:#8b2332;font-size:14px;border-bottom:1px solid #eee;">${sub.vendedorNombre}</td></tr>`;
    for (const item of sub.items) {
      const cantLabel = item.unidad === 'kg'
        ? (item.cantidad >= 1000 ? `${(item.cantidad / 1000).toFixed(1)} kg` : `${item.cantidad} g`)
        : `${item.cantidad} ud`;
      itemsHtml += `
        <tr>
          <td style="padding:6px 0;color:#333;font-size:14px;">${item.nombreProducto}</td>
          <td style="padding:6px 8px;color:#666;font-size:14px;text-align:center;">${cantLabel}</td>
          <td style="padding:6px 0;color:#333;font-size:14px;text-align:right;">${parseFloat(item.subtotal).toFixed(2)} €</td>
        </tr>`;
    }
  }

  const modoLabel = order.modoEntrega === 'domicilio' ? 'Entrega a domicilio' : 'Recogida en el mercado';
  const ref = order.id.substring(0, 8).toUpperCase();

  const html = wrapHtml('Confirmación de pedido', `
    <h2 style="margin:0 0 12px;color:#333;font-size:20px;">¡Gracias por tu pedido, ${nombre}!</h2>
    <p style="color:#555;line-height:1.6;">Tu pedido <strong>#${ref}</strong> ha sido registrado correctamente.</p>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
      <tr style="background:#f9f9f9;">
        <th style="padding:8px;text-align:left;font-size:13px;color:#888;">Producto</th>
        <th style="padding:8px;text-align:center;font-size:13px;color:#888;">Cantidad</th>
        <th style="padding:8px;text-align:right;font-size:13px;color:#888;">Subtotal</th>
      </tr>
      ${itemsHtml}
      <tr>
        <td colspan="2" style="padding:14px 0 0;font-weight:700;font-size:16px;color:#333;border-top:2px solid #8b2332;">Total</td>
        <td style="padding:14px 0 0;font-weight:700;font-size:16px;color:#8b2332;text-align:right;border-top:2px solid #8b2332;">${parseFloat(order.total).toFixed(2)} €</td>
      </tr>
    </table>

    <p style="color:#555;font-size:14px;line-height:1.6;margin:16px 0 0;">
      <strong>Modo de entrega:</strong> ${modoLabel}<br/>
      ${order.direccionEntrega ? `<strong>Dirección:</strong> ${order.direccionEntrega}<br/>` : ''}
      ${order.fechaEntrega ? `<strong>Fecha de entrega:</strong> ${new Date(order.fechaEntrega).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}<br/>` : ''}
    </p>
  `);

  await resend.emails.send({ from: FROM, to, subject: `Pedido #${ref} confirmado — Plaza de Abastos`, html });
};

export default { sendVerificationEmail, sendPasswordResetEmail, sendOrderConfirmationEmail };
