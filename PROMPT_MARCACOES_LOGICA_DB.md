# 🎯 PROMPT: Lógica Completa de Marcações e DB

**Última atualização:** 23 Mar 2026  
**Formato:** Pronto para usar em contexto IA / Onboarding técnico

---

## 📊 ESTRUTURA DE DADOS

### Reservation (7 campos ativos)

```json
{
  "_id": "ObjectId",
  "barberId": "Ref→Barber._id",
  "serviceId": "Ref→Service._id",
  "clientName": "String (obrigatório)",
  "clientPhone": "String "+351 2/9XXXXXXXX" (optional)",
  "clientEmail": "String (obrigatório, email real)",
  "reservationDate": "ISO 8601 no futuro",
  "timeSlot": "HH:MM (ex: '14:30')",
  "status": "confirmed|pending|cancelled|completed (default: confirmed)",
  "cancelToken": "String unique (32 bytes crypto, sparse)",
  "reminderSent": "Boolean (default: false)",
  "notes": "String (optional)",
  "createdAt": "ISO 8601 auto",
  "updatedAt": "ISO 8601 auto"
}
```

### Barber (com ausências)

```json
{
  "_id": "ObjectId",
  "name": "String",
  "email": "String",
  "workingHours": {
    "monday": { "start": "09:00", "end": "18:00" },
    "tuesday": { "start": "09:00", "end": "18:00" },
    "wednesday": { "start": "09:00", "end": "18:00" },
    "thursday": { "start": "09:00", "end": "18:00" },
    "friday": { "start": "09:00", "end": "18:00" },
    "saturday": { "start": "10:00", "end": "16:00" },
    "sunday": null
  },
  "absences": [
    {
      "date": "ISO 8601",
      "type": "full|morning|afternoon|specific",
      "startTime": "HH:MM (só para specific)",
      "endTime": "HH:MM (só para specific)",
      "reason": "String (optional)"
    }
  ],
  "isActive": "Boolean",
  "createdAt": "ISO 8601"
}
```

### Service

```json
{
  "_id": "ObjectId",
  "name": "String",
  "price": "Number|String",
  "duration": "Number (minutos)",
  "description": "String",
  "order": "Number (para reordenar)",
  "isActive": "Boolean (default: true)",
  "createdAt": "ISO 8601"
}
```

---

## 🔌 API ENDPOINTS

### 1. CREATE Reservation

```
POST /api/bookings
Headers: Content-Type: application/json

REQUEST:
{
  "barberId": "67a1b2c3d4e5f6g7h8i9j0k1",
  "serviceId": "67a1b2c3d4e5f6g7h8i9j0k2",
  "clientName": "João Silva",
  "clientPhone": "+351 912345678",
  "clientEmail": "joao@example.com",
  "reservationDate": "2026-03-30T14:30:00Z",
  "timeSlot": "14:30",
  "notes": "Corte com design específico"
}

VALIDAÇÕES:
✓ barberId, serviceId: ObjectId válido + exists
✓ clientName: non-empty string
✓ clientPhone: regex portugal +351 2/9 ou 2/9 (7-9 digits)
✓ clientEmail: email real, não .test/.fake
✓ reservationDate: Date > now, ISO 8601
✓ timeSlot: "HH:MM" format válido
✓ Sem conflito: outro Reservation same barber+date+timeSlot+confirmed
✓ Barber não tem ausência nesta data/timeSlot
✓ timeSlot está em workingHours do barber

RESPONSE 201:
{
  "_id": "67a1b2c3d4e5f6g7h8i9j0k3",
  "barberId": "67a1b2c3d4e5f6g7h8i9j0k1",
  "serviceId": "67a1b2c3d4e5f6g7h8i9j0k2",
  "clientName": "João Silva",
  "clientEmail": "joao@example.com",
  "reservationDate": "2026-03-30T14:30:00Z",
  "timeSlot": "14:30",
  "status": "confirmed",
  "cancelToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
  "createdAt": "2026-03-23T10:30:00Z"
}

SIDE-EFFECTS:
→ Enviar email ao cliente (Resend)
→ Enviar notificação ao admin (Resend)
→ Log em MongoDB

ERRORS:
400: campos obrigatórios faltam
400: email inválido
400: telefone formato errado
400: data no passado
400: barbeiro com ausência
400: conflito com outra reserva
500: erro BD
```

