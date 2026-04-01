# 🎯 CHECKLIST TAREFAS PRIORITÁRIAS - 24.7 Barbearia (01 Apr 2026)

**Status Geral:** 75-80% Pronto | 🕐 Tempo Total: ~1-2 horas

---

## 🔴 TAREFAS CRÍTICAS (FAZER HOJE)

### ✅ TASK 1: Google Analytics - Substituir Placeholder

**Tempo:** 5 min | **Impacto:** Médio | **Bloqueador:** Não, mas marketing crítico

```
Arquivo: index.html (linha ~75)
Encontrar: G-XXXXXXXXXX
Substituir: [ID REAL de Google Analytics]
Validação: DevTools → Network → analytics.js deve ter dados
```

**Checklist:**

- [ ] Copiar ID real de Google Analytics
- [ ] Substituir em index.html
- [ ] Reload site em produção
- [ ] Verificar tag dispara em Network tab
- [ ] Confirmar em Google Analytics console

---

### ✅ TASK 2: Validar Backend Configuração

**Tempo:** 10 min | **Impacto:** Alto | **Bloqueador:** SIM

```bash
cd backend/
# Verificar .env tem:
MONGODB_URI=mongodb+srv://...
JWT_SECRET=algum-secret-seguro
RESEND_API_KEY=re_xxxxxxxxxxxxx
ADMIN_EMAIL=admin@247barbearia.pt
TWILIO_ACCOUNT_SID=AC... (opcional)
TWILIO_AUTH_TOKEN=... (opcional)
VAPID_PUBLIC_KEY=... (opcional)
VAPID_PRIVATE_KEY=... (opcional)

# Que testar conexão
npm run test:create

# Deve retornar: "Reserva criada com sucesso" ou DB error (diferente de CONNECTION ERROR)
```

**Checklist:**

- [ ] `.env` tem MONGODB_URI válida
- [ ] `.env` tem JWT_SECRET configurado
- [ ] `.env` tem RESEND_API_KEY (obrigatório para email)
- [ ] Correr `npm run test:create` → sucesso
- [ ] Confirmar booking aparece em MongoDB

---

### ✅ TASK 3: E2E Test - Booking Completo (Real)

**Tempo:** 20 min | **Impacto:** Crítico | **Bloqueador:** SIM

**Cenário de Teste:**

```
1. Abrir https://247barbearia.pt (desktop)
   - Página carrega em <3s (loader mínimo 2.5s)
   - Todas as seções visíveis, imagens carregam

2. Scroll até "Serviços"
   - Mínimo 3+ serviços aparecem
   - Cada card tem nome, preço, duração

3. Clicar "Marcar" em qualquer serviço
   - Modal abre (step 1/3)
   - Dois barbeiros aparecem (Diogo Cunha, Ricardo Silva)

4. Selecionar barbeiro (ex: Diogo Cunha)
   - Card fica highlighted
   - Clicar "Próximo"

5. Step 2: Calendar
   - Mês atual renderiza com dias clicáveis
   - Dias encerrados (passado) não clicam ou aparecem cinzentos
   - Selecionar amanhã ou próximo dia disponível

6. Step 2: Time slots
   - Slots 30min aparecem (09:00, 09:30, 10:00, ...)
   - Lunch break barbeiro filtrado (ex: sem 12:00-13:00)
   - Selecionar um slot (ex: 10:00)
   - Clicar "Próximo"

7. Step 3: Dados cliente
   - Campo Nome: preencher "Test João"
   - Campo Telefone: preencher "912345678" (válido PT)
   - Campo Email: preencher "seu-email-real@gmail.com"
   - Clicar "Confirmar Reserva"

8. Resposta API
   - Sucesso: Modal exibe "✅ Reserva Confirmada"
     - Mostra data/hora/barbeiro/preço
     - Link de cancelação aparece
   - Erro: Mensagem clara com problema

9. Email confirmação
   - Verificar inbox (pode estar em Spam)
   - Email deve vir de noreply@247barbearia.pt
   - Contém link de cancelamento
   - Formato HTML legível

10. Testar cancelamento
    - Clicar link email
    - Deve redirecionar para cancel.html
    - Aparecer "Reserva cancelada com sucesso"
    - Voltar a admin → verificar status = "cancelled"
```

**Checklist Sucesso:**

- [ ] Site carrega sem 404s
- [ ] Booking modal abre
- [ ] 2 barbeiros aparecem
- [ ] Calendar renderiza mês corrent
- [ ] Time slots mostram (sem lunch break)
- [ ] Telefone válido aceito
- [ ] Email válido aceito
- [ ] POST `/api/reservations` retorna 201
- [ ] Success modal exibe confirmação
- [ ] Email recebido (inbox)
- [ ] Cancel link funciona

**Teste em Mobile:**

- [ ] Repetir acima em iPhone/Android
- [ ] Modal não quebra
- [ ] Calendar responsivo
- [ ] Teclado não oculta campos

---

### ✅ TASK 4: Atualizar .env.example

**Tempo:** 5 min | **Impacto:** Médio | **Bloqueador:** Não

```bash
# backend/.env.example - Substituir TODO CONTEÚDO por:

# ===== MONGODB =====
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/247barbearia

# ===== JWT =====
JWT_SECRET=sua-chave-secreta-muito-segura-aqui

# ===== RESEND EMAIL (obrigatório) =====
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
ADMIN_EMAIL=admin@247barbearia.pt

# ===== TWILIO SMS (opcional, mas recomendado) =====
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+351xxxxxxxxx (seu número Twilio)

# ===== WEB PUSH (opcional) =====
VAPID_PUBLIC_KEY=xxxxxxxxxxxxxxxxxxxxx
VAPID_PRIVATE_KEY=xxxxxxxxxxxxxxxxxxxxx

# ===== CORS =====
CORS_ORIGIN=https://247barbearia.pt,http://localhost:3000

# ===== SERVER =====
PORT=5000
NODE_ENV=production

# ===== DEPLOYMENT =====
# Para Render.com, estas vars devem estar em Environment Variables (Dashboard)
```

