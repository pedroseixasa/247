# Push Subscriptions - Base de Dados

## Resumo

As push subscriptions foram migradas de **memória para MongoDB**. Agora as subscriptions dos clientes/admin são persistidas automaticamente quando se registam notificações push.

---

## Modelo PushSubscription

**Ficheiro:** `backend/src/models/PushSubscription.js`

### Campos:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | ObjectId (ref: Barber) | ID do utilizador que se subscreveu |
| `subscription` | Object | Objeto de subscription do browser (com endpoint + keys) |
| `userAgent` | String | Identificação do browser/dispositivo |
| `deviceType` | String | desktop\|mobile\|tablet |
| `isActive` | Boolean | Se a subscription ainda é válida |
| `createdAt` | Date | Quando foi criada |
| `lastUsed` | Date | Última notificação enviada com sucesso |

### Índices:

- `userId`: Para queries rápidas por utilizador
- `createdAt` com TTL: Subscriptions inativas são auto-removidas após 90 dias

---

## Endpoints

### 1️⃣ Registar Nova Subscription

**POST** `/subscriptions` (autenticado)

```javascript
// Request
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/...",
    "keys": { "auth": "...", "p256dh": "..." }
  },
  "deviceType": "mobile"  // optional
}

// Response
{
  "success": true,
  "message": "Subscription registada com sucesso",
  "subscriptionId": "507f1f77bcf86cd799439011"
}
```

**Comportamento:**
- Se já existe com o mesmo endpoint → **atualiza** `lastUsed`
- Se é nova → **cria** registo na BD
- Auto-detecta deviceType se não fornecido

---

### 2️⃣ Enviar Notificações

**POST** `/admin/send-notification` (admin only)

```javascript
// Request
{
  "title": "Nova Reserva!",
  "body": "João Silva - Corte às 14:00",
  "barberId": "507f..."  // optional - se omitido, envia a todos
}

// Response
{
  "success": true,
  "message": "Notificações enfileiradas (3 dispositivos)",
  "sent": 3
}
```

**Comportamento:**
- Busca subscriptions ativas na BD
- Se barberId → filtra apenas esse barbeiro
- Envia notificação para cada subscription (com retry automático)
- Se subscription expirou (410) → remove automaticamente
- Atualiza `lastUsed` após sucesso

---

### 3️⃣ Cancelar Subscription

**DELETE** `/subscriptions/:subscriptionId` (autenticado)

```javascript
// Response
{
  "success": true,
  "message": "Subscription cancelada"
}
```

**Comportamento:**
- Marca subscription como `isActive: false` (não deleta para histórico)
- Só o utilizador que criou pode cancelar a sua própria

---

## Fluxo de Criação de Reserva com Push

```
1. Cliente faz reserva
   ↓
2. Servidor cria Booking na BD
   ↓
3. Servidor envia email ao cliente (Resend)
   ↓
4. Servidor envia email ao barbeiro (se notificationEmail configurado)
   ↓
5. Servidor dispara sendPushNotifications():
   - Busca PushSubscription ativa do barbeiro
   - Envia notificação para cada dispositivo
   - Atualiza lastUsed
   ↓
6. Browser recebe notificação (mesmo com app fechado)
```

---

## Segurança

- ✅ Subscriptions nunca são expostas ao frontend (apenas IDs)
- ✅ Cada user pode só ver/cancelar suas próprias subscriptions
- ✅ PRIVATE KEY nunca é transmitted (só VAPID_SUBJECT + PUBLIC KEY)
- ✅ Subscriptions expiradas são auto-removidas

---

## Limpeza Automática

MongoDB TTL Index garante que subscriptions inativas > 90 dias são deletadas automaticamente.

Para forçar limpeza manual (raro):

```bash
npm run test:push  # Mostra stats e subscriptions
```

---

## Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| "Nenhuma subscription ativa" | Admin nunca registou push | Abrir admin panel, aceitar permissões push |
| Notificações não chegam | VAPID keys não configuradas | Ver `VAPID_SETUP.md` |
| Subscription removida após restart | Old code (memória) | Agora persiste em BD ✅ |
| Erro 410 ao enviar | Subscription expirou (device desativado) | Auto-removida, próxima será nova |

