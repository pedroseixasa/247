# 📊 Sistema de Marcações - Diagramas & Exemplos

---

## Diagramas de Fluxo

### Fluxo Geral da Reserva

```
┌─────────────────────┐
│ Cliente Acessa Site │
└──────────┬──────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Clica "Marcar" num Serviço       │
│ (openBookingModalFromCard)        │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│STEP 1: Seleciona Barbeiro         │
│ · Diogo Cunha (selected)          │
│ · Ricardo Silva                   │
│ [Validação] bookingState.barber? │
└──────────┬───────────────────────┘
           │
           ▼
     ┌─────────────┐
     │   Clica     │
     │ "Continuar" │
     └────┬────────┘
          │
          ▼
┌──────────────────────────────────┐
│STEP 2: Seleciona Data + Hora     │
│ · Calendário (renderCalendar)    │
│ · Time Slots (renderTimeSlots)   │
│ · API: /reservations/barber/:id  │
│        ?date=YYYY-MM-DD          │
└──────────┬───────────────────────┘
           │
           ├─► if today: filtra horas passadas
           │
           ├─► if past date: disabled
           │
           │
           ▼
     ┌─────────────┐
     │   Clica     │
     │ "Continuar" │
     └────┬────────┘
          │
          ▼
┌──────────────────────────────────┐
│STEP 3: Dados Cliente              │
│ · Nome (obrigatório)             │
│ · Telefone (validação)           │
│ · Email (validação + domínio)    │
│ · Resumo da reserva              │
└──────────┬───────────────────────┘
           │
           ├─► Validações tempo real
           │
           ▼
     ┌──────────────────┐
     │ "Confirmar Reserva"│
     │   (submitBooking)│
     └────┬─────────────┘
          │
          ▼
┌──────────────────────────────────┐
│POST /api/reservations            │
│ Body: {                          │
│   barberId,                      │
│   serviceId,                     │
│   clientName,                    │
│   clientPhone,                   │
│   clientEmail,                   │
│   reservationDate,               │
│   timeSlot                       │
│ }                                │
└──────────┬───────────────────────┘
           │
           ▼
┌──────────────────────────────────┐
│ BACKEND: createReservation()     │
│ ✓ Todas validações               │
│ ✓ Gera cancelToken               │
│ ✓ Salva em MongoDB               │
│ ✓ Envia emails (async)           │
│ + SMS (se Twilio)                │
└──────────┬───────────────────────┘
           │
           ▼
    ┌──────────────────┐
    │ Response 201     │
    │ + reservation    │
    └────┬─────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ FRONTEND: Success Modal         │
│ ✅ "Reserva Confirmada!"        │
│ · Data + Hora                   │
│ · Serviço + Barbeiro            │
│ [Fechar]                        │
└─────────────────────────────────┘
```

---

### Fluxo: Time Slots API

```
┌──────────────────────────────────────┐
│ Cliente seleciona:                    │
│ - Barbeiro: "diogo-cunha"            │
│ - Data: 2026-04-15                   │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Lookup: barbers["diogo-cunha"].id    │
│ = "6998aaf59119a721cdc1e136"         │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ GET /api/reservations/barber/        │
│     6998aaf59119a721cdc1e136?        │
│     date=2026-04-15                  │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ BACKEND QUERY:                        │
│ Reservation.find({                   │
│   barberId: ObjectId("..."),         │
│   reservationDate: {                 │
│     $gte: 2026-04-15T00:00:00Z,     │
│     $lte: 2026-04-15T23:59:59Z      │
│   }                                  │
│ }).populate("serviceId")             │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Response: Array de reservas do dia   │
│ [                                    │
│   {                                  │
│     timeSlot: "09:00",               │
│     status: "confirmed"              │
│   },                                 │
│   {                                  │
│     timeSlot: "11:00",               │
│     status: "confirmed"              │
│   }                                  │
│ ]                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ FRONTEND: Build bookedSlots          │
│ bookedSlots = {                      │
│   "diogo-cunha-2026-04-15-09:00": true,
│   "diogo-cunha-2026-04-15-11:00": true,
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ renderTimeSlots()                    │
│ · Gera slots: 09:00, 10:00, ...     │
│ · Verifica isBooked                  │
│ · Desabilita se booked               │
└──────────────────────────────────────┘
```

