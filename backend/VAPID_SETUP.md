# 🔐 Guia: Configurar VAPID Keys para Web Push Notifications

## O que são VAPID Keys?

VAPID = **Voluntary Application Server Identification**  
São um par de chaves (pública + privada) que identificam o servidor de aplicação com o serviço de push. Sem elas, os browsers não conseguem enviar notificações push.

---

## ✅ Passo 1: Instalar a biblioteca web-push (em local)

No terminal, na pasta `backend`:

```bash
npm install web-push
```

Isto instala a ferramenta que vamos usar para gerar as keys.

---

## ✅ Passo 2: Gerar as VAPID Keys

No terminal, na pasta `backend`, executa isto:

```bash
npx web-push generate-vapid-keys
```

Vai receber output assim:

```
Public Key:
BDxyz_abc123...xyz789==

Private Key:
q-xyz000123abc...uvw999==
```

⚠️ **IMPORTANTE**: Copia ambas as chaves num local seguro (notepad, password manager, etc)

---

## ✅ Passo 3: Adicionar as keys ao ficheiro .env (local)

No ficheiro `backend/.env`, adiciona:

```env
VAPID_PUBLIC_KEY=BDxyz_abc123...xyz789==
VAPID_PRIVATE_KEY=q-xyz000123abc...uvw999==
VAPID_SUBJECT=mailto:admin@247barbearia.pt
```

**VAPID_SUBJECT** pode ser qualquer email ou URL que identifique a tua aplicação.

---

## ✅ Passo 4: Configurar no Render (Production)

### 4a) Aceder ao painel do Render

1. Vai para https://render.com
2. Faz login
3. Clica no serviço "two4-7-barbearia"

### 4b) Adicionar Environment Variables

1. No painel, vai para **Environment** (ou **Settings** → **Environment Variables**)
2. Clica em **Add Environment Variable**
3. Adiciona as três variáveis:

| Chave | Valor |
|-------|-------|
| `VAPID_PUBLIC_KEY` | `BDxyz_abc123...xyz789==` (sem aspas) |
| `VAPID_PRIVATE_KEY` | `q-xyz000123abc...uvw999==` (sem aspas) |
| `VAPID_SUBJECT` | `mailto:admin@247barbearia.pt` (sem aspas) |

4. Clica **Save**

⚠️ **Render faz auto-deploy** após guardar variáveis → o servidor restarta automaticamente

---

## ✅ Passo 5: Ativar o código de envio (Backend)

No ficheiro `backend/src/routes/api.js`, no endpoint `/admin/send-notification`, descomenta o código a seguir:

**Antes (comentado):**
```javascript
// TODO: Integrar web-push library aqui
// const webpush = require('web-push');
// for (const sub of subscriptions) { ... }
```

**Depois (descomenta e completa):**

```javascript
const webpush = require('web-push');

// Configurar VAPID keys do .env
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

for (const sub of subscriptions) {
  try {
    await webpush.sendNotification(sub.subscription, JSON.stringify({
      title,
      body,
      icon: '/images/logo.png',
      badge: '/images/logo.png',
      tag: 'reserva-notification',
      requireInteraction: true
    }));
    
    // Atualizar lastUsed
    sub.lastUsed = new Date();
    await sub.save();
  } catch (error) {
    console.error(`Erro ao enviar a ${sub.userId}:`, error.statusCode);
    
    // Se subscription expirou (410), remover
    if (error.statusCode === 410) {
      await PushSubscription.deleteOne({ _id: sub._id });
      console.log(`Subscription expirada removida: ${sub._id}`);
    }
  }
}
```

---

## ✅ Passo 6: Ativar no Frontend (Admin Panel)

No ficheiro `admin/index.html`, na função `subscribeUserToPush()`, descomenta isto:

**Antes (comentado):**
```javascript
// TODO: Descomentar quando VAPID keys forem configuradas
// subscription = await registration.pushManager.subscribe({ ... });
```

**Depois (descomenta):**

```javascript
if (!subscription) {
    console.log('🔔 Criando nova push subscription...');
    subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
}
```

E adiciona a constante no topo do script (antes da função `registerServiceWorker()`):

```javascript
// VAPID Public Key para Web Push (substitui com a tua)
const VAPID_PUBLIC_KEY = "BDxyz_abc123...xyz789==";  // Cole a PUBLIC key aqui
```

---

## 🧪 Testar se Está a Funcionar

### Local:

1. Para o servidor se tiver a correr: `Ctrl+C`
2. Cria um ficheiro `test-vapid.js` na pasta `backend`:

```javascript
const webpush = require('web-push');
require('dotenv').config();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

console.log('✅ VAPID keys carregadas com sucesso!');
console.log('Public Key:', process.env.VAPID_PUBLIC_KEY?.substring(0, 20) + '...');
console.log('Private Key: [escondida por segurança]');
console.log('Subject:', process.env.VAPID_SUBJECT);
```

3. Executa:
```bash
node test-vapid.js
```

Deve mostrar as chaves carregadas.

### Production (Render):

1. Vai ao **Logs** do serviço no Render
2. Faz um request POST para `/admin/send-notification`
3. Procura por mensagens de sucesso nos logs

---

## ⚠️ Segurança

- **NUNCA** comites `.env` para Git
- **NUNCA** partilhes a PRIVATE KEY
- A PUBLIC KEY pode ser partilhada (é pública)
- Se vazares a PRIVATE KEY, gera um novo par imediatamente

---

## 📝 Checklist Final

- [ ] Instalar `npm install web-push`
- [ ] Gerar VAPID keys com `npx web-push generate-vapid-keys`
- [ ] Adicionar ao `.env` local
- [ ] Adicionar a Environment Variables no Render
- [ ] Descomenta código backend em `/admin/send-notification`
- [ ] Descomenta código frontend em `subscribeUserToPush()`
- [ ] Testa com `test-vapid.js`
- [ ] Commit e push para Git
- [ ] Verifica logs no Render após deploy

---

## ❓ O que acontece agora?

1. **Admin faz uma reserva** → Servidor cria reserva + envia email ao cliente
2. **Servidor dispara push notifications** → Usa web-push + VAPID keys
3. **Admin/Barbeiro recebem notificação** → Mesmo com browser fechado
4. **Se subscription expirar** → É removida automaticamente na próxima tentativa

---

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| `Invalid VAPID subject` | Certifica-te que VAPID_SUBJECT é email ou URL válido |
| `Push subscription failed (401)` | VAPID keys inválidas ou não configuradas |
| `No subscriptions found` | Admin nunca registou push (browser não subscreveu) |
| `Cannot read property of undefined` | Verifica se VAPID_PUBLIC_KEY está no frontend |