### 2. LIST Reservations (filtrado)

```
GET /api/admin/reservations?month=3&year=2026&barberId=67a1b2c3d4e5f6g7h8i9j0k1&status=confirmed
Headers: Authorization: Bearer <token>

QUERY PARAMS:
- month: 1-12 (opcional, default: mês current)
- year: YYYY (opcional, default: year current)
- barberId: ObjectId (opcional, default: todos)
- status: confirmed|cancelled|completed (opcional)

RESPONSE 200:
{
  "total": 12,
  "reservations": [
    {
      "_id": "...",
      "barberId": { "_id": "...", "name": "Diogo Cunha" },
      "serviceId": { "name": "Corte Clássico", "price": 15 },
      "clientName": "João Silva",
      "reservationDate": "2026-03-30T14:30:00Z",
      "timeSlot": "14:30",
      "status": "confirmed"
    },
    ...
  ]
}

ERRORS:
401: sem token
403: sem permissão admin
400: month/year inválidos
500: erro BD
```

### 3. CANCEL Reservation (via token)

```
DELETE /api/reservations/:reservationId
Headers: Content-Type: application/json
Body: {
  "cancelToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
}

VALIDAÇÕES:
✓ reservationId válido
✓ cancelToken matches
✓ reservationDate > now (não cancelar passado)

RESPONSE 200:
{
  "message": "Reserva cancelada com sucesso",
  "reservation": {
    "_id": "...",
    "status": "cancelled",
    "cancelledAt": "2026-03-23T10:35:00Z"
  }
}

SIDE-EFFECTS:
→ Email ao cliente confirmando cancelamento
→ Notificação admin

ERRORS:
404: reservação não encontrada
400: token inválido
400: data no passado (não cancelar)
500: erro BD
```

### 4. RESCHEDULE Reservation

```
PATCH /api/reservations/:reservationId
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

BODY:
{
  "reservationDate": "2026-04-05T15:00:00Z",
  "timeSlot": "15:00"
}

VALIDAÇÕES:
✓ Mesmas validações que CREATE
✓ Usuário = admin ou cliente (via token)
✓ Nova data > now
✓ Sem conflito na nova data/time

RESPONSE 200:
{ "message": "Reserva remarcada", "_id": "...", "reservationDate": "2026-04-05T15:00:00Z" }

ERRORS:
400: validações falharam
404: não encontrada
403: sem permissão
```

### 5. GET Time Slots (cálculo real)

```
GET /api/barbers/:barberId/time-slots?date=2026-03-30
Headers: Authorization: Bearer <token>

QUERY:
- date: ISO DATE (ex: "2026-03-30")

RESPONSE 200:
{
  "date": "2026-03-30",
  "barber": "Diogo Cunha",
  "workingHours": { "start": "09:00", "end": "18:00" },
  "slots": [
    {
      "time": "09:00",
      "available": true,
      "service": "Corte Clássico (30 min)"
    },
    {
      "time": "09:30",
      "available": true,
      "service": "Corte Clássico (30 min)"
    },
    {
      "time": "10:00",
      "available": false,
      "reason": "Reserva confirmada"
    },
    {
      "time": "10:30",
      "available": false,
      "reason": "Ausência: afternoon"
    },
    ...
  ]
}

ALGORITMO:
1. Verificar se barber existe e isActive
2. Pegar workingHours do dia da semana
3. Verificar ausências (full, morning/afternoon, specific)
4. Iterar 09:00 → 17:30 (intervals 30 min) ❌ NOVA: 60 min!
5. Para cada slot:
   a. Verificar se está em workingHours
   b. Verificar se há ausência que cubra
   c. Verificar se há Reservation confirmada
   d. Se OK → available: true
6. Retornar array

ERRORS:
404: barbeiro não encontrado
400: date inválido
400: data no passado
```