**Checklist:**

- [ ] Adicionar todos campos obrigatórios
- [ ] Incluir campos opcionais (Twilio, VAPID)
- [ ] Adicionar comentários explicativos
- [ ] Sem valores reais (dummy values apenas)
- [ ] Commit ao GitHub

---

### ✅ TASK 5: Criar README.md Root

**Tempo:** 15 min | **Impacto:** Médio | **Bloqueador:** Não

````markdown
# 24.7 Barbearia

Barbearia moderna em Almada com booking online, admin panel, e backend escalável.

## 🚀 Quick Start

### Frontend

```bash
# Não requer build, hosted em GitHub Pages
# Abrir: https://247barbearia.pt
```
````

### Backend

```bash
cd backend/
npm install
cp .env.example .env
# Editar .env com valores reais
npm run dev
# Acesso: http://localhost:5000/api/health
```

## 📚 Stack

- **Frontend:** Vanilla HTML/CSS/JS (SPA, 4800+ linhas)
- **Backend:** Express + Mongoose (Node.js)
- **Database:** MongoDB Atlas
- **Deployment:** GitHub Pages (frontend) + Render (backend)
- **Email:** Resend
- **Auth:** JWT (Bearer tokens)

## 📖 Documentação

- [Análise Completa](ANALISE-COMPLETA-01-04-2026.md) - Status 75-80% pronto
- [Contexto Projeto](CONTEXTO_PROJETO.md) - Modelos DB e endpoints
- [Sistema de Bookings](BOOKINGS_SYSTEM_STRUCTURE.md) - Lógica validações
- [Backend Setup](backend/README.md) - Variáveis ambiente

## 🔧 Scripts Úteis

```bash
cd backend/
npm run debug                 # Debug database
npm run test:create         # Criar reserva teste
npm run test:inspect        # Inspecionar reservas
npm run db:fix              # Corrigir dados
npm run admin:create        # Criar admin user
npm run seed                # Seed database
npm run seed:reviews        # Seed reviews
```

## ✅ Checklist Produção

- [x] Booking system funciona
- [x] Email notifications
- [x] Admin panel
- [ ] Google Analytics (configurar ID)
- [ ] Testes automatizados
- [ ] CI/CD pipeline

## 📞 Contacto

- Website: https://247barbearia.pt
- Email: admin@247barbearia.pt
- Telefone: +351 963 988 807

```

**Checklist:**
- [ ] Criar README.md no root
- [ ] Adicionar Quick Start
- [ ] Listar stack
- [ ] Documentação links
- [ ] Scripts úteis
- [ ] Checklist produção
- [ ] Commit

---

## 📋 VERIFICAÇÃO FINAL

Antes de considerar "PRONTO", validar:

```

FRONTEND:
☐ Página carrega em <3 segundos
☐ Todas seções renderizam
☐ Imagens carregam (heros, services, staff, gallery)
☐ Responsivo em mobile (testar em 375px)
☐ Responsivo em tablet (testar em 768px)
☐ Sem console errors (F12)

BOOKING:
☐ Modal abre ao clicar serviço
☐ Barbeiro selection funciona
☐ Calendar renderiza corrent
☐ Slots excluem lunch break
☐ Validação phone PT válida
☐ Validação email rejeita .test/.fake
☐ POST /api/reservations retorna 201
☐ Email confirmação recebido
☐ Cancel link via email funciona

BACKEND:
☐ Server inicia sem erros
☐ `/health` responde 200
☐ DB connection ativa
☐ JWT token gerado e validado
☐ Admin endpoints requerem auth
☐ Barber endpoints restringem acesso
☐ Email service tem RESEND_API_KEY

ADMIN:
☐ Faz login com barbeiro admin
☐ Dashboard carrega histórico
☐ Pode criar novo serviço
☐ Pode upload imagem
☐ Pode gerenciar ausências
☐ Pode editar site content

SECURITY:
☐ Sem senhas em logs
☐ Sem API keys em frontend
☐ HTTPS/SSL funciona
☐ JWT não expira muito rápido

DEPLOYMENT:
☐ GitHub Pages serve index.html
☐ Render backend responde
☐ MongoDB connection segura
☐ DNS aponta correto

```

---

## 🎯 PRIORIDADE DAS TAREFAS

| # | Tarefa | Tempo | Bloqueador? | Status |
|---|--------|-------|-----------|--------|
| 1 | Google Analytics | 5 min | Não | ⏳ |
| 2 | Backend env vars | 10 min | SIM | ⏳ |
| 3 | E2E Test booking | 20 min | SIM | ⏳ |
| 4 | .env.example | 5 min | Não | ⏳ |
| 5 | README.md | 15 min | Não | ⏳ |

**Total:** ~55 min para PRONTO

---

## 📌 NOTAS IMPORTANTES

1. **Env vars faltando = Booking falha** - Task 2 é crítica
2. **Sem manual QA = Riscos produção** - Task 3 não pular
3. **Google Analytics fácil win** - Task 1 fazer primeiro
4. **Documentação economiza tempo futuro** - Tasks 4-5 importante
5. **Depois disto, pronto para deploy** ✅

---

**Criado:** 01 Apr 2026
**Por:** GitHub Copilot
**Status:** Pronto para execução
```
