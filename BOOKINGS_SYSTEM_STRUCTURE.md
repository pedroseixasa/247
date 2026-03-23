# 📅 Sistema de Marcações (Bookings/Reservations) - Documentação Completa

**Última atualização:** 23 Mar 2026  
**Versão:** 2.0  
**Status:** Produção ativa

---

## 📋 Índice Rápido

- [1. Modelos de Dados](#1-modelos-de-dados)
- [2. API Endpoints](#2-api-endpoints)
- [3. Frontend Logic](#3-frontend-logic)
- [4. Sistema de Email](#4-sistema-de-email)
- [5. Admin Dashboard](#5-admin-dashboard)
- [6. Fluxos & Diagramas](#6-fluxos--diagramas)
- [7. Validações & Regras](#7-validações--regras-de-negócio)
- [8. Decisões Arquiteturais](#8-decisões-arquiteturais)

---

## 1. Modelos de Dados

### 1.1 Reservation Model (`backend/src/models/Reservation.js`)

#### Schema Completo

```javascript
{
  _id: ObjectId,                    // MongoDB ID (gerado automaticamente)

  // Relações
  barberId: ObjectId (ref: "Barber"),    // REF ao barbeiro
  serviceId: ObjectId (ref: "Service"),  // REF ao serviço

  // Dados do Cliente
  clientName: String,               // OBRIGATÓRIO - Nome completo
  clientPhone: String,              // OPCIONAL - Telefone português
  clientEmail: String,              // OBRIGATÓRIO - Email válido

  // Dados da Reserva
  reservationDate: Date,            // OBRIGATÓRIO - Data/hora ISO
  timeSlot: String,                 // OBRIGATÓRIO - Formato "HH:MM" (ex: "09:30")
  status: String,                   // enum: ["confirmed", "pending", "cancelled", "completed"]
                                    // default: "confirmed"
  notes: String,                    // OPCIONAL - Notas internas

  // Sistema de Cancelamento
  cancelToken: String,              // Unique + sparse - Token para email

  // Reminders
  reminderSent: Boolean,            // default: false

  // Timestamps
  createdAt: Date,                  // default: Date.now()
}
```

#### Validações Modelo

```javascript
// Validações no Controller (aplicadas antes de salvar)
- barberId: ObjectId válido, exists em Barber
- serviceId: ObjectId válido, exists em Service
- clientName: required, non-empty string
- clientEmail: email válido, domínio real (não .test, .fake)
- clientPhone: opcional, but if provided: formato português (+351 2/9XXXXXXXX ou 2/9XXXXXXXX)
- reservationDate: Date válida, no futuro
- timeSlot: formato HH:MM válido

// Verificações de Conflito
- ✓ Barbeiro não tem ausência nesta data/hora
- ✓ Não existe outra reserva confirmada para este barbeiro + time slot + data
- ✓ Data deve estar em horário de funcionamento da barbearia
```

#### Status Transitions

```
                    criar
confirmed ◄────────────────┐
  │                        │
  │                     pending
  └─[completado]──► completed
  │
  └─[cancelado]───► cancelled (final)

  pending: ainda não confirmado (para futuro uso)
  confirmed: ativo e visível
  completed: serviço já foi feito
  cancelled: anulado (final)
```

### 1.2 Barber Model (Relações com Reservation)

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  phone: String,
  password: String (bcrypt hash),
  role: String (enum: ["admin", "barber"]),
  avatar: String,
  bio: String,

  // ⭐ Horários de Funcionamento
  workingHours: {
    monday: { start: "09:00", end: "18:00" },
    tuesday: { start: "09:00", end: "18:00" },
    wednesday: { start: "09:00", end: "18:00" },
    thursday: { start: "09:00", end: "18:00" },
    friday: { start: "09:00", end: "18:00" },
    saturday: { start: "10:00", end: "16:00" },
    sunday: { start: null, end: null },  // Fechado
  },

  // ⭐ Ausências/Folgas
  absences: [
    {
      date: Date,
      type: String (enum: ["morning", "afternoon", "full", "specific"]),
      startTime: String ("09:00"),      // Para tipo "specific"
      endTime: String ("13:00"),        // Para tipo "specific"
      reason: String,
    }
  ],

  isActive: Boolean,
  createdAt: Date,
}
```

**Sistema de Absências:**

```
type: "full"        → Dia inteiro indisponível
type: "morning"     → Antes do meio-dia (00:00-11:59)
type: "afternoon"   → Depois do meio-dia (12:00-23:59)
type: "specific"    → Entre startTime e endTime (ex: 09:00-11:30)
```

### 1.3 Service Model (Relações com Reservation)

```javascript
{
  _id: ObjectId,
  name: String,                 // ex: "Corte Clássico"
  description: String,
  price: Mixed,                 // String ou Number (ex: "15€" ou 15)
  duration: Number,             // em minutos (default: 30)
  image: String,                // URL da imagem
  isActive: Boolean,            // default: true
  order: Number,                // para ordenação (default: 0)
  createdAt: Date,
}
```

---

## 2. API Endpoints

### Base URL Produção

```
https://two4-7-barbearia.onrender.com/api
```

### 2.1 Criar Reserva (Público)

#### **POST** `/reservations`

**Permissões:** Público (sem autenticação)

**Request Body:**

```json
{
  "barberId": "6998aaf59119a721cdc1e136",
  "serviceId": "507f1f77bcf86cd799439011",
  "clientName": "João Silva",
  "clientPhone": "+351 912 345 678",
  "clientEmail": "joao@example.com",
  "reservationDate": "2026-04-15T09:00:00Z",
  "timeSlot": "09:00",
  "notes": "Preferência: corte curto"
}
```

**Response - Sucesso (201):**

```json
{
  "message": "Reserva criada com sucesso!",
  "reservation": {
    "_id": "60d5ec49c1234567890abcde",
    "barberId": {
      "_id": "6998aaf59119a721cdc1e136",
      "name": "Diogo Cunha"
    },
    "serviceId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Corte Clássico",
      "price": "15€",
      "duration": 30
    },
    "clientName": "João Silva",
    "clientPhone": "+351912345678",
    "clientEmail": "joao@example.com",
    "reservationDate": "2026-04-15T09:00:00.000Z",
    "timeSlot": "09:00",
    "status": "confirmed",
    "cancelToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
    "reminderSent": false,
    "createdAt": "2026-03-23T14:30:00.000Z"
  }
}
```

**Erros Possíveis:**

```json
// 400 - Dados faltando
{
  "error": "Dados obrigatórios faltando"
}

// 400 - Telefone inválido
{
  "error": "Número de telefone inválido. Use formato: +351 912345678 ou 912345678"
}

// 400 - Email inválido ou domínio fake
{
  "error": "Email inválido"
}
// ou
{
  "error": "Por favor, use um email real"
}

// 400 - IDs inválidos
{
  "error": "ID do barbeiro inválido"
}

// 404 - Barbeiro não existe
{
  "error": "Barbeiro não encontrado"
}

// 404 - Serviço não existe
{
  "error": "Serviço não encontrado"
}

// 409 - Barbeiro indisponível (ausência)
{
  "error": "Barbeiro indisponível nesta data/hora. Marque outra data."
}

// 409 - Time slot já reservado
{
  "error": "Esta hora já está reservada"
}

// 500 - Erro servidor
{
  "error": "Erro ao processar a requisição"
}
```

**Efeitos Colaterais (após sucesso):**

1. SMS via Twilio (se configurado)

   ```
   "Olá João Silva! Sua reserva na barbearia 247 está confirmada para 15/04/2026 às 09:00. Serviço: Corte Clássico. Obrigado!"
   ```

2. Email ao cliente (via Resend) - assíncrono, não bloqueia resposta
3. Email ao admin (via Resend) - assíncrono, não bloqueia resposta
4. Token de cancelamento gerado (32 caracteres hex, único)

---

### 2.2 Listar Reservas por Barbeiro

#### **GET** `/reservations/barber/:barberId`

**Permissões:** Público

**Query Parameters:**

```
GET /reservations/barber/6998aaf59119a721cdc1e136?date=2026-04-15
```

**Response (200):**

```json
[
  {
    "_id": "60d5ec49c1234567890abcde",
    "barberId": "6998aaf59119a721cdc1e136",
    "serviceId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Corte Clássico",
      "price": "15€",
      "duration": 30
    },
    "clientName": "João Silva",
    "clientPhone": "+351912345678",
    "clientEmail": "joao@example.com",
    "reservationDate": "2026-04-15T09:00:00.000Z",
    "timeSlot": "09:00",
    "status": "confirmed",
    "createdAt": "2026-03-23T14:30:00.000Z"
  }
]
```

---

### 2.3 Atualizar Status da Reserva

#### **PATCH** `/reservations/:reservationId/status`

**Permissões:** Autenticado (`authMiddleware`)

**Request Body:**

```json
{
  "status": "completed"
}
```

**Valores válidos:** `confirmed` | `pending` | `cancelled` | `completed`

**Response (200):**

```json
{
  "_id": "60d5ec49c1234567890abcde",
  "status": "completed",
  "serviceId": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Corte Clássico"
  }
  // ... resto dos dados
}
```

---

### 2.4 Deletar Reserva (Admin)

#### **DELETE** `/reservations/:reservationId`

**Permissões:** Autenticado (`authMiddleware`)

**Response (200):**

```json
{
  "message": "Reserva cancelada"
}
```

---

### 2.5 Cancelar Reserva por Token (Público - Email)

#### **POST** `/reservations/cancel/:token`

**Permissões:** Público (sem autenticação)

**Path Parameter:**

```
/reservations/cancel/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**Response (200):**

```json
{
  "message": "Reserva cancelada com sucesso!",
  "reservation": {
    "clientName": "João Silva",
    "serviceName": "Corte Clássico",
    "date": "2026-04-15T09:00:00.000Z",
    "time": "09:00"
  }
}
```

**Erros:**

```json
{
  "error": "Reserva não encontrada ou já cancelada"
}
```

---

### 2.6 Listar Todas as Reservas (Admin)

#### **GET** `/admin/reservations`

**Permissões:** Admin (`authMiddleware` + `adminMiddleware`)

**Query Parameters:**

```
GET /admin/reservations?barberId=6998aaf59119a721cdc1e136
```

**Response (200):**

```json
[
  {
    "_id": "60d5ec49c1234567890abcde",
    "barberId": {
      "_id": "6998aaf59119a721cdc1e136",
      "name": "Diogo Cunha"
    },
    "serviceId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Corte Clássico"
    },
    "clientName": "João Silva",
    "clientPhone": "+351912345678",
    "clientEmail": "joao@example.com",
    "reservationDate": "2026-04-15T09:00:00.000Z",
    "timeSlot": "09:00",
    "status": "confirmed",
    "createdAt": "2026-03-23T14:30:00.000Z"
  }
]
```

---

## 3. Frontend Logic

### 3.1 Booking Modal - 3-Step Flow

#### **Arquivo:** `js/main.js` (linhas ~900-1573)

**Estado Global:**

```javascript
const bookingState = {
  currentStep: 1, // 1 | 2 | 3
  service: null, // Nome do serviço
  serviceId: null, // ObjectId
  servicePrice: null, // String (ex: "15€")
  barber: null, // "diogo-cunha" | "ricardo-silva"
  barberId: null, // ObjectId (preenchido via `barbers` lookup table)
  date: null, // Date object
  time: null, // String "09:00"
  selectedMonth: new Date().getMonth(),
  selectedYear: new Date().getFullYear(),
};

const barbers = {
  "diogo-cunha": {
    id: "6998aaf59119a721cdc1e136",
    name: "Diogo Cunha",
  },
  "ricardo-silva": {
    id: "6998aaf59119a721cdc1e137",
    name: "Ricardo Silva",
  },
};
```

#### **Step 1: Seleção de Barbeiro**

```html
<!-- Frontend representação -->
<div class="booking-step active" id="step1">
  <h3>Escolha o Barbeiro</h3>
  <div class="barber-cards-container">
    <div class="barber-card selected" data-barber="diogo-cunha">
      <img src="imagens/diogo.jpg" />
      <h4 class="barber-name">Diogo Cunha</h4>
      <p class="barber-role">Barbeiro Senior</p>
    </div>
    <div class="barber-card" data-barber="ricardo-silva">
      <img src="imagens/ricardo.jpg" />
      <h4 class="barber-name">Ricardo Silva</h4>
      <p class="barber-role">Barbeiro</p>
    </div>
  </div>
</div>
```

**Validação:** `bookingState.barber !== null`

---

#### **Step 2: Seleção de Data & Hora**

```html
<div class="booking-step-content active" id="step2">
  <h3>Escolha Data e Horário</h3>

  <!-- Mini Calendário -->
  <div class="mini-calendar">
    <div class="calendar-header">
      <button id="prevMonth">◄</button>
      <h4 id="calendarMonth">Março 2026</h4>
      <button id="nextMonth">►</button>
    </div>
    <div class="calendar-days" id="calendarDays">
      <!-- Dias dinâmicos aqui -->
    </div>
  </div>

  <!-- Time Slots -->
  <div class="time-slots-container" id="timeSlots">
    <!-- Botões de horário aqui -->
  </div>
</div>
```

**Lógica de Calendário:**

```javascript
function renderCalendar() {
  // 1. Obter primeiro e último dia do mês
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // 2. Filtrar dias de trabalho (baseado em siteSchedule)
  const barberWorkDays = [0, 1, 2, 3, 4, 5, 6].filter((day) => {
    const schedule = getScheduleForDay(day);
    return schedule && schedule.open;
  });

  // 3. Para cada dia do mês:
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const date = new Date(year, month, day);
    const isPast = date < today;
    const isWorkDay = barberWorkDays.includes(date.getDay());

    // Se é passado ou não é dia de trabalho → disabled
    // Caso contrário → clicável
  }
}
```

**Lógica de Time Slots:**

```javascript
function getTimeSlotsForDate(date) {
  const schedule = siteSchedule[date.getDay()];
  if (!schedule || !schedule.open) return [];

  const slots = [];
  const slotMinutes = 60; // Slots de 60 em 60 minutos

  for (
    let t = schedule.openMinutes;
    t + slotMinutes <= schedule.closeMinutes;
    t += slotMinutes
  ) {
    slots.push(formatTime(t)); // "09:00", "10:00", etc
  }

  return slots;
}

function renderTimeSlots() {
  const availableSlots = getTimeSlotsForDate(bookingState.date);

  // Se for hoje, filtrar horários que já passaram
  if (isToday) {
    availableSlots = availableSlots.filter((time) => {
      const [slotHour, slotMinute] = time.split(":").map(Number);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      return (
        slotHour > currentHour ||
        (slotHour === currentHour && slotMinute > currentMinute)
      );
    });
  }

  // Carregar slots reservados da API
  reloadTimeSlots();

  // Renderizar slots (marcando como "booked" se necessário)
  availableSlots.forEach((time) => {
    const slotKey = `${bookingState.barber}-${dateKey}-${time}`;
    const isBooked = bookedSlots[slotKey];

    const button = document.createElement("button");
    button.textContent = time;
    button.disabled = isBooked;
    button.addEventListener("click", () => {
      bookingState.time = time;
      renderTimeSlots();
    });
  });
}
```

**Carregamento de Slots da API:**

```javascript
function reloadTimeSlots() {
  // Obter todas as reservas do barbeiro para a data
  const barberId = barbers[bookingState.barber].id;
  const dateKey = bookingState.date.toISOString().split("T")[0];

  fetch(`${API_BASE_URL}/reservations/barber/${barberId}?date=${dateKey}`)
    .then((res) => res.json())
    .then((reservations) => {
      reservations.forEach((res) => {
        const slotKey = `${bookingState.barber}-${dateKey}-${res.timeSlot}`;
        bookedSlots[slotKey] = true;
      });
      renderTimeSlots();
    });
}
```

**Validação:** `bookingState.date !== null && bookingState.time !== null`

---

#### **Step 3: Dados do Cliente**

```html
<div class="booking-step-content" id="step3">
  <h3>Confirme seus Dados</h3>

  <!-- Resumo -->
  <div class="booking-summary">
    <div>📅 <span id="summaryDate">15/04/2026</span></div>
    <div>🕐 <span id="summaryTime">09:00</span></div>
    <div>✂️ <span id="summaryService">Corte Clássico</span></div>
    <div>💈 <span id="summaryBarber">Diogo Cunha</span></div>
    <div>💰 <span id="summaryPrice">15€</span></div>
  </div>

  <!-- Formulário -->
  <form id="bookingForm">
    <input id="clientName" type="text" placeholder="Nome Completo" required />
    <input
      id="clientPhone"
      type="tel"
      placeholder="+351 912 345 678"
      pattern="^(\+351)?[29]\d{8}$"
    />
    <input id="clientEmail" type="email" placeholder="seu@email.com" required />
  </form>

  <div id="bookingError" style="color: red; display: none;"></div>
</div>
```

**Validações Tempo Real:**

- **Email:** deve conter `@`, domínio válido (não .test ou .fake)
- **Telefone:** `+351 2/9XXXXXXXX` ou `2/9XXXXXXXX` (9 dígitos)
- **Nome:** não vazio

**Validação:** `clientName.value && clientEmail.value && (clientPhone empty OR válido)`

---

### 3.2 Submissão de Reserva

```javascript
function submitBooking() {
  const payload = {
    barberId: barbers[bookingState.barber].id,
    serviceId: bookingState.serviceId,
    clientName: document.getElementById("clientName").value,
    clientPhone: document.getElementById("clientPhone").value || null,
    clientEmail: document.getElementById("clientEmail").value,
    reservationDate: bookingState.date.toISOString(),
    timeSlot: bookingState.time,
    notes: document.getElementById("bookingNotes")?.value || "",
  };

  fetch(`${API_BASE_URL}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.reservation) {
        // Mostrar modal de sucesso
        showSuccessModal(data.reservation);
        // Recarregar slots para outros utilizadores
        reloadTimeSlots();
      } else if (data.error) {
        showBookingError(data.error);
      }
    })
    .catch((err) => showBookingError("Erro ao criar reserva: " + err.message));
}
```

---

### 3.3 Modal de Sucesso

```html
<div id="successModal" class="booking-modal active">
  <div class="success-content">
    <h2>✅ Reserva Confirmada!</h2>
    <div class="success-details">
      <p>Serviço: <strong id="successService">Corte Clássico</strong></p>
      <p>Barbeiro: <strong id="successBarber">Diogo Cunha</strong></p>
      <p>Data: <strong id="successDate">15/04/2026</strong></p>
      <p>Hora: <strong id="successTime">09:00</strong></p>
      <p>
        Confirmação foi enviada para:
        <strong id="successEmail">joao@example.com</strong>
      </p>
    </div>
    <p class="success-note">Pode cancelar até 24h antes pelo link no email.</p>
    <button id="closeSuccessModal">Fechar</button>
  </div>