### 6. GET Availabilty Calendar

```
GET /api/barbers/:barberId/availability?month=3&year=2026

RESPONSE 200:
{
  "barber": "Diogo Cunha",
  "month": 3,
  "year": 2026,
  "calendar": [
    {
      "date": "2026-03-30",
      "dayOfWeek": "Sunday",
      "available": false,
      "reason": "Fechado"
    },
    {
      "date": "2026-03-31",
      "dayOfWeek": "Monday",
      "available": true,
      "slotsCount": 8
    },
    ...
  ]
}
```

---

## 🎨 FRONTEND LOGIC (Booking Modal 3 Steps)

### Step 1: Selecionar Barbeiro

```javascript
// HTML
<div class="step-1">
  <h3>Escolher Barbeiro</h3>
  <div class="barber-options">
    <button onclick="selectBarber('67a1b2c3d4e5f6g7h8i9j0k1')">
      👨 Diogo Cunha
    </button>
    <button onclick="selectBarber('67a1b2c3d4e5f6g7h8i9j0k2')">
      👨 Ricardo Silva
    </button>
  </div>
</div>;

// JS
async function selectBarber(barberId) {
  bookingData.barberId = barberId;
  // Fetch calendário do barbeiro
  const calendar = await fetch(
    `/api/barbers/${barberId}/availability?month=${currentMonth}&year=${currentYear}`,
    { headers: { Authorization: `Bearer ${token}` } },
  ).then((r) => r.json());
  showStep2(calendar);
}
```

### Step 2: Escolher Data + Hora

```javascript
// HTML
<div class="step-2">
  <h3>Escolher Data e Hora</h3>
  <input type="date" id="dateInput" min="today">
  <div id="timeSlotsContainer"></div>
</div>

// JS
async function loadTimeSlots(date) {
  const slots = await fetch(
    `/api/barbers/${bookingData.barberId}/time-slots?date=${date}`,
    { headers: { 'Authorization': `Bearer ${token}` } }
  ).then(r => r.json());

  renderSlots(slots.slots);
}

function selectTimeSlot(time) {
  bookingData.reservationDate = dateInput.value + "T" + time;
  bookingData.timeSlot = time;
  showStep3();
}
```

### Step 3: Preencher Dados

```javascript
// HTML
<div class="step-3">
  <h3>Confirmação</h3>
  <form>
    <input type="text" id="nameInput" placeholder="Nome completo" required>
    <input type="tel" id="phoneInput" placeholder="+351 9XXXXXXXX" pattern="+351 [29]\d{8}">
    <input type="email" id="emailInput" placeholder="Email" required>
    <button type="submit">Confirmar Marcação</button>
  </form>
</div>

// JS - Submit
async function submitBooking() {
  const payload = {
    barberId: bookingData.barberId,
    serviceId: selectedServiceId,
    clientName: nameInput.value,
    clientPhone: phoneInput.value,
    clientEmail: emailInput.value,
    reservationDate: bookingData.reservationDate,
    timeSlot: bookingData.timeSlot,
    notes: ""
  };

  const response = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    showSuccessModal("Marcação confirmada!");
  } else {
    const error = await response.json();
    showErrorModal(error.error);
  }
}
```

---

## 💌 EMAIL SYSTEM (Resend)

### Template 1: Confirmação Cliente

