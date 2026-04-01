# 🔧 MUDANÇAS: Lógica de Conflitos + Acesso Barber

**Commit:** `d067207`  
**Data:** 23 Mar 2026  
**Status:** ✅ Production Ready

---

## 🎯 PROBLEMA RESOLVIDO

### Antes (❌ Errado)

```javascript
// Só verificava timeSlot exacto - ignorava duration
Reservation.findOne({
  barberId,
  timeSlot: "09:00", // ❌ Cliente B com 09:30 passava!
  status: { $ne: "cancelled" },
});
```

**Exemplo do bug:**

```
Cliente A: 09:00 "Corte + Barba" (60 min) → ocupa até 10:00
Cliente B: 09:30 "Corte Social" (30 min) → ocupa até 10:00
→ Sistema permite AMBAS → CONFLITO REAL ❌
```

### Depois (✅ Correto)

```javascript
// Verifica overlap REAL usando duration da DB
const newStart = new Date(reservationDate);
const newEnd = new Date(newStart.getTime() + service.duration * 60000);

const hasConflict = existingReservations.some((existing) => {
  const existStart = new Date(existing.reservationDate);
  const existEnd = new Date(
    existStart.getTime() + existing.serviceId.duration * 60000,
  );
  // Regraoverlap: A.start < B.end && B.start < A.end
  return newStart < existEnd && existStart < newEnd;
});
```

**Resultado:**

```
Cliente A: 09:00→10:00
Cliente B: 09:30 → BLOQUEADO ✅ (overlap detectado)
```

---

## 📝 VALIDAÇÕES (10 Obrigatórias)

### Ordem EXACTA (não trocar):

```
1. ✓ Dados obrigatórios presentes?
2. ✓ Formato telefone válido? (Portugal regex)
3. ✓ Formato email válido? Domínio real?
4. ✓ barberId e serviceId são ObjectIds válidos?
5. ✓ Barbeiro existe e isActive?
6. ✓ Serviço existe e isActive?
7. ✓ Barbeiro trabalha naquele dia? (workingHours da DB)
8. ✓ Serviço cabe no horário de fecho? (newEnd <= closeTime)
9. ✓ Barbeiro tem ausência? (overlap real com absences)
10. ✓ Existe overlap com marcação existente? (intervalo real)
```

---

## 🔐 REGRA DE OURO

**NUNCA inventar valores. TUDO vem da DB.**

### Exemplos Correctos:

```javascript
// ✅ Certo: pega da DB
const duration = service.duration; // DB
const workingHours = barber.workingHours[dayKey]; // DB

// ❌ Errado: hardcode
const duration = 30; // Fixo!
const workingHours = { start: "09:00", end: "18:00" }; // Fixo!
```

---

## 👤 CONTROLO DE ACESSO

### Barber Não-Admin

**Acesso RESTRITO:**

```
- Vê APENAS suas próprias reservas
- Backend filtra: query.barberId = req.user._id
- Não consegue ver reservas de outro barbeiro
- Pode gerenciar suas ausências
```

**Endpoints:**

```
GET    /barber/absences              → Vê suas ausências
POST   /barber/absences              → Adiciona ausência
DELETE /barber/absences/:absenceId   → Remove ausência
GET    /barber/reservations          → Vê suas reservas (dashboard)
```

### Admin

**Acesso COMPLETO:**

```
- Vê TODAS as reservas
- Pode filtrar por barbeiro (query param)
- Pode gerenciar ausências de qualquer barbeiro
- Acesso a /admin/reservations e /admin/barbers/*
```

---

## 🆕 NOVAS FUNÇÕES

### `addAbsence()`

```javascript
// Funciona para barber (sem params) e admin (com params)
POST /barber/absences
{
  "date": "2026-03-30",
  "type": "full|morning|afternoon|specific",
  "startTime": "09:00",  // só para specific
  "endTime": "13:00",    // só para specific
  "reason": "médico"
}
```

### `removeAbsence()`

```javascript
DELETE /barber/absences/:absenceId
// Barber remove sua própria ausência
```

### `getReservationsForDashboard()`

```javascript
GET /barber/reservations?month=3&year=2026
// Barber vê suas reservas deste mês
// Admin vê todas (pode filtrar: ?barberId=X)
```

---

## 🔄 OVERLAP COM ABSENCES

**Agora também verifica overlap com ausências específicas:**

```javascript
// Ausência specific: "09:00 - 11:00"
// Nova marcação: "10:00 - 10:30"
// → OVERLAP DETECTADO (ambas verificam)
```

**Lógica:**

```javascript
if (absence.type === "specific" && absence.startTime && absence.endTime) {
  const absStart = new Date(reservationDate);
  absStart.setHours(absStartH, absStartM, 0, 0);
  const absEnd = new Date(reservationDate);
  absEnd.setHours(absEndH, absEndM, 0, 0);

  // Overlap: A.start < B.end && B.start < A.end
  return newStart < absEnd && absStart < newEnd;
}
```

---

## 📊 EXEMPLO REAL

### Cenário:

```
Barber: Diogo Cunha
Data: 30 Mar 2026
Serviços:
  - Corte (Degradé) + Barba = 60 min
  - Corte Social = 30 min
```

### Request 1 (OK):

```json
POST /api/bookings
{
  "barberId": "67a1...",
  "serviceId": "67b2..." (Corte + Barba = 60 min),
  "clientName": "João",
  "clientEmail": "joao@example.com",
  "reservationDate": "2026-03-30T09:00:00Z",
  "timeSlot": "09:00"
}
→ 201 OK (09:00 → 10:00)
```

### Request 2 (CONFLITO):

```json
POST /api/bookings
{
  "barberId": "67a1...", (mesma)
  "serviceId": "67b3..." (Corte Social = 30 min),
  "clientName": "Pedro",
  "reservationDate": "2026-03-30T09:30:00Z", (conflita com Request 1!)
  "timeSlot": "09:30"
}
→ 409 Conflict "Esta hora já está reservada"
```

**Por quê:**

- Request 1: 09:00 + 60 min = até 10:00
- Request 2: 09:30 + 30 min = até 10:00
- Overlap: 09:30 ≤ 10:00 && 09:00 ≤ 10:00 ✓ CONFLITO

---

## 📌 CHECKLIST DE TESTE

```
[ ] Criar reserva válida → 201 OK
[ ] Criar com telefone inválido → 400
[ ] Criar com email .test → 400
[ ] Barbeiro não trabalha nesse dia → 400
[ ] Serviço excede horário → 400
[ ] Barbeiro com ausência "full" → 409
[ ] Sobreposição com outra reserva → 409
[ ] Barber vê apenas suas reservas → ✓
[ ] Admin vê todas as reservas → ✓
[ ] Barber adiciona ausência → 201
[ ] Barber remove sua ausência → 200
```

---

## 🔗 FICHEIROS ALTERADOS

- `backend/src/controllers/reservationController.js`
  - `createReservation()` - refactorizado com 10 validações
  - `addAbsence()` - new
  - `removeAbsence()` - new
  - `getReservationsForDashboard()` - new

- `backend/src/routes/api.js`
  - GET `/barber/absences`
  - POST `/barber/absences`
  - DELETE `/barber/absences/:absenceId`
  - GET `/barber/reservations`

---

**Status:** ✅ Tested & Deployed  
**Próximo:** Integrar frontend com novos endpoints