</div>
```

---

## 4. Sistema de Email

### 4.1 Serviço Resend (`backend/src/services/emailService.js`)

#### Configuração

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=admin@247barbearia.pt
```

#### Função: Confirmação ao Cliente

```javascript
async function sendBookingConfirmation({
  clientName,
  clientEmail,
  barberName,
  serviceName,
  reservationDate,
  timeSlot,
  cancelToken,
})
```

**Template HTML:**

```html
<!DOCTYPE html>
<html lang="pt-PT">
  <head>
    <meta charset="UTF-8" />
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }
      .container {
        background: #fff;
        padding: 40px;
        border-radius: 12px;
      }
      .logo {
        font-size: 32px;
        font-weight: bold;
        color: #1a1a1a;
      }
      .success-icon {
        font-size: 64px;
        text-align: center;
      }
      .details {
        background: #f9f8f7;
        border-left: 4px solid #c9a961;
        padding: 20px;
      }
      .detail-row {
        display: flex;
        padding: 8px 0;
        border-bottom: 1px solid #e5e5e5;
      }
      .cancel-link {
        display: inline-block;
        padding: 12px 24px;
        background: #f5f5f5;
        text-decoration: none;
        border-radius: 6px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">24•7 Barbearia</div>
      <div class="success-icon">✅</div>
      <h1>Reserva Confirmada!</h1>

      <p>Olá <strong>${clientName}</strong>,</p>
      <p>A sua reserva na 24.7 Barbearia foi confirmada com sucesso!</p>

      <div class="details">
        <div class="detail-row">
          <span><strong>📅 Data:</strong> ${formattedDate}</span>
        </div>
        <div class="detail-row">
          <span><strong>🕐 Hora:</strong> ${timeSlot}</span>
        </div>
        <div class="detail-row">
          <span><strong>✂️ Serviço:</strong> ${serviceName}</span>
        </div>
        <div class="detail-row">
          <span><strong>💈 Barbeiro:</strong> ${barberName}</span>
        </div>
      </div>

      <p><strong>O que deve saber:</strong></p>
      <ul>
        <li>Por favor, chegue 5 minutos antes da hora marcada</li>
        <li>
          Em caso de atraso superior a 15 minutos, a reserva poderá ser
          cancelada
        </li>
        <li>Para cancelar, utilize o link abaixo até 24h antes da marcação</li>
      </ul>

      <a
        href="https://247barbearia.pt/cancel.html?token=${cancelToken}"
        class="cancel-link"
      >
        🗑️ Cancelar Reserva
      </a>

      <div
        style="margin-top: 40px; border-top: 1px solid #e5e5e5; padding-top: 20px; text-align: center; color: #777; font-size: 14px;"
      >
        <p><strong>24.7 Barbearia</strong></p>
        <p>📍 Rua Exemplo, 123 - Almada, Portugal</p>
        <p>📞 +351 912 345 678</p>
      </div>
    </div>
  </body>
</html>
```