---

### Fluxo: Verificação de Ausências

```
┌─────────────────────────────────────────┐
│ Cliente submete reserva:                 │
│ barberId: "6998aaf59119a721cdc1e136"    │
│ reservationDate: "2026-04-15T09:00:00Z" │
│ timeSlot: "09:00"                       │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ BACKEND: Fetch barber by ID             │
│ barber.absences = [...]                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ LOOP absences:                           │
│ for (absence of barber.absences) {      │
│   if (absence.date === 2026-04-15) {    │
│     Check type...                       │
│   }                                     │
│ }                                       │
└────────┬────────────────────────────────┘
         │
         ▼
    ┌─────────────────────┐
    │ Encontrou ausência? │
    └──┬────────┬─────────┘
       │ SIM    │ NÃO
       ▼        ▼
    ❌ERRO   ✅CONTINUA
    "Indispo   Próxima
    nível"     validação
```

**Tipos de Ausência:**

```
type: "full" (dia inteiro)
└─► 09:00 = Indisponível
└─► 14:00 = Indisponível
└─► 18:00 = Indisponível

type: "morning" (antes do meio-dia)
└─► 09:00 = Indisponível
└─► 11:30 = Indisponível
└─► 14:00 = Disponível ✓

type: "afternoon" (depois do meio-dia)
└─► 09:00 = Disponível ✓
└─► 14:00 = Indisponível
└─► 18:00 = Indisponível

type: "specific" (entre horas)
startTime: "09:00", endTime: "11:30"
└─► 08:30 = Disponível ✓
└─► 09:00 = Indisponível
└─► 10:00 = Indisponível
└─► 11:30 = Disponível ✓
```

---

### Fluxo: Cancelamento via Email

```
┌─────────────────────────────────┐
│ Email ao Cliente                │
│ "Reserva Confirmada!"           │
│                                 │
│ [🗑️ CANCELAR RESERVA] ◄─ TOKEN  │
│ https://247barbearia.pt/        │
│ cancel.html?token=a1b2c3d...    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Cliente clica link              │
│ Abre cancel.html                │
│ JS lê token do URL              │
│ Mostra modal:                   │
│ "Tem certeza?"                  │
│ [Sim] [Não]                     │
└────────┬────────────────────────┘
         │ Clica "Sim"
         ▼
┌─────────────────────────────────┐
│ POST /api/reservations/cancel/  │
│      a1b2c3d4e5f6...            │
│ (sem autorização)               │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ BACKEND:                        │
│ 1. Find by cancelToken          │
│ 2. Delete from MongoDB          │
│ 3. Return data para confirmar   │
└────────┬────────────────────────┘
         │
         ├─► Encontrou? → Response 200
         │
         └─► Não encontrou? → 404
```

---

## Exemplos Práticos

### Exemplo 1: Cliente Marca Corte Clássico

#### Request