```html
<h1>✅ Sua Marcação foi Confirmada!</h1>

<p>Olá {{ clientName }},</p>

<p>Sua marcação foi confirmada com sucesso:</p>

<div class="booking-details">
  <p><strong>Barbeiro:</strong> {{ barberName }}</p>
  <p><strong>Serviço:</strong> {{ serviceName }}</p>
  <p><strong>Data:</strong> {{ reservationDate }}</p>
  <p><strong>Hora:</strong> {{ timeSlot }}</p>
  <p><strong>Preço:</strong> {{ servicePrice }}</p>
</div>

<p>
  <a href="https://247barbearia.pt/cancel?token={{ cancelToken }}">
    Cancelar Marcação
  </a>
</p>

<p>Nos vemos em breve!</p>
```

### Template 2: Notificação Admin

```html
<h1>📋 Nova Marcação Recebida</h1>

<div class="admin-details">
  <p><strong>Cliente:</strong> {{ clientName }}</p>
  <p><strong>Telefone:</strong> {{ clientPhone }}</p>
  <p><strong>Email:</strong> {{ clientEmail }}</p>
  <p><strong>Barbeiro:</strong> {{ barberName }}</p>
  <p><strong>Data/Hora:</strong> {{ reservationDate }} {{ timeSlot }}</p>
  <p><strong>Serviço:</strong> {{ serviceName }}</p>
</div>

<a href="https://247barbearia.pt/admin/reservations?id={{reservationId}}">
  Ver no Admin
</a>
```

### Código de Envio (Backend)

```javascript
// src/services/emailService.js
async function sendBookingConfirmation(reservation, barber, service) {
  const cancelLink = `https://247barbearia.pt/cancel?token=${reservation.cancelToken}`;

  await resend.emails.send({
    from: "noreply@247barbearia.pt",
    to: reservation.clientEmail,
    subject: "✅ Marcação confirmada - 24.7 Barbearia",
    html: fillTemplate(BOOKING_CLIENT_TEMPLATE, {
      clientName: reservation.clientName,
      barberName: barber.name,
      serviceName: service.name,
      reservationDate: format(reservation.reservationDate, "dd/MM/yyyy"),
      timeSlot: reservation.timeSlot,
      servicePrice: service.price,
      cancelToken: reservation.cancelToken,
      cancelLink,
    }),
  });
}

// Na controller (after save)
await Promise.all([
  sendBookingConfirmation(reservation, barber, service),
  sendAdminNotification(reservation, barber, service),
]);
```

---

## 👨‍💼 ADMIN DASHBOARD

### Vista: Calendário Mensal

```
┌─────────────────────────────────────────┐
│ MARÇO 2026 | Filtro Barbeiro: Todos    │
├─────────────────────────────────────────┤
│ SEG  TER  QUA  QUI  SEX  SÁB  DOM       │
│  1    2    3    4    5    6    7        │
│  8    9   10   11   12   13   14        │
│ 15   16   17   18   19   20   21        │
│     23🔴  24   25   26   27   28        │
│ 29   30   31                            │
└─────────────────────────────────────────┘

🔴 = 1 marcação hoje
🟢 = 2+ marcações
🟡 = 1 ausência
🔵 = 2+ ausências
```

### Vista: Listagem Detalhada

```
Date: 2026-03-23
Barbeiro: Diogo Cunha

│ Hora  │ Cliente      │ Serviço          │ Status │ Actions    │
├───────┼──────────────┼──────────────────┼────────┼────────────┤
│ 09:00 │ João Silva   │ Corte Clássico   │ ✅ OK  │ 🗑️ Cancel │
│ 09:30 │ Pedro Costa  │ Barba + Corte    │ ✅ OK  │ 🗑️ Cancel │
│ 10:00 │ [AUSÊNCIA]   │ Almoço           │ 🟡 ABS │ ✏️ Edit   │
│ 14:30 │ Maria José   │ Corte Fade       │ ✅ OK  │ 🗑️ Cancel │
└───────┴──────────────┴──────────────────┴────────┴────────────┘
```

### Ações Admin

```javascript
// Cancelar marcação
async function cancelReservation(reservationId) {
  const confirmed = await showModal("Tem certeza?");
  if (confirmed) {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      reloadReservations();
      // Email ao cliente já foi enviado pelo backend
    }
  }
}

