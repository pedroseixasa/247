const { Resend } = require("resend");

// Inicializar Resend sob demanda (lazy loading)
let resend = null;

function getResendClient() {
  if (!resend && process.env.RESEND_API_KEY) {
    try {
      resend = new Resend(process.env.RESEND_API_KEY);
    } catch (error) {
      console.error("Erro ao inicializar Resend:", error);
    }
  }
  return resend;
}

/**
 * Envia email de confirmação de reserva ao cliente
 */
async function sendBookingConfirmation({
  clientName,
  clientEmail,
  barberName,
  serviceName,
  reservationDate,
  timeSlot,
  cancelToken,
}) {
  const client = getResendClient();
  if (!client) {
    console.warn("Resend não configurado - email não enviado");
    return { success: false, error: "Resend não configurado" };
  }

  try {
    const formattedDate = new Date(reservationDate).toLocaleDateString(
      "pt-PT",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const cancelUrl = `https://247barbearia.pt/cancel.html?token=${cancelToken}`;

    const { data, error } = await client.emails.send({
      from: "24.7 Barbearia <noreply@247barbearia.pt>",
      to: [clientEmail],
      subject: `✅ Reserva Confirmada - ${formattedDate} às ${timeSlot}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-PT">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 10px;
            }
            .success-icon {
              font-size: 64px;
              margin: 20px 0;
            }
            h1 {
              color: #1a1a1a;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .details {
              background-color: #f9f8f7;
              border-left: 4px solid #c9a961;
              padding: 20px;
              margin: 30px 0;
              border-radius: 4px;
            }
            .detail-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #e5e5e5;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
              min-width: 120px;
            }
            .detail-value {
              color: #1a1a1a;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              color: #777;
              font-size: 14px;
            }
            .cancel-link {
              display: inline-block;
              margin-top: 20px;
              padding: 12px 24px;
              background-color: #f5f5f5;
              color: #666;
              text-decoration: none;
              border-radius: 6px;
              font-size: 14px;
              border: 1px solid #ddd;
            }
            .cancel-link:hover {
              background-color: #e5e5e5;
            }
            .address {
              margin-top: 20px;
              font-style: italic;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">24•7 Barbearia</div>
              <div class="success-icon">✅</div>
              <h1>Reserva Confirmada!</h1>
            </div>
            
            <p>Olá <strong>${clientName}</strong>,</p>
            <p>A sua reserva na <strong>24.7 Barbearia</strong> foi confirmada com sucesso!</p>
            
            <div class="details">
              <div class="detail-row">
                <span class="detail-label">📅 Data:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">🕐 Hora:</span>
                <span class="detail-value">${timeSlot}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">✂️ Serviço:</span>
                <span class="detail-value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">💈 Barbeiro:</span>
                <span class="detail-value">${barberName}</span>
              </div>
            </div>
            
            <p><strong>O que deve saber:</strong></p>
            <ul>
              <li>Por favor, chegue 5 minutos antes da hora marcada</li>
              <li>Em caso de atraso superior a 15 minutos, a reserva poderá ser cancelada</li>
              <li>Para cancelar, utilize o link abaixo até 24h antes da marcação</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${cancelUrl}" class="cancel-link">
                🗑️ Cancelar Reserva
              </a>
            </div>
            
            <div class="footer">
              <p><strong>24.7 Barbearia</strong></p>
              <p class="address">📍 Rua Exemplo, 123 - Almada, Portugal</p>
              <p>📞 +351 912 345 678</p>
              <p>Este email foi enviado automaticamente. Por favor não responda.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Erro ao enviar email via Resend:", error);
      return { success: false, error };
    }

    console.log("Email enviado com sucesso:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia notificação de nova reserva para administração
 */
async function sendAdminNotification({
  clientName,
  clientEmail,
  clientPhone,
  barberName,
  serviceName,
  reservationDate,
  timeSlot,
}) {
  const client = getResendClient();
  if (!client) {
    return { success: false, error: "Resend não configurado" };
  }

  try {
    const formattedDate = new Date(reservationDate).toLocaleDateString(
      "pt-PT",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const { data, error } = await client.emails.send({
      from: "24.7 Barbearia <noreply@247barbearia.pt>",
      to: [process.env.ADMIN_EMAIL || "admin@247barbearia.pt"],
      subject: `🔔 Nova Reserva - ${clientName} (${formattedDate})`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-PT">
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .alert {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .details {
              background-color: #f9f8f7;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .detail-row {
              padding: 8px 0;
              border-bottom: 1px solid #e5e5e5;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            strong {
              color: #1a1a1a;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔔 Nova Reserva Recebida</h1>
            
            <div class="alert">
              <strong>⚠️ Atenção:</strong> Uma nova reserva foi criada no sistema.
            </div>
            
            <div class="details">
              <div class="detail-row">
                <strong>👤 Cliente:</strong> ${clientName}
              </div>
              <div class="detail-row">
                <strong>📧 Email:</strong> ${clientEmail}
              </div>
              <div class="detail-row">
                <strong>📞 Telefone:</strong> ${clientPhone || "Não fornecido"}
              </div>
              <div class="detail-row">
                <strong>📅 Data:</strong> ${formattedDate}
              </div>
              <div class="detail-row">
                <strong>🕐 Hora:</strong> ${timeSlot}
              </div>
              <div class="detail-row">
                <strong>✂️ Serviço:</strong> ${serviceName}
              </div>
              <div class="detail-row">
                <strong>💈 Barbeiro:</strong> ${barberName}
              </div>
            </div>
            
            <p><strong>Próximos passos:</strong></p>
            <ul>
              <li>Verifique o painel de administração para mais detalhes</li>
              <li>Confirme a disponibilidade do barbeiro</li>
              <li>O cliente já recebeu email de confirmação automático</li>
            </ul>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Erro ao enviar email admin via Resend:", error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Erro ao enviar email admin:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Envia notificação de nova reserva ao barbeiro
 */
async function sendBarberNotification({
  barberEmail,
  barberName,
  clientName,
  clientPhone,
  serviceName,
  reservationDate,
  timeSlot,
}) {
  const client = getResendClient();
  if (!client || !barberEmail) {
    return { success: false, error: "Barber email não configurado" };
  }

  try {
    const formattedDate = new Date(reservationDate).toLocaleDateString(
      "pt-PT",
      {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

    const { data, error } = await client.emails.send({
      from: "24.7 Barbearia <noreply@247barbearia.pt>",
      to: [barberEmail],
      subject: `📅 Nova Reserva - ${clientName} a ${reservationDate} às ${timeSlot}`,
      html: `
        <!DOCTYPE html>
        <html lang="pt-PT">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 12px;
              padding: 40px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 32px;
              font-weight: bold;
              color: #1a1a1a;
              margin-bottom: 10px;
            }
            h1 {
              color: #1a1a1a;
              font-size: 24px;
              margin-bottom: 20px;
            }
            .alert {
              background-color: #fff3cd;
              border-left: 4px solid #ffc107;
              padding: 20px;
              margin: 30px 0;
              border-radius: 4px;
            }
            .details {
              background-color: #f9f8f7;
              border-left: 4px solid #c9a961;
              padding: 20px;
              margin: 30px 0;
              border-radius: 4px;
            }
            .detail-row {
              display: flex;
              padding: 8px 0;
              border-bottom: 1px solid #e5e5e5;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: bold;
              color: #666;
              min-width: 120px;
            }
            .detail-value {
              color: #1a1a1a;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e5e5;
              text-align: center;
              color: #777;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">24•7 Barbearia</div>
              <h1>🔔 Nova Reserva!</h1>
            </div>

            <div class="alert">
              <strong>Olá ${barberName},</strong><br>
              Uma nova marcação foi agendada para ti no painel.
            </div>

            <div class="details">
              <div class="detail-row">
                <span class="detail-label">👤 Cliente:</span>
                <span class="detail-value">${clientName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📞 Telefone:</span>
                <span class="detail-value">${clientPhone}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">✂️ Serviço:</span>
                <span class="detail-value">${serviceName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">📅 Data:</span>
                <span class="detail-value">${formattedDate}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">⏰ Hora:</span>
                <span class="detail-value">${timeSlot}</span>
              </div>
            </div>

            <div class="footer">
              Verifica o teu painel de administração para mais detalhes e confirmações.<br>
              © 2026 24•7 Barbearia — Almada, Portugal
            </div>
          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      console.error("Erro Resend ao enviar notificação barbeiro:", error);
      return { success: false, error: error.message };
    }

    console.log("Email barbeiro enviado com sucesso:", data?.id);
    return { success: true, data };
  } catch (error) {
    console.error("Erro ao enviar email barbeiro:", error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendBookingConfirmation,
  sendAdminNotification,
  sendBarberNotification,
};