**Variáveis Dinâmicas:**

- `${clientName}` - Nome do cliente
- `${formattedDate}` - Data formatada em português ("segunda-feira, 15 de abril de 2026")
- `${timeSlot}` - Hora da reserva ("09:00")
- `${serviceName}` - Nome do serviço ("Corte Clássico")
- `${barberName}` - Nome do barbeiro ("Diogo Cunha")
- `${cancelToken}` - Token único para cancelamento

---

#### Função: Notificação ao Admin

```javascript
async function sendAdminNotification({
  clientName,
  clientEmail,
  clientPhone,
  barberName,
  serviceName,
  reservationDate,
  timeSlot,
})
```

**Template HTML:**

```html
<h1>🔔 Nova Reserva Recebida</h1>

<div class="alert">
  <strong>⚠️ Atenção:</strong> Uma nova reserva foi criada no sistema.
</div>

<div class="details">
  <div class="detail-row"><strong>👤 Cliente:</strong> ${clientName}</div>
  <div class="detail-row"><strong>📧 Email:</strong> ${clientEmail}</div>
  <div class="detail-row">
    <strong>📞 Telefone:</strong> ${clientPhone || "Não fornecido"}
  </div>
  <div class="detail-row"><strong>📅 Data:</strong> ${formattedDate}</div>
  <div class="detail-row"><strong>🕐 Hora:</strong> ${timeSlot}</div>
  <div class="detail-row"><strong>✂️ Serviço:</strong> ${serviceName}</div>
  <div class="detail-row"><strong>💈 Barbeiro:</strong> ${barberName}</div>
</div>

<p><strong>Próximos passos:</strong></p>
<ul>
  <li>Verifique o painel de administração para mais detalhes</li>
  <li>Confirme a disponibilidade do barbeiro</li>
  <li>O cliente já recebeu email de confirmação automático</li>
</ul>
```