// Ver detalhes
function viewDetails(reservationId) {
  const res = allReservations.find((r) => r._id === reservationId);
  showModal(`
    Nome: ${res.clientName}
    Telefone: ${res.clientPhone}
    Email: ${res.clientEmail}
    Barbeiro: ${res.barberId.name}
    Serviço: ${res.serviceId.name}
    Data/Hora: ${res.reservationDate} ${res.timeSlot}
  `);
}
```

---

## ✅ VALIDAÇÕES (CHECKLIST)

### Telefone Portugal

```regex
^(\+351\s?|00351\s?|0)?([2|9]\d{8})$
Aceita: +351 912345678, 0912345678, 912345678
Rejeita: 808-123456 (números especiais), 123456789 (sem 2/9)
```

### Email Real

```javascript
// Rejeita domínios fake
const fakeEmails = ["test.com", "fake.com", "temp-mail.com", "mail.tm"];
if (fakeEmails.some((fake) => email.includes(fake))) {
  throw new Error("Email inválido para confirmação");
}
```

### Data/Hora

```javascript
✓ Data no futuro (> now)
✓ Data é dia da semana trabalhando (Mon-Sat)
✓ Hora está em workingHours
✓ Não há conflito com outra reserva
✓ Não há ausência do barbeiro
```

### Time Slot

```javascript
// Formato HH:MM
// Intervalo 60 minutos (não 30)
// Entre start-end de workingHours
// Sem overlap com outra reserva (mesmo barbeiro)
```

---

## 🏗️ FLUXO COMPLETO (Diagram)

```
CLIENTE                        BACKEND                        ADMIN
   │                              │                              │
   ├─ Abre site                  │                              │
   │  marca serviço              │                              │
   │                              │                              │
   ├─ Modal Step 1:           ┌─────────────────────┐           │
   │  Escolhe barbeiro ──────► │ Fetch barbers list │           │
   │                           └─────────────────────┘           │
   │                              │                              │
   ├─ Modal Step 2:           ┌─────────────────────────┐        │
   │  Escolhe data/hora ─────►│ GET /time-slots        │        │
   │  [API calcula]           │ - Check workingHours   │        │
   │                           │ - Check absences       │        │
   │                           │ - Check conflicts      │        │
   │                           └─────────────────────────┘        │
   │                              │                              │
   ├─ Modal Step 3:           ┌─────────────────────────┐        │
   │  Preenche dados           │ POST /bookings         │        │
   │  [Valida]                 │ - Valida tudo          │        │
   │  Submete ─────────────►   │ - Salva em MongoDB     │        │
   │                           │ - Email ao cliente     │        │
   │                           │ - Email ao admin ──────┼──────► ├─ Recebe notif
   │                           └─────────────────────────┘        │
   │                              │                              │
   ├─ Success modal           ◄───┤ Resposta 201 OK              │
   │  [Reserva confirmada]        │                              │
   │                              │                              │
   ├─ Email de confirmação    ◄───┤ Resend                       │
   │  com token cancelamento      └─────────────────────┐        │
   │                                                     │        │
   │                                                     ├──────► ├─ Dashboard
   │                                                     │        │  atualiza
   │                                                     │        │
   ├─ [Cliente quer cancelar]                           │        │
   │  Clica link email           ┌─────────────────────┐│        │
   │  DELETE /reservations ─────►│ status = cancelled  ││        │
   │  com token                  │ Email confirmação   ││        │
   │                             │------────────────────┼├──────► │
   │◄──────────────────────────────  Confirmação       │         │
   │       Email
   │
```

---

## 🔐 SEGURANÇA

### Cancel Token

```javascript
const crypto = require("crypto");

// Gerado na criação da reserva
const cancelToken = crypto.randomBytes(32).toString("hex");
// Resultado: "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t"

