/**
 * API Client para integração do frontend com o backend
 * Adicionar este arquivo no HTML: <script src="js/api-client.js"></script>
 */

const API_BASE_URL = "http://localhost:5000/api"; // Mudar URL em produção

class APIClient {
  constructor(baseURL = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Helper para fazer requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Erro ${response.status}`);
    }

    return response.json();
  }

  // ===== AUTENTICAÇÃO =====

  async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async getCurrentBarber(token) {
    return this.request("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ===== RESERVAS (Público) =====

  async createReservation(data) {
    return this.request("/reservations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getReservationsByBarber(barberId, date = null) {
    let endpoint = `/reservations/barber/${barberId}`;
    if (date) {
      endpoint += `?date=${date}`;
    }
    return this.request(endpoint);
  }

  // ===== ADMIN =====

  async updateReservationStatus(reservationId, status, token) {
    return this.request(`/reservations/${reservationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async deleteReservation(reservationId, token) {
    return this.request(`/reservations/${reservationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAllServices() {
    return this.request("/admin/services");
  }

  async createService(data, token) {
    return this.request("/admin/services", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updateService(serviceId, data, token) {
    return this.request(`/admin/services/${serviceId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async deleteService(serviceId, token) {
    return this.request(`/admin/services/${serviceId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getAllBarbers(token) {
    return this.request("/admin/barbers", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async updateBarber(barberId, data, token) {
    return this.request(`/admin/barbers/${barberId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async getSiteSettings(token) {
    return this.request("/admin/settings", {
      headers: { Authorization: `Bearer ${token}` },
    });
  }
}

// Criar instância global
const api = new APIClient();

// ========== INTEGRAÇÃO COM O MODAL DE RESERVAS ==========

/**
 * Função para chamar quando submit do modal de reservas
 * Substituir chamada do localStorage pela API do backend
 */
async function submitBooking(bookingData) {
  try {
    // Preparar dados
    const data = {
      barberId: bookingData.barberId,
      serviceId: bookingData.serviceId,
      clientName: bookingData.clientName,
      clientPhone: bookingData.clientPhone,
      clientEmail: bookingData.clientEmail,
      reservationDate: bookingData.reservationDate,
      timeSlot: bookingData.timeSlot,
      notes: bookingData.notes || "",
    };

    // Enviar para backend
    const result = await api.createReservation(data);

    // Mostrar sucesso
    showNotification(
      "Reserva confirmada! SMS enviado para " + bookingData.clientPhone,
      "success",
    );
    closeBookingModal();

    return result;
  } catch (error) {
    showNotification("Erro ao criar reserva: " + error.message, "error");
    console.error("Erro:", error);
  }
}

/**
 * Carregar slots disponíveis do backend
 */
async function loadAvailableSlots(barberId, date, serviceId) {
  try {
    const reservations = await api.getReservationsByBarber(barberId, date);

    // Filtrar slots ocupados
    const bookedSlots = reservations
      .filter((r) => r.status !== "cancelled")
      .map((r) => r.timeSlot);

    // Gerar slots disponíveis (09:00 até 18:00, cada 30 min)
    const availableSlots = generateTimeSlots("09:00", "18:00", 30).filter(
      (slot) => !bookedSlots.includes(slot),
    );

    return availableSlots;
  } catch (error) {
    console.error("Erro ao carregar slots:", error);
    return [];
  }
}

/**
 * Helper para gerar time slots
 */
function generateTimeSlots(startTime, endTime, interval) {
  const slots = [];
  let [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  let currentTime = new Date();
  currentTime.setHours(startHour, startMin, 0);

  const endDateTime = new Date();
  endDateTime.setHours(endHour, endMin, 0);

  while (currentTime < endDateTime) {
    const hours = String(currentTime.getHours()).padStart(2, "0");
    const minutes = String(currentTime.getMinutes()).padStart(2, "0");
    slots.push(`${hours}:${minutes}`);
    currentTime.addMinutes(interval);
  }

  return slots;
}

// Helper para adicionar minutos a uma data
Date.prototype.addMinutes = function (minutes) {
  return new Date(this.getTime() + minutes * 60000);
};

/**
 * Mostrar notificação na tela
 */
function showNotification(message, type = "info") {
  // Se existir um container already, usar, senão criar temporário
  let notif = document.getElementById("notification");
  if (!notif) {
    notif = document.createElement("div");
    notif.id = "notification";
    notif.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      max-width: 400px;
      animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notif);
  }

  const bgColor =
    type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3";
  const html = `
    <div style="background: ${bgColor}; color: white; padding: 1rem; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
      ${message}
    </div>
  `;

  notif.innerHTML = html;
  setTimeout(() => {
    notif.innerHTML = "";
  }, 4000);
}

/**
 * Configurar modalquando abrir com um serviço
 */
function setupBookingModalWithAPI(serviceId) {
  // Carregar dados necessários da API
  // Pode ser feito quando modal abre
}

console.log('✓ API Client carregado. Use global "api" para fazer requests.');