---

#### SMS via Twilio (Opcional)

```javascript
// Ao criar reserva, se Twilio configurado:
const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

await twilioClient.messages.create({
  body: `Olá ${clientName}! Sua reserva na barbearia 247 está confirmada para ${formattedDate} às ${timeSlot}. Serviço: ${serviceName}. Obrigado!`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: clientPhone,
});
```

---

### 4.2 Integração no Controller

**Arquivo:** `backend/src/controllers/reservationController.js` (linhas ~180-205)

```javascript
// Após salvar reserva com sucesso:
Promise.all([
  // Email ao cliente
  sendBookingConfirmation({
    clientName,
    clientEmail,
    barberName: barber.name,
    serviceName: service.name,
    reservationDate,
    timeSlot,
    cancelToken,
  }),
  // Email à administração
  sendAdminNotification({
    clientName,
    clientEmail,
    clientPhone,
    barberName: barber.name,
    serviceName: service.name,
    reservationDate,
    timeSlot,
  }),
]).catch((emailError) => {
  // Não falha a requisição se emails não enviar
  console.error("Erro ao enviar emails:", emailError);
});
```

**Características:**

- ✅ Execução assíncrona (não bloqueia resposta HTTP)
- ✅ Promessas paralelas (ambos os emails enviam simultaneamente)
- ✅ Falhas de email não cancelam a reserva
- ✅ Logs em caso de erro

