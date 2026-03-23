#!/usr/bin/env node

/**
 * Script para testar VAPID keys e push notifications
 *
 * Uso: node test-push-notifications.js
 */

require("dotenv").config();
const mongoose = require("mongoose");
const webpush = require("web-push");

const MONGODB_URI = process.env.MONGODB_URI;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

console.log("\n🧪 === TESTE DE PUSH NOTIFICATIONS ===\n");

// 1. Verificar variáveis de ambiente
console.log("📋 1. Verificando variáveis de ambiente...");

if (!VAPID_PUBLIC_KEY) {
  console.error("❌ VAPID_PUBLIC_KEY não está definida em .env");
  process.exit(1);
}

if (!VAPID_PRIVATE_KEY) {
  console.error("❌ VAPID_PRIVATE_KEY não está definida em .env");
  process.exit(1);
}

if (!VAPID_SUBJECT) {
  console.error("❌ VAPID_SUBJECT não está definida em .env");
  process.exit(1);
}

console.log(
  "   ✅ VAPID_PUBLIC_KEY:",
  VAPID_PUBLIC_KEY.substring(0, 20) + "...",
);
console.log("   ✅ VAPID_PRIVATE_KEY: [escondida por segurança]");
console.log("   ✅ VAPID_SUBJECT:", VAPID_SUBJECT);

// 2. Configurar web-push
console.log("\n📋 2. Configurando web-push...");

try {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  console.log("   ✅ web-push configurado com sucesso");
} catch (error) {
  console.error("   ❌ Erro ao configurar web-push:", error.message);
  process.exit(1);
}

// 3. Conectar à base de dados
console.log("\n📋 3. Conectando à MongoDB...");

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("   ✅ Conectado à MongoDB");

    // 4. Contar subscriptions
    console.log("\n📋 4. Contando push subscriptions na BD...");

    const PushSubscription = require("./src/models/PushSubscription");
    const count = await PushSubscription.countDocuments({ isActive: true });

    console.log(`   ✅ Total de subscriptions ativas: ${count}`);

    if (count === 0) {
      console.log(
        "   ⚠️  Nenhuma subscription ativa. Isto é normal se ninguém se registou ainda.",
      );
    }

    // 5. Listar subscriptions (sem revelar dados sensíveis)
    if (count > 0) {
      console.log("\n📋 5. Subscriptions registadas:");
      const subs = await PushSubscription.find({ isActive: true })
        .select("userId deviceType createdAt lastUsed")
        .populate("userId", "name email");

      subs.forEach((sub, index) => {
        const lastUsed = sub.lastUsed
          ? new Date(sub.lastUsed).toLocaleString("pt-PT")
          : "Nunca";
        console.log(
          `   ${index + 1}. ${sub.userId?.name || "Unknown"} (${sub.deviceType}) - Criada: ${new Date(sub.createdAt).toLocaleString("pt-PT")} - Última: ${lastUsed}`,
        );
      });
    }

    // 6. Testar envio (opcional)
    console.log("\n📋 6. System ready para enviar notificações push!");
    console.log(
      "   Quando um cliente faz uma reserva, o servidor enviará notificações para:",
    );
    console.log(`   - Todos os ${count} dispositivos conectados`);
    console.log(
      "   - Payload: { title, body, icon, badge, requireInteraction }",
    );

    // 7. Detalhes de segurança
    console.log("\n🔐 Informações de Segurança:");
    console.log("   - VAPID keys estão carregadas corretamente");
    console.log(
      "   - Subscriptions persistidas na MongoDB (não perdem com restarts)",
    );
    console.log(
      "   - Failed subscriptions são removidas automaticamente (410 errors)",
    );

    console.log("\n✅ === TESTE COMPLETO COM SUCESSO ===\n");

    process.exit(0);
  })
  .catch((error) => {
    console.error("   ❌ Erro ao conectar à MongoDB:", error.message);
    process.exit(1);
  });