```json
POST /api/reservations
Content-Type: application/json

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

#### Response (201)

```json
{
  "message": "Reserva criada com sucesso!",
  "reservation": {
    "_id": "60d5ec49c1234567890abcde",
    "barberId": {
      "_id": "6998aaf59119a721cdc1e136",
      "name": "Diogo Cunha",
      "email": "diogo@247.pt"
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
    "cancelToken": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1",
    "notes": "Preferência: corte curto",
    "reminderSent": false,
    "createdAt": "2026-03-23T14:30:00.000Z"
  }
}
```

#### Emails Enviados (em paralelo)

**Email 1: Cliente**

```
From: 24.7 Barbearia <noreply@247barbearia.pt>
To: joao@example.com
Subject: ✅ Reserva Confirmada - quarta-feira, 15 de abril de 2026 às 09:00

---

Olá João Silva,

A sua reserva na 24.7 Barbearia foi confirmada com sucesso!

📅 Data: quarta-feira, 15 de abril de 2026
🕐 Hora: 09:00
✂️ Serviço: Corte Clássico
💈 Barbeiro: Diogo Cunha

O que deve saber:
- Por favor, chegue 5 minutos antes da hora marcada
- Em caso de atraso superior a 15 minutos, a reserva poderá ser cancelada
- Para cancelar, utilize o link abaixo até 24h antes da marcação

[🗑️ Cancelar Reserva](https://247barbearia.pt/cancel.html?token=a1b2c3d4e5f6...)

---

24.7 Barbearia
📍 Rua Exemplo, 123 - Almada, Portugal
📞 +351 912 345 678
```

**Email 2: Admin**

```
From: 24.7 Barbearia <noreply@247barbearia.pt>
To: admin@247barbearia.pt
Subject: 🔔 Nova Reserva - João Silva (quarta-feira, 15 de abril de 2026)

---

🔔 Nova Reserva Recebida

⚠️ Atenção: Uma nova reserva foi criada no sistema.

👤 Cliente: João Silva
📧 Email: joao@example.com
📞 Telefone: +351912345678
📅 Data: quarta-feira, 15 de abril de 2026
🕐 Hora: 09:00
✂️ Serviço: Corte Clássico
💈 Barbeiro: Diogo Cunha

Próximos passos:
- Verifique o painel de administração para mais detalhes
- Confirme a disponibilidade do barbeiro
- O cliente já recebeu email de confirmação automático
```

---

### Exemplo 2: Listar Slots Disponíveis

#### Request

```
GET /api/reservations/barber/6998aaf59119a721cdc1e136?date=2026-04-15
Authorization: Bearer {optional}
```

#### Response (200)

```json
[
  {
    "_id": "60d5ec49c1234567890abcd1",
    "barberId": "6998aaf59119a721cdc1e136",
    "serviceId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Corte Clássico"
    },
    "clientName": "Maria Costa",
    "clientPhone": "+351912111111",
    "clientEmail": "maria@example.com",
    "reservationDate": "2026-04-15T09:00:00.000Z",
    "timeSlot": "09:00",
    "status": "confirmed",
    "createdAt": "2026-03-20T10:15:00.000Z"
  },
  {
    "_id": "60d5ec49c1234567890abcd2",
    "barberId": "6998aaf59119a721cdc1e136",
    "serviceId": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Barba Completa"
    },
    "clientName": "Pedro Silva",
    "clientPhone": "+351912222222",
    "clientEmail": "pedro@example.com",
    "reservationDate": "2026-04-15T14:00:00.000Z",
    "timeSlot": "14:00",
    "status": "confirmed",
    "createdAt": "2026-03-19T15:45:00.000Z"
  }
]
```

**Frontend processando:**

```javascript
// Reservas encontradas: 09:00, 14:00
bookedSlots["diogo-cunha-2026-04-15-09:00"] = true;
bookedSlots["diogo-cunha-2026-04-15-14:00"] = true;

// Slots disponíveis: 10:00, 11:00, 12:00, 13:00, 15:00, 16:00, 17:00
// (Assumindo horário 09:00-18:00 com 60min intervals)
```

---

### Exemplo 3: Erro - Horário Já Reservado

#### Request

```json
POST /api/reservations

{
  "barberId": "6998aaf59119a721cdc1e136",
  "serviceId": "507f1f77bcf86cd799439011",
  "clientName": "Ana Santos",
  "clientEmail": "ana@example.com",
  "reservationDate": "2026-04-15T09:00:00Z",
  "timeSlot": "09:00"
}
```

#### Response (409)

```json
{
  "error": "Esta hora já está reservada"
}
```

---

### Exemplo 4: Erro - Barbeiro Indisponível

#### Scenario

Barbeiro "Diogo Cunha" tem:

```javascript
absences: [
  {
    date: "2026-04-16T00:00:00Z",
    type: "full",
    reason: "Férias",
  },
];
```

#### Request

```json
POST /api/reservations