---

## 5. Admin Dashboard

### 5.1 Arquivo: `admin/index.html` (linhas ~1486-1650+)

### 5.2 Listagem de Reservas

```javascript
async function loadReservations(container) {
  // 1. Carregar barbeiros (se admin)
  const barbers = currentUser.role === 'admin' ? await fetchBarbers() : [];

  // 2. Construir URL com filtro (opcional)
  const defaultBarberId = getDefaultBarberId();
  const reservationsUrl = defaultBarberId
    ? `${API_URL}/admin/reservations?barberId=${defaultBarberId}`
    : `${API_URL}/admin/reservations`;

  // 3. Fetch com auth token
  const reservations = await fetchJson(reservationsUrl, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // 4. Filtrar apenas futuras (date > now)
  const futureReservations = reservations.filter(res =>
    new Date(res.reservationDate) > new Date()
  );

  // 5. Agrupar por mês
  const groupedByMonth = {};
  futureReservations.forEach((reservation) => {
    const monthKey = formatMonthKey(reservation.reservationDate);

    if (!groupedByMonth[monthKey]) {
      groupedByMonth[monthKey] = {
        date: new Date(...),
        reservations: {}
      };
    }

    const dayKey = new Date(reservation.reservationDate).getDate();
    if (!groupedByMonth[monthKey].reservations[dayKey]) {
      groupedByMonth[monthKey].reservations[dayKey] = [];
    }
    groupedByMonth[monthKey].reservations[dayKey].push(reservation);
  });

  // 6. Renderizar calendários mensais com reservas
}
```

### 5.3 Layout Visual

```
┌─────────────────────────────────────────────┐
│ 📅 MARÇO 2026                               │
│ Total: 15 reservas                          │
│ [Filtro Barbeiro]  [Aplicar]                │
├─────────────────────────────────────────────┤
│ Dom  Seg  Ter  Qua  Qui  Sex  Sab           │
├─────────────────────────────────────────────┤
│      1    2    3    4    5    6             │
│  7    8    9    10   11   12 [3]            │ ← dia com 3 reservas
│  14 [2]  16   17   18   19   20             │ ← dia com 2 reservas
│  21   22   23   24   25   26   27           │
│  28   29   30   31                          │
└─────────────────────────────────────────────┘

[Clica em dia com reservas]
  ↓
┌────────────────────────┐
│ 15 de MARÇO            │ [✕ Fechar]
├────────────────────────┤
│ 09:00                  │ [Cancelar]
│ Corte Clássico
│ 👨 Diogo Cunha
│ 👤 João Silva • 912345678
├────────────────────────┤
│ 16:30                  │ [Cancelar]
│ Barba Completa
│ 👨 Ricardo Silva
│ 👤 Pedro Costa
└────────────────────────┘
```

---

### 5.4 Dados Exibidos por Reserva

```
🕐 HORA
├─ Serviço (ex: "Corte Clássico")
├─ Barbeiro (ex: "Diogo Cunha")
├─ Cliente (nome + telefone)
└─ Botão: [Cancelar]
```

### 5.5 Ações Disponíveis

#### Cancelar Reserva

```javascript
async function cancelReservation(reservationId) {
  // DELETE /reservations/:id
  const response = await fetch(`${API_URL}/reservations/${reservationId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) {
    // Recarregar listagem
    loadReservations(container);
  }
}
```

#### Filtrar por Barbeiro

```javascript
const filterSelect = document.getElementById("reservationsBarberFilter");
const applyBtn = document.getElementById("reservationsApply");

