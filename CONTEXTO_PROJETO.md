# 📋 CONTEXTO_PROJETO.md - Barbearia 24.7

**Atualizado:** 23 Mar 2026 | **Versão:** 2.0  
**Repo:** https://github.com/pedroseixasa/247 | **Live:** https://247barbearia.pt

---

## 🏗️ STACK & ARQUITECTURA

| Componente | Tecnologia | Observações |
|------------|-----------|-------------|
| **Frontend** | Vanilla HTML/CSS/JS | SPA, hosted em GitHub Pages |
| **Backend** | Node.js + Express | Deployed em Render.com |
| **Database** | MongoDB Atlas | Mongoose ODM |
| **Email** | Resend + Twilio SMS | 3000 emails/mês (free tier) |
| **Auth** | JWT (Bearer tokens) | Role-based (admin/barber) |

**Arquitetura:** Client envia requests → Backend Render valida/processa → MongoDB retorna dados → Response JSON

---

## 🗄️ MODELOS DATABASE

### **Service**
- `_id`: ObjectId
- `name`: String (ex: "Corte degradé")
- `price`: Number (EUR, ex: 12)
- `duration`: **Number (MINUTOS)** ⚠️ CRÍTICO
- `description`: String
- `order`: Number (sequência UI)
- `isActive`: Boolean

### **Barber**
- `_id`: ObjectId
- `name`: String
- `email`: String (login)
- `password`: String (hashed bcrypt)
- `role`: "admin" | "barber"
- `workingHours`: Object
  - `[dayOfWeek]`: { start: "09:00", end: "19:00" } (seg-dom)
- `absences`: Array
  - `_id`: ObjectId
  - `date`: Date (ISO)
  - `type`: "full" | "morning" | "afternoon" | "specific"
  - `startTime`/`endTime`: String (se specific)
  - `reason`: String (opcional)
- `isActive`: Boolean

### **Reservation**
- `_id`: ObjectId
- `barberId`: ObjectId (ref Barber) ⚠️ OBRIGATÓRIO
- `serviceId`: ObjectId (ref Service) ⚠️ OBRIGATÓRIO
- `clientName`: String
- `clientEmail`: String (válido, rejeita .test/.fake)
- `clientPhone`: String (formato PT válido: 9xxxxxxxx)
- `reservationDate`: Date (ISO)
- `timeSlot`: String (ex: "09:00")
- `status`: "pending" | "confirmed" | "cancelled"
- `cancelToken`: String (UUID para cancelamento público)
- `createdAt`: Date
- `updatedAt`: Date

