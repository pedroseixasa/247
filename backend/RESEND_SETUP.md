# 📧 Configuração Resend - Sistema de Email

## 🎯 Por que Resend?

**EmailJS (antigo):** 200 emails/mês → insuficiente para 9 reservas/dia (270 emails/mês)  
**Resend (novo):** **3000 emails/mês grátis** → suficiente até 45 reservas/dia! 🚀

---

## 📋 Passo a Passo: Configurar Resend

### 1️⃣ Criar Conta Resend

1. Aceder a [resend.com](https://resend.com)
2. Clicar em **"Start Building"** ou **"Sign Up"**
3. Criar conta (pode usar GitHub, Google ou email)

### 2️⃣ Verificar Domínio

Para enviar emails de `noreply@247barbearia.pt`, é necessário verificar o domínio:

1. No painel Resend, ir a **"Domains"** → **"Add Domain"**
2. Inserir: `247barbearia.pt`
3. Resend fornece 3 registos DNS (TXT, MX, CNAME)
4. **Adicionar esses registos no painel do teu fornecedor DNS:**

   **Se usas Cloudflare:**
   - DNS → Add record → Type: TXT → Name: `_resend` → Content: `[valor fornecido]`
   - DNS → Add record → Type: MX → Name: `@` → Priority: 10 → Content: `feedback-smtp.us-east-1.amazonses.com`
   - DNS → Add record → Type: CNAME → Name: `resend._domainkey` → Content: `[valor fornecido]`

   **Se usas outro DNS (GoDaddy, Namecheap, etc.):**
   - Seguir instruções do fornecedor para adicionar registos DNS
   - Usar os valores exatos fornecidos pelo Resend

5. Aguardar verificação (5-30 minutos) ⏳
6. Resend envia email quando domínio estiver verificado ✅

### 3️⃣ Obter API Key

1. No painel Resend, ir a **"API Keys"**
2. Clicar em **"Create API Key"**
3. Nome: `247-Barbearia-Production`
4. Permissões: **"Sending access"** (envio)
5. Copiar a chave (formato: `re_xxxxxxxxxxxxxxxxxxxxxxxx`)

⚠️ **ATENÇÃO:** Esta chave só aparece **uma vez**. Guarda num local seguro!

### 4️⃣ Configurar no Render (Backend)

1. Aceder ao dashboard do Render: [dashboard.render.com](https://dashboard.render.com)
2. Selecionar o serviço **"two4-7-barbearia"**
3. Tab **"Environment"** → **"Add Environment Variable"**
4. Adicionar 2 variáveis:

   ```
   RESEND_API_KEY = re_xxxxxxxxxxxxxxxxxxxxxxxx
   ADMIN_EMAIL = teu-email-admin@gmail.com
   ```

5. Clicar **"Save Changes"**
6. Render faz **redeploy automático** (~2 minutos)

---

## 🧪 Testar Configuração

### Teste Rápido no Render

1. Ir ao serviço no Render → **"Shell"**
2. Correr:
   ```bash
   node -e "console.log(process.env.RESEND_API_KEY ? '✅ RESEND_API_KEY configurada' : '❌ Falta RESEND_API_KEY')"
   ```

### Teste Completo (criar reserva)

1. Abrir site: `https://247barbearia.pt`
2. Clicar em **"Marcar"** num serviço
3. Preencher formulário de reserva
4. Submeter
5. Verificar:
   - ✅ Email de confirmação chegou ao cliente
   - ✅ Email de notificação chegou à administração (ADMIN_EMAIL)

### Troubleshooting

**Se emails não chegarem:**

1. **Verificar logs do Render:**
   - Dashboard Render → serviço → tab **"Logs"**
   - Procurar: `Email enviado com sucesso` ou erros do Resend

2. **Domínio não verificado?**
   - Painel Resend → Domains → verificar status
   - Se "Pending", aguardar propagação DNS (até 48h, normalmente <1h)

3. **API Key errada?**
   - Verificar variável `RESEND_API_KEY` no Render
   - Deve começar com `re_`

4. **Emails vão para spam?**
   - Adicionar registos SPF e DKIM (fornecidos pelo Resend)
   - Aquecer domínio (enviar poucos emails nos primeiros dias)

---

## 📊 Monitorizar Uso

### Painel Resend

1. Dashboard: [resend.com/dashboard](https://resend.com/dashboard)
2. Ver métricas:
   - Emails enviados (hoje/mês)
   - Taxa de entrega
   - Bounces/Complaints

### Limites Free Tier

- **3,000 emails/mês**
- **100 emails/dia**
- Emails ilimitados de teste (modo sandbox)

### Se ultrapassar limites

**Plano Pro:** $20/mês → 50,000 emails/mês

---

## 🎨 Personalizar Templates

Os templates HTML estão em: `backend/src/services/emailService.js`

### Email ao Cliente (função `sendBookingConfirmation`)

**Elementos personalizáveis:**
- Logo/Marca (linha 70: `.logo`)
- Cores (buscar `#c9a961`, `#1a1a1a`)
- Morada (linha 176)
- Telefone (linha 177)

### Email Admin (função `sendAdminNotification`)

**Elementos personalizáveis:**
- Alerta visual (linha 235: `.alert`)
- Estrutura de dados (linhas 240-268)

**Para editar:**
```bash
cd backend/src/services
code emailService.js
```

---

## 🔒 Segurança

### Boas Práticas

1. ✅ **Nunca commitar API keys no Git**
   - Usar sempre variáveis de ambiente
   - Verificar `.gitignore` inclui `.env`

2. ✅ **Rotacionar chaves regularmente**
   - A cada 3-6 meses
   - Imediatamente se suspeita de compromisso

3. ✅ **Limitar permissões**
   - API Key só deve ter "Sending access"
   - Não dar "Full access" desnecessário

4. ✅ **Validar emails**
   - Backend valida formato + domínio real (já implementado)
   - Evita spam/abuso

---

## 📈 Comparação: EmailJS vs Resend

| Feature              | EmailJS (antigo) | Resend (novo)     |
|---------------------|------------------|-------------------|
| Emails/mês grátis   | 200              | **3,000** 🚀      |
| Emails/dia          | ~7               | **100**           |
| Envio               | Frontend         | **Backend** ✅    |
| Segurança           | API Key exposta  | **Protegida** 🔒  |
| Domínio custom      | ❌ Não           | **✅ Sim**        |
| Templates HTML      | Interface web    | **Código** (flex) |
| Analytics           | Básico           | **Detalhado** 📊  |
| Deliverability      | Médio            | **Alto** (AWS SES)|

---

## 🆘 Suporte

**Resend:**
- Docs: [resend.com/docs](https://resend.com/docs)
- Email: support@resend.com
- Discord: [discord.gg/resend](https://discord.gg/resend)

**24.7 Barbearia (este projeto):**
- Ver logs: `backend/src/services/emailService.js`
- Código reservas: `backend/src/controllers/reservationController.js`

---

## ✅ Checklist Final

Antes de ir para produção:

- [ ] Conta Resend criada
- [ ] Domínio verificado (status: ✅ Verified)
- [ ] API Key gerada e guardada
- [ ] `RESEND_API_KEY` configurada no Render
- [ ] `ADMIN_EMAIL` configurada no Render
- [ ] Teste de reserva realizado
- [ ] Email chegou ao cliente
- [ ] Email chegou ao admin
- [ ] Verificar spam folders
- [ ] Monitorizar primeiros 10 emails

---

**Status:** Migração concluída ✅  
**Data:** 12 Mar 2026  
**Emails economizados por mês:** +2800 🎉