applyBtn.addEventListener("click", async () => {
  const selectedBarberId = filterSelect.value;

  // Reconstructed URL with filter
  const url = selectedBarberId
    ? `${API_URL}/admin/reservations?barberId=${selectedBarberId}`
    : `${API_URL}/admin/reservations`;

  // Reload with new filter
  loadReservations(container);
});
```

---

### 5.6 Diferença entre Admin e Barber

```javascript
if (currentUser.role === "admin") {
  // Vê TODAS as reservas
  // Pode filtrar por barbeiro
  // Acesso ao endpoint: GET /admin/reservations (sem barberId)
} else if (currentUser.role === "barber") {
  // Vê SUAS reservas (seu ID)
  // Sem filtro de barbeiro
  // Título: "📅 Minhas Reservas"
  // Acesso ao endpoint: GET /admin/reservations?barberId={seu_id}
}
```

---

## 6. Fluxos & Diagramas

### 6.1 Fluxo Geral: Do Frontend ao Email

```
┌────────────────────────────────────────────────────────────┐
│ FRONTEND - Cliente Marca Reserva                           │
└────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 1: Selecionar Barbeiro                                 │
│ - Displays: 2 cards (Diogo Cunha, Ricardo Silva)            │
│ - bookingState.barber = "diogo-cunha"                       │
│ - Next: Step 2                                              │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 2: Selecionar Data + Hora                              │
│ - Calendário: desabilita datas passadas + fechados          │
│ - Filtra dias de trabalho (via siteSchedule)               │
│ - Carrega slots reservados da API (per barbeiro + data)    │
│ - Time slots: 60min intervals                               │
│ - bookingState.date = Date object                           │
│ - bookingState.time = "09:00"                               │
│ - Next: Step 3                                              │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ STEP 3: Preencher Dados                                     │
│ - Form: nome, telefone, email                               │
│ - Validações tempo real                                     │
│ - Submit: next                                              │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ POST /api/reservations                                      │
│ {                                                           │
│   barberId: "6998aaf59119a721cdc1e136",                    │
│   serviceId: "507f1f77bcf86cd799439011",                   │
│   clientName: "João Silva",                                 │
│   clientPhone: "+351912345678",                            │
│   clientEmail: "joao@example.com",                         │
│   reservationDate: "2026-04-15T09:00:00Z",                │
│   timeSlot: "09:00"                                         │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ BACKEND - reservationController.createReservation()         │
│ 1. Validar dados (RE2X)                                     │
│ 2. Verificar barbeiro existe + ativo                        │
│ 3. Verificar serviço existe + ativo                         │
│ 4. Verificar ausências do barbeiro                          │
│ 5. Verificar se slot já está reservado                      │
│ 6. Gerar cancelToken (crypto.randomBytes(32))              │
│ 7. Salvar em MongoDB                                        │
│ 8. Populate references                                      │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────┐
│ Envio de Notificações (Promise.all - assíncrono)           │
│                                                             │
│ ┌────────────────────────────────────────┐                 │
│ │ EMAIL 1: Confirmação ao Cliente        │                 │
│ │ - To: joao@example.com                 │                 │
│ │ - Template: confirmação com detalhes   │                 │
│ │ - Inclui link cancelamento (token)     │                 │
│ └────────────────────────────────────────┘                 │
│                      ∥                                      │
│ ┌────────────────────────────────────────┐                 │
│ │ EMAIL 2: Notificação ao Admin          │                 │
│ │ - To: admin@247barbearia.pt            │                 │
│ │ - Template: novo booking recebido      │                 │
│ │ - Inclui todos dados do cliente       │                 │
│ └────────────────────────────────────────┘                 │
│                      ∥                                      │
│ ┌────────────────────────────────────────┐                 │
│ │ SMS (opcional - Twilio)                │                 │
│ │ - To: clientPhone                      │                 │
│ │ - Texto: confirmação breve             │                 │
│ └────────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────┐
│ Response 201 + reservation object        │
│ com cancelToken, _id, status, etc        │
└──────────────────────────────────────────┘
                             ↓
┌──────────────────────────────────────────┐
│ FRONTEND: Success Modal                  │
│ - Exibe detalhes da reserva              │
│ - Botão: "Fechar"                        │
│ - Recarrega time slots (para outros)     │
└──────────────────────────────────────────┘
```

---

### 6.2 Fluxo: Cancelamento via Email

```
┌────────────────────────────────────────────────────────────┐
│ EMAIL: Confirmação de Reserva                              │
│ [🗑️ Cancelar Reserva] ← link (token embedding)             │
└────────────────────────────────────────────────────────────┘
                             ↓
┌────────────────────────────────────────────────────────────┐
│ FRONTEND: Página de Cancelamento (cancel.html)             │
│ http://247barbearia.pt/cancel.html?token=a1b2c3d...       │
│ Mostra: "Tem certeza que quer cancelar?"                   │
│ Botão: "Sim, cancelar reserva"                             │
└────────────────────────────────────────────────────────────┘
                             ↓
┌────────────────────────────────────────────────────────────┐
│ POST /api/reservations/cancel/a1b2c3d...                   │
│ (sem autenticação)                                          │
└────────────────────────────────────────────────────────────┘
                             ↓
┌────────────────────────────────────────────────────────────┐
│ BACKEND: cancelReservationByToken()                        │
│ 1. Procura reserva com cancelToken = token                 │
│ 2. Deleta da base de dados                                 │
│ 3. Retorna dados para confirmação                          │
└────────────────────────────────────────────────────────────┘
                             ↓
┌────────────────────────────────────────────────────────────┐
│ Response 200                                                │
│ {                                                          │
│   "message": "Reserva cancelada com sucesso!",            │
│   "reservation": {                                         │
│     "clientName": "João Silva",                            │
│     "serviceName": "Corte Clássico",                       │
│     "date": "2026-04-15T09:00:00Z",                        │
│     "time": "09:00"                                        │
│   }                                                        │
│ }                                                          │
└────────────────────────────────────────────────────────────┘
                             ↓
┌────────────────────────────────────────────────────────────┐
│ FRONTEND: Confirmação de Cancelamento                      │
│ ✅ "Sua reserva foi cancelada com sucesso!"                │
└────────────────────────────────────────────────────────────┘
```

---

### 6.3 Fluxo: Verificação de Disponibilidade

```
┌──────────────────────────────────┐
│ Cliente clica data + barbeiro    │
└──────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: GET /api/reservations/barber/:id?date=2026-04-15│
└──────────────────────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────────┐
│ Backend: Retorna todas as reservas do dia                 │
│ [                                                         │
│   { timeSlot: "09:00", status: "confirmed", ... },       │
│   { timeSlot: "10:00", status: "confirmed", ... },       │
│   { timeSlot: "14:30", status: "confirmed", ... },       │
│ ]                                                         │
└──────────────────────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: Construir lookup table                          │
│ bookedSlots = {                                           │
│   "diogo-cunha-2026-04-15-09:00": true,                  │
│   "diogo-cunha-2026-04-15-10:00": true,                  │
│   "diogo-cunha-2026-04-15-14:30": true,                  │
│ }                                                         │
└──────────────────────────────────────────────────────────┘
             ↓
┌──────────────────────────────────────────────────────────┐
│ Frontend: renderTimeSlots()                               │
│ - Itera slots disponíveis: [09:00, 10:00, 11:00, ...]    │
│ - Se slotKey in bookedSlots → button.disabled = true    │
│ - Senão → clicável                                       │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Validações & Regras de Negócio

### 7.1 Validações de Input

#### Telefone (Portugal)

```javascript
// Válidos:
✓ +351 912345678
✓ +351912345678
✓ 912345678
✓ 212345678   (começa com 2 = linha fixa)

// Inválidos:
✗ 123456789   (não começa com 2 ou 9)
✗ 91234567    (menos de 9 dígitos)
✗ +3519123456789  (mais de 9 dígitos)

Regex: /^(\+351\s?)?[29]\d{8}$/
Normalization: remove spaces
```

#### Email

```javascript
// Validações:
1. Formato: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
2. Domínio válido: não .test ou .fake
3. Estrutura: user@domain.ext (mínimo 3 partes)

// Exemplos:
✓ joao@example.com
✓ pedro.silva@company.co.uk
✓ admin+tag@247barbearia.pt

✗ joao@.com        (sem domínio)
✗ email@test       (domínio inválido)
✗ email@.fake      (domínio inválido)
```

#### Data

```javascript
// Regras:
- Não pode ser passada
- Deve ser dia de trabalho (baseado em siteSchedule)
- Deve estar dentro do horário de funcionamento
- Mínima: today + 1 hora (se for hoje, mínimo 1h no futuro)
```

#### Time Slot

```javascript
// Formato: "HH:MM"
- Exemplo: "09:00", "14:30", "16:45"

// Cálculo automático:
- Baseado em siteSchedule[dayOfWeek]
- Intervalos de 60 minutos
- Exemplo (09:00-18:00): ["09:00", "10:00", "11:00", ... "17:00"]
```

### 7.2 Regras de Negócio

#### Barbeiros e Ausências

```javascript
// Ao marcar:
1. Verificar se barbeiro tem ausência NESTA DATA

   if (absence.type === "full") {
     → Dia inteiro indisponível
   }

   if (absence.type === "morning") {
     → Indisponível até meio-dia (00:00-11:59)
   }

   if (absence.type === "afternoon") {
     → Indisponível a partir do meio-dia (12:00-23:59)
   }

   if (absence.type === "specific") {
     → Indisponível entre startTime e endTime
   }

2. Se existe ausência → Rejeitar reserva com erro

   "Barbeiro indisponível nesta data/hora. Marque outra data."
```

#### Conflito de Reservas

```javascript
// Regra: 1 barbeiro = 1 cliente por time slot

// Query:
existingReservation = Reservation.findOne({
  barberId: X,
  reservationDate: { $gte: startOfDay, $lte: endOfDay },
  timeSlot: "09:00",
  status: { $ne: "cancelled" }  // Não conta canceladas
});

if (existingReservation) {
  → Rejeitar com erro
  "Esta hora já está reservada"
}
```

#### Status Transitions

```javascript
// Estados:
confirmed  → Estado padrão ao criar
pending    → Reservado mas não confirmado (futuro uso)
completed  → Serviço realizado (não pode reverter)
cancelled  → Anulado (final, não pode reverter)

// Transições válidas:
confirmed → completed  ✓
confirmed → cancelled  ✓
confirmed → pending    ✓
completed → X          ✗ (final)
cancelled → X          ✗ (final)
```

#### Cancelamento

```javascript
// Regra: Até 24h antes

currentTime = now
reservationTime = reservationDate + timeSlot
hoursUntil = (reservationTime - currentTime) / 3600000

if (hoursUntil < 24) {
  → Mostrar aviso: "Cancelamentos com menos de 24h podem não ser processados"
}

// Métodos de cancelamento:
1. Link no email (sem login) → POST /reservations/cancel/:token
2. Admin dashboard (login) → DELETE /reservations/:id
```

### 7.3 Ordem de Validações (Backend)

```
1. Dados obrigatórios presentes?
2. Formato de telefone válido? (se fornecido)
3. Formato de email válido?
4. Domínio de email real?
5. IDs (barberId, serviceId) são ObjectIds válidos?
6. Barbeiro existe? É ativo?
7. Serviço existe? É ativo?
8. Barbeiro tem ausência? (type: full/morning/afternoon/specific)
9. Slot já está reservado?
10. ✓ Tudo OK → Salvar + Emails
```

---

## 8. Decisões Arquiteturais

### 8.1 Por que Time Slots de 60 minutos?

```
- Maioria dos cortes leva 30-45 minutos
- 60 minutos = margem de segurança + limpeza
- Simplifica calendário
- Permite 1 cliente por barbeiro por hora

Alternativa rejeitada: 30 minutos
- Muito restritivo (até 16 slots/dia)
- Difícil de comunicar ao cliente
```

### 8.2 Por que Resend instead of EmailJS?

```
EmailJS (antigo):
✗ 200 emails/mês grátis (insuficiente)
✗ API key exposta no frontend (segurança)
✗ Envio do browser (menos confiável)

Resend (novo):
✓ 3000 emails/mês grátis (suficiente)
✓ API key no backend (seguro)
✓ Envio server-side (mais confiável)
✓ Domínio custom
✓ Templates HTML
✓ Tracking de entregas

Cálculo:
- 9 reservas/dia = 18 emails/dia (2x: cliente + admin)
- 18 × 30 dias = 540 emails/mês (< 3000)
```

### 8.3 Por que Verificações de Ausência no Backend?

```
❌ Fazer tudo no frontend:
- Dados desincronizados
- Cliente (ou bot) poderia pular validações
- Difícil manter sincronizado

✅ Backend authority:
- Sempre atualizado
- Impossível contornar
- Admin pode atualizar ausências em tempo real
```

### 8.4 Estrutura do CancelToken

```javascript
// Geração:
cancelToken = crypto.randomBytes(32).toString("hex")
// Resultado: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0... (64 char hex)

// Por que Unique + Sparse?
- Unique: cada token é único por reserva
- Sparse: permite null values (não ocupa espaço)
- Permite reutilização de tokens para novas reservas

// Segurança:
- 32 bytes × 2 (hex) = 64 caracteres
- 2^256 combinações
- Impossível adivinhar
```

### 8.5 Por que Popular Referências no Response?

```javascript
// Ao retornar reserva no criar:
await reservation.populate("barberId serviceId");

// Benefício:
✓ Cliente recebe dados completos (nome barbeiro, serviço)
✓ Não precisa fazer 2ª request
✓ Email consegue acesso a nomes

// Alternativa (sem populate):
- barberId = "6998aaf59..." (apenas ID)
- Precisaria fetch anterior para ter nomes
```

### 8.6 Por que Assíncrono para Emails?

```javascript
// ❌ Síncrono (bloqueia):
await sendBookingConfirmation(...);
await sendAdminNotification(...);
res.json(reservation);
// Tempo: 2 segundos + latência Resend

// ✅ Assíncrono (Promise.all):
Promise.all([
  sendBookingConfirmation(...),
  sendAdminNotification(...),
]).catch(err => console.error(err));
res.json(reservation);  // Responde imediatamente

// Tempo: <100ms
// Se emails falharem: não afeta cliente
```

### 8.7 Por que Deletar vs Soft Delete?

```
// Abordagem: Hard Delete
- DELETE de registros cancelados

Razão:
❌ Precisamos histórico para estatísticas? Usar cron jobs
✅ GDPR: deletar dados do cliente ao cancelar
✅ Base de dados limpa
✅ Apenas reservas "ativas" contam

// Se precisar histórico:
- Usar tabela de MonthlyStats (agregada)
- Cron jobs fazem agregação antes de deletar
```

### 8.8 Protocolo de Time Zone

```javascript
// Problema: UTC vs Local Time

// Solução frontend:
new Date(...).toISOString()  // Sempre UTC
// "2026-04-15T09:00:00Z"

// Solução backend:
- Guardar em UTC
- Formatar em PT-PT para emails
- Cliente vê hora em seu fuso

// Exemplo:
reservationDate: "2026-04-15T08:00:00Z"  // Backend (UTC)
→ Formatado para email: "15 de abril de 2026 às 9:00"  // PT-PT
```

### 8.9 Validação de Formato Date ISO

```javascript
// ❌ String simples:
"2026-04-15"

// ✅ ISO 8601:
"2026-04-15T09:00:00Z"

// Por quê?
- Suporta hora exata (time slot)
- Standard internacional
- MongoDB entende nativamente
- Evita ambiguidade timezone
```

---

## 📊 Resumo de Fluxos

| Fluxo            | Ator    | Início              | Fim                   | Status |
| ---------------- | ------- | ------------------- | --------------------- | ------ |
| Criar Reserva    | Cliente | Click "Marcar"      | Email + Modal sucesso | ✅     |
| Cancelar Email   | Cliente | Click link no email | Confirmação cancelada | ✅     |
| Cancelar Admin   | Admin   | Click botão         | Reserva deletada      | ✅     |
| Listar Reservas  | Admin   | Click "Reservas"    | Calendário mês        | ✅     |
| Filtrar Barbeiro | Admin   | Change select       | Recarrega calendar    | ✅     |

---

## 🔗 Referências de Ficheiros

| Funcionalidade      | Arquivo                                            | Linhas      |
| ------------------- | -------------------------------------------------- | ----------- |
| Modelo Reservation  | `backend/src/models/Reservation.js`                | 1-50        |
| Modelo Barber       | `backend/src/models/Barber.js`                     | 1-70        |
| Controller Reservas | `backend/src/controllers/reservationController.js` | 1-500+      |
| Serviço Email       | `backend/src/services/emailService.js`             | 1-350+      |
| Routes API          | `backend/src/routes/api.js`                        | 1-150+      |
| Frontend Booking    | `js/main.js`                                       | ~900-1573   |
| Admin Dashboard     | `admin/index.html`                                 | ~1486-1700+ |

---

## ✅ Checklist de Funcionalidades

- [x] Criar reserva (POST /reservations)
- [x] Listar por barbeiro (GET /reservations/barber/:id)
- [x] Atualizar status (PATCH /reservations/:id/status)
- [x] Deletar reserva (DELETE /reservations/:id)
- [x] Cancelar by token (POST /reservations/cancel/:token)
- [x] Verificar ausências
- [x] Verificar conflitos
- [x] Email confirmação
- [x] Email admin
- [x] SMS opcional
- [x] Booking modal 3 steps
- [x] Calendário dinâmico
- [x] Time slots com API
- [x] Admin dashboard
- [x] Filtros barbeiro
- [x] Cancelamento admin

---

## 🚀 API Request Template (Copy-Paste)

```bash
# Criar Reserva
curl -X POST https://two4-7-barbearia.onrender.com/api/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "barberId": "6998aaf59119a721cdc1e136",
    "serviceId": "507f1f77bcf86cd799439011",
    "clientName": "João Silva",
    "clientPhone": "+351 912 345 678",
    "clientEmail": "joao@example.com",
    "reservationDate": "2026-04-15T09:00:00Z",
    "timeSlot": "09:00"
  }'

# Listar Reservas Barbeiro
curl https://two4-7-barbearia.onrender.com/api/reservations/barber/6998aaf59119a721cdc1e136?date=2026-04-15

# Cancelar por Token
curl -X POST https://two4-7-barbearia.onrender.com/api/reservations/cancel/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

---

**Fim do Documento**