// Armazenado em DB com sparse index
index({ cancelToken: 1 }, { sparse: true });

// Compartilhado APENAS no email do cliente
// Admin NÃO tem acesso direto (cancela via admin token)
```

### Backend Authority

```javascript
// DELETE é feito via cancellToken do cliente OU admin token
// Não há forma de cancelar sem token válido

POST /reservations/:id/cancel
Body: { cancelToken: "a1b2c3d4e5f6g7..." }

vs

DELETE /reservations/:id
Headers: Authorization: Bearer <admin-token>
```

---

## 🚨 DECISÕES ARQUITETURAIS (POR QUÊ)

### 1️⃣ Time Slots de 60 minutos (não 30)

**Motivo:** Margem segurança entre serviços (Setup, cleanup, atraso)

### 2️⃣ Resend vs EmailJS

**Motivo:** 3000 emails/mês grátis, backend authority, domínio custom

### 3️⃣ Ausências no Backend

**Motivo:** Authority (servidor fonte verdade), não frontend

### 4️⃣ Hard Delete (não soft delete)

**Motivo:** GDPR compliance, dados cliente não persistem indefinidamente

### 5️⃣ ISO 8601 + UTC

**Motivo:** Standard internacional, sem ambiguidade timezone

### 6️⃣ Populate refs no email

**Motivo:** Dados completos sem N+1 queries

### 7️⃣ Async email (Promise.all)

**Motivo:** Não bloqueia resposta API

### 8️⃣ Sparse index cancelToken

**Motivo:** Permite NULL, só indexa tokens reais

### 9️⃣ Status = confirmed (não pending)

**Motivo:** UX simples (confirmação instantânea no modal)

---

## 📚 FICHEIROS BACKEND

| Funcionalidade | Arquivo                                    | Responsabilidade      |
| -------------- | ------------------------------------------ | --------------------- |
| Schema         | `src/models/Reservation.js`                | Definir estrutura     |
| Controller     | `src/controllers/reservationController.js` | Endpoints + validação |
| Email          | `src/services/emailService.js`             | Enviar via Resend     |
| Routes         | `src/routes/api.js`                        | Bind endpoints        |
| Middleware     | `src/middleware/auth.js`                   | JWT validation        |

---

## 🧪 CASOS DE TESTE

### TC-001: Criar marcação válida

```
Input: { barberId, serviceId, clientName, clientPhone, clientEmail, date, timeSlot }
Output: 201 Created + email enviado
```

### TC-002: Criar com conflito

```
Input: Mesma data/hora/barbeiro segunda vez
Output: 400 Bad Request "Slot não disponível"
```

### TC-003: Cancelar com token

```
Input: DELETE /reservations/:id + { cancelToken }
Output: 200 OK + status="cancelled" + email
```

### TC-004: Resgatar time slots

```
Input: GET /time-slots?date=2026-03-30&barberId=X
Output: Array com slots + available boolean
Algoritmo: Check workingHours → Check absences → Check conflicts
```

### TC-005: Admin cancela

```
Input: DELETE /reservations/:id + { adminToken }
Output: 200 OK + email ao cliente
```

---

## 🎓 PARA USAR ESTE PROMPT

### 1. Integração Nova Feature

- Lê secção de **Validações**
- Lê secção de **Decisões Arquiteturais**
- Copia payload JSON de exemplo

### 2. Troublehooting Bug

- Verifica **Fluxo Completo**
- Testa **Casos de Teste**
- Valida contra **Checklist Validações**

### 3. Apresentar Cliente

- Usa **Diagrama de Fluxo**
- Mostra **Exemplos JSON**
- Explica **Templates Email**

### 4. Onboarding Dev Novo

- Lê tudo sequencialmente
- Testa TC-001, TC-002, TC-003
- Lê código fonte real em `/backend/src/`

---

**Versão:** 2.0 (23 Mar 2026)  
**Status:** Production Ready  
**Manutentor:** Backend Team