### **Review**
- `_id`: ObjectId
- `clientName`: String
- `clientEmail**: String
- `rating`: Number (1-5)
- `comment`: String
- `source`: "google" | "manual"

### **SiteSettings**
- `_id`: ObjectId
- `hero`: Object (subtitle, cta text/link)
- `about`: Object (title, description)
- `staff`: Object (titles, descriptions)
- `contact`: Object (address, phone, email, hours)
- `barberCards`: Object (barber1/2 names, roles, images)

### **MonthlyStats**
- `_id`: ObjectId
- `month`: Number (1-12)
- `year`: Number
- `totalReservations`: Number
- `revenuePast`: Number (reservas com data <= hoje)
- `revenueFuture`: Number (reservas com data > hoje)
- `cancelledCount`: Number
- `weeklyBreakdown`: Array (7 objetos, seg-dom)

---

## 🔌 ENDPOINTS API

### **PÚBLICOS** (sem autenticação)

| Método | Rota | Propósito |
|--------|------|-----------|
| POST | `/reservations` | Criar reserva |
| POST | `/reservations/cancel/:token` | Cancelar via email link |
| GET | `/site-settings` | Dados dinâmicos (hero, about, etc) |
| GET | `/reviews/random` | 3 avaliações aleatórias |

### **AUTENTICAÇÃO** (barber + admin)

| Método | Rota | Quem | Retorna |
|--------|------|------|---------|
| POST | `/auth/login` | - | JWT token + barber data |
| GET | `/auth/me` | Both | Perfil atual |
| PUT | `/auth/change-password` | Both | Confirmação |

### **BARBER** (acesso restrito ao próprio)

| Método | Rota | Lógica |
|--------|------|--------|
| GET | `/barber/reservations` | Retorna só reservas com barberId === currentUser._id |
| GET | `/barber/absences` | Seleciona absences do próprio Barber |
| POST | `/barber/absences` | Adiciona absence (currentUser._id extraído do JWT) |
| DELETE | `/barber/absences/:id` | Remove absence do próprio |

### **ADMIN** (acesso total)

| Método | Rota | Função |
|--------|------|--------|
| GET | `/admin/barbers` | Lista todos barbers |
| GET | `/admin/reservations` | Todas reservas (opcional filtro ?barberId) |
| PATCH | `/admin/barbers/:id` | Update barber info |
| POST | `/admin/barbers/:id/absences` | Add absence para qualquer barber |
| DELETE | `/admin/barbers/:id/absences/:absenceId` | Remove absence |
| GET | `/admin/services` | Lista services |
| POST | `/admin/services` | Criar service |
| PUT | `/admin/services/:id` | Update service |
| DELETE | `/admin/services/:id` | Delete service |
| POST | `/admin/services/:id/reorder` | Reorder (dir: "up"/"down") |
| GET | `/admin/weekly-stats` | Breakdown semanal com real data |
| GET | `/admin/site-settings` | Conteúdo dinâmico (editar) |
| PUT | `/admin/site-settings` | Update hero/about/staff/contact |
| GET | `/admin/reviews` | Todas reviews |
| POST/PUT/DELETE | `/admin/reviews` | CRUD reviews |

### **CRONJOBS** (público, para scheduler externo)

| Rota | Ação |
|------|------|
| `/cron/aggregate` | Calcula monthly stats |
| `/cron/clean-duplicates` | Remove reservas duplicadas |
| `/cron/clear-old` | Apaga reservas > 1 ano |

---

## 🎯 REGRAS DE NEGÓCIO CRÍTICAS

### **Validação Reservas** (ordem obrigatória)
1. Campos obrigatórios presentes? (service, barber, date, time, name, phone, email)
2. Telefone PT válido? (regex: `^9\d{8}$`)
3. Email real? (rejeita @test.com, @fake.com, etc)
4. ObjectIds válidos? (barber + service)
5. Barber existe e isActive? 
6. Service existe e isActive?
7. Barber trabalha este dia? (checkWorkingHours)
8. Slot cabe antes do fecho? (newEnd <= closeTime)
9. Barber tem absence? (verifica tipo: full/morning/afternoon/specific + overlap)
10. **OVERLAP com reservas existentes?** (A.start < B.end && B.start < A.end, usando `service.duration`)

### **Cálculo de Tempo**
- Time slot sempre 60min intervals: `00:00, 01:00, 02:00...`
- **Duração real = service.duration (MINUTOS) × 60000 (milliseconds)**
- Exemplo: Corte 45min @ 09:00 → [09:00-09:45], não pode haver booking [09:30-...]
- End time = `new Date(start + service.duration * 60000)`

### **Ausências** (tipos excludentes)
- **full**: Dia todo (09:00-19:00 blocked)
- **morning**: Antes do meio-dia (< 12:00)
- **afternoon**: Depois do meio-dia (>= 12:00)
- **specific**: Horário manual (startTime-endTime, com overlap check)
- Rejeita duplicadas na mesma data

### **Revenue Split**
- **revenuePast**: Reservas com date <= NOW (confirmadas/canceladas)
- **revenueFuture**: Reservas com date > NOW
- Totais recalculados via cron `/cron/aggregate` diariamente

### **Acesso & Autorização**
- **Admin Barber1**: Vê tudo, gerencia todos
- **Barber2**: Vê APENAS próprias reservas/absences (forçado no controller)
- Endpoint `/barber/*` rejeita se `currentUser._id !== targetId`
- Nunca inventar valores (duration, workingHours) → sempre da DB

### **Cancelamentos**
- Cliente clica link email → POST `/reservations/cancel/:token`
- Backend procura reservation por `cancelToken` match
- Admin também pode cancelar via PATCH status

---

## 📂 FICHEIROS PRINCIPAIS

### **Frontend** (`admin/index.html`)
```
admin/
├── index.html (4900 linhas - painel completo)
│   ├── Menu: Dashboard | Reservas | Serviços | Ausências | Config | Password
│   ├── Views: loadDashboard() | loadReservations() | loadServices() | loadAbsences()
│   ├── API calls: fetchJson() wrapper com Bearer token
│   └── JWT token + currentUser armazenados em localStorage
```

**Modo Dual:**
- **Admin** (role=admin): Vê dashboard semanal + todas reservas + edita serviços/ausências/config
- **Barber** (role=barber): Vê apenas "Minhas Reservas" + "Minhas Ausências"

### **Backend** (`backend/src/`)

```
backend/src/
├── controllers/
│   ├── authController.js - login, getCurrentBarber, changePassword
│   ├── reservationController.js (350+ linhas) - createReservation COM 10-step validation
│   │   ├── addAbsence() - Dual mode (barber self / admin any)
│   │   ├── removeAbsence() - Auth checked
│   │   └── getReservationsForDashboard() - Access controlled
│   ├── adminController.js - CRUD barbers/services/site settings, stats
│   └── cronController.js - Monthly aggregation, cleanup jobs
├── models/
│   ├── Barber.js - Schema com absences array
│   ├── Service.js - CRÍTICO: duration EM MINUTOS
│   ├── Reservation.js - barberId + serviceId populated
│   ├── Review.js
│   ├── SiteSettings.js
│   └── MonthlyStats.js
├── routes/
│   └── api.js - 40+ rotas organizadas por seção
├── middleware/
│   ├── auth.js - authMiddleware (JWT verify) + adminMiddleware
│   └── uploadMiddleware.js - Image compression
└── server.js - Express app setup + CORS + DB connect
```

### **Configuração**

```
backend/
├── package.json - 20+ npm scripts (npm run debug, test:*, db:*, seed, etc)
├── .env (Render) - MONGO_URI, JWT_SECRET, RESEND_API_KEY, ADMIN_EMAIL
└── server.js - Listen Render-assigned PORT
```

---

## 📊 FLUXOS PRINCIPAIS

### **Booking (Cliente)**
1. Frontend: Preenche form (serviço, barbeiro, data, hora, dados pessoais)
2. POST `/reservations` → Backend valida 10 steps → MongoDB insere
3. Backend: Envia email Resend (cliente + admin)
4. Frontend: Modal de sucesso ou erro
5. Cliente clica link email → POST `/reservations/cancel/:token` (cancelamento)

### **Admin Dashboard**
1. Login: POST `/auth/login` (email + password) → JWT token
2. GET `/admin/weekly-stats` → calcula per-week breakdown (revenuePast/revenueFuture)
3. GET `/admin/services` → lista com ordem
4. POST `/admin/services/:id/reorder` (dir: up/down) → reordering
5. GET `/admin/barbers` → lista com absences
6. POST `/admin/barbers/:id/absences` → adiciona absence para qualquer barber

### **Barber Dashboard**
1. Login: GET `/auth/me` → retorna barber com absences
2. GET `/barber/reservations` → apenas do barbeiro (forçado)
3. POST/DELETE `/barber/absences` → gerencia suas ausências
4. PUT `/auth/change-password` → muda password

---

## 🔐 SEGURANÇA & DATA INTEGRITY

- **JWT**: Armazenado em localStorage, enviado em Bearer header
- **Password**: Bcrypt hash (min 6 chars)
- **Email Validation**: Rejeita domínios fake (@test, @fake, @invalid)
- **Phone Validation**: Apenas Portugal format (9xxxxxxxx)
- **Barber Access Control**: Controller força `query.barberId = currentUser._id`
- **Absence Authorization**: `if (user.role !== "admin" && user._id !== targetId) return 403`
- **Overlap Detection**: Algoritmo correctamente usa duration em milliseconds

---

## 📈 ESTADO ATUAL

### ✅ Implementado
- Dashboard semanal com real data (commit 6c228e4)
- Service reordering (commit d21b8d0)
- Booking system com 10-step validation (commit d067207)
- Barber access control + absences (commit e04480c)
- Barber frontend panel (commit 3723c1c)
- Email notifications (Resend)
- 3D animations + carousel + mobile responsive

### 🔄 Em Rendering
- Backend auto-redeploy do commit 3723c1c
- GitHub Pages frontend auto-serve

### ⏳ Futuro
- Admin upload direto de imagens (S3/Cloudinary)
- SMS notifications via Twilio
- Integração Google Calendar
- Mobile app (React Native)

---

## 🚀 DEPLOYMENT

| Ambiente | URL | Trigger |
|----------|-----|---------|
| **Frontend** | https://247barbearia.pt | GitHub Pages (auto) |
| **Backend** | https://two4-7-barbearia.onrender.com | Render (git push) |
| **Database** | MongoDB Atlas | Cloud |

---

## 🎓 GOLDEN RULES

1. **Nunca hardcode duration** → sempre `service.duration` from DB
2. **Nunca hardcode workingHours** → sempre `barber.workingHours[day]` from DB
3. **Overlap check**: `newStart < existEnd && existStart < newEnd` (com durations)
4. **Barber visibility**: Força `query.barberId = req.user._id` se não admin
5. **Data integrity**: Validação acontece ANTES de escrever BD
6. **API endpoint design**: `/barber/*` (self-service) vs `/admin/barbers/:id/*` (manage any)
7. **Absence types**: full | morning | afternoon | specific (drop-in logic não existe)

---

## 📞 CONTACTOS TÉCNICOS

- **Admin principal**: Cunha (Diogo) - role="admin"
- **Barber**: Ricardo Silva - role="barber"
- **Email fallback**: admin@247barbearia.pt (Resend)
- **Dados de Teste**: Serviços reais (Corte €10-15, durações 25-45min)