{
  "barberId": "6998aaf59119a721cdc1e136",
  "serviceId": "507f1f77bcf86cd799439011",
  "clientName": "Roberto Oliveira",
  "clientEmail": "roberto@example.com",
  "reservationDate": "2026-04-16T10:00:00Z",
  "timeSlot": "10:00"
}
```

#### Response (409)

```json
{
  "error": "Barbeiro indisponível nesta data/hora. Marque outra data."
}
```

---

### Exemplo 5: Cancelamento por Token

#### Request

```
POST /api/reservations/cancel/a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1
Content-Type: application/json
```

#### Response (200)

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

---

### Exemplo 6: Listar Reservas Admin

#### Request

```
GET /api/admin/reservations?barberId=6998aaf59119a721cdc1e136
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200)

```json
[
  {
    "_id": "60d5ec49c1234567890abcd1",
    "barberId": {
      "_id": "6998aaf59119a721cdc1e136",
      "name": "Diogo Cunha"
    },
    "serviceId": {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Corte Clássico",
      "price": "15€"
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

## Casos de Teste

### TC-001: Fluxo Completo Sucesso

```
✓ Cliente clica "Marcar" em "Corte Clássico"
✓ Step 1: Seleciona "Diogo Cunha"
✓ Step 2: Seleciona 15/04/2026, 09:00
✓ Step 3: Preenche João Silva, +351912345678, joao@example.com
✓ Clica "Confirmar"
✓ POST /api/reservations retorna 201
✓ Email ao cliente recebido
✓ Email ao admin recebido
✓ Modal sucesso exibido
✓ Slot "09:00" agora aparece como "booked"
```

### TC-002: Data Passada

```
✓ Calendário desabilita 23/03/2026 (hoje)
✓ Cliente não consegue clicar em datas passadas
✓ Anterior em renderCalendar(): isPast && !isWorkDay → disabled
```

### TC-003: Horário Já Reservado

```
✓ Backend retorna 409: "Esta hora já está reservada"
✓ Frontend mostra erro: showBookingError()
✓ Modal não fecha
✓ Cliente pode tentar outro horário
```

### TC-004: Email Inválido

```
✓ Campo email com border vermelha ao sair (blur)
✓ Submit bloqueado com setCustomValidity()
✓ Mensagem: "Use um email real"
✓ Rejeita: joao@test, joao@fake, joao@.com
✓ Aceita: joao@example.com, joao@company.co.uk
```

### TC-005: Cancelamento 24h Antes

```
✓ Email contém link de cancelamento
✓ Cliente clica link
✓ cancel.html renderiza modal
✓ Clica "Sim, cancelar"
✓ POST /api/reservations/cancel/:token
✓ Backend deleta de MongoDB
✓ Response 200 com detalhes
✓ Frontend mostra: "Cancelada com sucesso!"
```

---

## JavaScript API Helper

```javascript
// Adicionar ao projeto para simplificar calls
class BookingAPI {
  static api = "https://two4-7-barbearia.onrender.com/api";

  static async createReservation(data) {
    const res = await fetch(`${this.api}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error((await res.json()).error);
    return res.json();
  }

  static async getBarberSlots(barberId, date) {
    const dateStr = date.toISOString().split("T")[0];
    const res = await fetch(
      `${this.api}/reservations/barber/${barberId}?date=${dateStr}`,
    );
    if (!res.ok) throw new Error("Erro ao carregar slots");
    return res.json();
  }

  static async cancelByToken(token) {
    const res = await fetch(`${this.api}/reservations/cancel/${token}`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("Erro ao cancelar");
    return res.json();
  }

  static async getAdminReservations(token, barberId = null) {
    const url = barberId
      ? `${this.api}/admin/reservations?barberId=${barberId}`
      : `${this.api}/admin/reservations`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Erro ao carregar");
    return res.json();
  }
}

// Uso
try {
  const result = await BookingAPI.createReservation({
    barberId: "...",
    serviceId: "...",
    clientName: "João",
    clientPhone: "+351912345678",
    clientEmail: "joao@example.com",
    reservationDate: new Date().toISOString(),
    timeSlot: "09:00",
  });
  console.log("✅ Reserva criada:", result);
} catch (err) {
  console.error("❌ Erro:", err.message);
}
```

---

**Fim do Documento**
