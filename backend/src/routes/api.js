const express = require("express");
const authController = require("../controllers/authController");
const reservationController = require("../controllers/reservationController");
const adminController = require("../controllers/adminController");
const cronController = require("../controllers/cronController");
const {
  authMiddleware,
  adminMiddleware,
  optionalAuthMiddleware,
} = require("../middleware/auth");
const Barber = require("../models/Barber");
const {
  upload,
  optimizeUploadedImages,
} = require("../middleware/uploadMiddleware");
const PushSubscription = require("../models/PushSubscription");

const router = express.Router();

// ===== AUTENTICAÇÃO =====
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.getCurrentBarber);
router.put(
  "/auth/change-password",
  authMiddleware,
  authController.changePassword,
);
router.get("/auth/profile", authMiddleware, authController.getProfile);
router.put(
  "/auth/update-profile",
  authMiddleware,
  authController.updateProfile,
);

// ===== RESERVAS =====
router.post(
  "/reservations",
  optionalAuthMiddleware,
  reservationController.createReservation,
);
router.post(
  "/reservations/manual",
  authMiddleware,
  reservationController.createManualReservation,
);
router.get(
  "/reservations/barber/:barberId",
  reservationController.getReservationsByBarber,
);
router.patch(
  "/reservations/:reservationId/status",
  authMiddleware,
  reservationController.updateReservationStatus,
);
router.delete(
  "/reservations/:reservationId",
  authMiddleware,
  reservationController.deleteReservation,
);

// Cancelamento público (sem autenticação - via email)
router.post(
  "/reservations/cancel/:token",
  reservationController.cancelReservationByToken,
);

// ===== BARBERS - DADOS PÚBLICOS =====
// Carregar dados públicos de um barbeiro (nome, lunchBreak, etc)
router.get("/barbers/:barberId", async (req, res) => {
  try {
    const { barberId } = req.params;
    const barber = await Barber.findById(barberId).select(
      "name role lunchBreak avatar workingHours absences",
    );
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }
    res.json(barber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== BARBER (não-admin) - ACESSO RESTRITO =====
// Barber vê suas próprias ausências
router.get("/barber/absences", authMiddleware, async (req, res) => {
  try {
    const barber = await Barber.findById(req.user._id).select("absences name");
    if (!barber) {
      return res.status(404).json({ error: "Perfil não encontrado" });
    }

    // Limpa ausências expiradas
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const beforeCount = barber.absences?.length || 0;

    if (barber.absences && barber.absences.length > 0) {
      barber.absences = barber.absences.filter((absence) => {
        const absenceDate = new Date(absence.date);
        absenceDate.setHours(0, 0, 0, 0);
        return absenceDate >= today;
      });

      if (barber.absences.length < beforeCount) {
        await barber.save();
      }
    }

    res.json({
      barberId: req.user._id,
      barberName: barber.name,
      absences: barber.absences || [],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Barber adiciona sua própria ausência
router.post(
  "/barber/absences",
  authMiddleware,
  reservationController.addAbsence,
);

// Barber remove sua própria ausência (PATCH na rota, mas lógica é DELETE no controller)
router.delete(
  "/barber/absences/:absenceId",
  authMiddleware,
  async (req, res) => {
    try {
      const { absenceId } = req.params;
      const barberId = req.user._id;

      const barber = await Barber.findById(barberId);
      if (!barber) {
        return res.status(404).json({ error: "Barbeiro não encontrado" });
      }

      // Limpa ausências expiradas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (barber.absences && barber.absences.length > 0) {
        barber.absences = barber.absences.filter((absence) => {
          const absenceDate = new Date(absence.date);
          absenceDate.setHours(0, 0, 0, 0);
          return absenceDate >= today;
        });
      }

      const absenceIndex = barber.absences?.findIndex(
        (abs) => abs._id?.toString() === absenceId,
      );

      if (absenceIndex === undefined || absenceIndex === -1) {
        return res.status(404).json({ error: "Ausência não encontrada" });
      }

      barber.absences.splice(absenceIndex, 1);
      await barber.save();

      res.json({ message: "Ausência removida com sucesso" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
);

// Barber vê suas próprias reservas (dashboard)
router.get(
  "/barber/reservations",
  authMiddleware,
  reservationController.getReservationsForDashboard,
);

// ===== ADMIN - BARBEIROS =====
router.get(
  "/admin/barbers",
  authMiddleware,
  adminMiddleware,
  adminController.getAllBarbers,
);
router.get(
  "/admin/barbers/:barberId",
  authMiddleware,
  adminMiddleware,
  adminController.getBarberById,
);
router.get(
  "/admin/reservations",
  authMiddleware,
  adminController.getAllReservations,
);
router.patch(
  "/admin/barbers/:barberId",
  authMiddleware,
  adminMiddleware,
  adminController.updateBarber,
);
router.put(
  "/admin/barbers/:barberId",
  authMiddleware,
  adminMiddleware,
  adminController.updateBarber,
);
router.post(
  "/admin/barbers/:barberId/absences",
  authMiddleware,
  adminMiddleware,
  adminController.addBarberAbsence,
);
router.delete(
  "/admin/barbers/:barberId/absences/:absenceId",
  authMiddleware,
  adminMiddleware,
  adminController.removeBarberAbsence,
);

// ===== ADMIN - SERVIÇOS =====
router.get("/admin/services", adminController.getAllServices);
router.post(
  "/admin/services",
  authMiddleware,
  adminMiddleware,
  upload,
  optimizeUploadedImages,
  adminController.createService,
);
router.put(
  "/admin/services/:serviceId",
  authMiddleware,
  adminMiddleware,
  upload,
  optimizeUploadedImages,
  adminController.updateService,
);
router.delete(
  "/admin/services/:serviceId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteService,
);
router.post(
  "/admin/services/:serviceId/reorder",
  authMiddleware,
  adminMiddleware,
  adminController.reorderService,
);

// ===== ADMIN - SITE =====
router.get(
  "/admin/settings",
  authMiddleware,
  adminMiddleware,
  adminController.getSiteSettings,
);
router.get(
  "/admin/weekly-stats",
  authMiddleware,
  adminMiddleware,
  adminController.getWeeklyStats,
);
router.get(
  "/admin/site-settings",
  authMiddleware,
  adminMiddleware,
  adminController.getSiteContent,
);
router.put(
  "/admin/site-settings",
  authMiddleware,
  adminMiddleware,
  upload,
  optimizeUploadedImages,
  adminController.updateSiteContent,
);
router.post(
  "/admin/content",
  authMiddleware,
  adminMiddleware,
  adminController.updateSiteContent,
);

// ===== ADMIN - REVIEWS =====
router.get("/admin/reviews", adminController.getAllReviews);
router.post(
  "/admin/reviews",
  authMiddleware,
  adminMiddleware,
  adminController.createReview,
);
router.put(
  "/admin/reviews/:reviewId",
  authMiddleware,
  adminMiddleware,
  adminController.updateReview,
);
router.delete(
  "/admin/reviews/:reviewId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteReview,
);

// ===== SITE SETTINGS (PUBLIC) =====
router.get("/site-settings", adminController.getPublicSiteSettings);

// ===== REVIEWS (PUBLIC) - 3 aleatórias =====
router.get("/reviews/random", adminController.getRandomReviews);

// ===== CRONJOBS (PUBLIC) - Minimal responses for cron-job.org 64KB limit =====
router.get("/cron/aggregate", cronController.aggregateMonthlyStats);
router.get("/cron/clean-duplicates", cronController.cleanDuplicates);
router.get("/cron/clear-old", cronController.clearOldReservations);

// ===== PUSH NOTIFICATIONS (AUTENTICADO) =====
// Endpoint para registar push subscription do cliente
router.post("/subscriptions", authMiddleware, async (req, res) => {
  try {
    const { subscription } = req.body;
    const userId = req.user._id;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Subscription data inválida" });
    }

    // Verificar se já existe subscription com o mesmo endpoint
    const existingSubscription = await PushSubscription.findOne({
      userId,
      "subscription.endpoint": subscription.endpoint,
    });

    if (existingSubscription) {
      // Atualizar lastUsed
      existingSubscription.lastUsed = new Date();
      existingSubscription.isActive = true;
      await existingSubscription.save();
      return res.json({
        success: true,
        message: "Subscription atualizada",
        subscriptionId: existingSubscription._id,
      });
    }

    // Criar nova subscription
    const newSubscription = new PushSubscription({
      userId,
      subscription,
      userAgent: req.get("user-agent"),
      deviceType: req.body.deviceType || "desktop",
    });

    await newSubscription.save();

    console.log(`✅ Push subscription guardada para userId: ${userId}`);
    console.log(`   Endpoint: ${subscription.endpoint?.substring(0, 50)}...`);

    res.status(201).json({
      success: true,
      message: "Subscription registada com sucesso",
      subscriptionId: newSubscription._id,
    });
  } catch (error) {
    console.error("Erro ao guardar subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint público para registar subscriptions (PWA app pública)
router.post("/subscriptions-public", async (req, res) => {
  try {
    const { subscription, deviceId, deviceType } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Subscription data inválida" });
    }

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID obrigatório" });
    }

    // Verificar se já existe subscription com o mesmo endpoint
    const existingSubscription = await PushSubscription.findOne({
      deviceId,
      "subscription.endpoint": subscription.endpoint,
    });

    if (existingSubscription) {
      // Atualizar lastUsed
      existingSubscription.lastUsed = new Date();
      existingSubscription.isActive = true;
      await existingSubscription.save();
      return res.json({
        success: true,
        message: "Subscription atualizada",
        subscriptionId: existingSubscription._id,
      });
    }

    // Criar nova subscription pública (sem userId)
    const newSubscription = new PushSubscription({
      deviceId,
      subscription,
      userAgent: req.get("user-agent"),
      deviceType: deviceType || "mobile",
      isPublic: true,
    });

    await newSubscription.save();

    console.log(
      `✅ Push subscription pública registada para deviceId: ${deviceId}`,
    );
    console.log(`   Endpoint: ${subscription.endpoint?.substring(0, 50)}...`);

    res.status(201).json({
      success: true,
      message: "Subscription registada com sucesso",
      subscriptionId: newSubscription._id,
    });
  } catch (error) {
    console.error("Erro ao guardar subscription pública:", error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para o admin enviar notificações push (apenas admin)
router.post(
  "/admin/send-notification",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { title, body, barberId } = req.body;

      if (!title || !body) {
        return res.status(400).json({ error: "Title e body obrigatórios" });
      }

      // Buscar subscriptions da BD
      let query = { isActive: true };
      if (barberId) {
        query.userId = barberId;
      }

      const subscriptions = await PushSubscription.find(query);

      if (subscriptions.length === 0) {
        return res.json({
          success: true,
          message: "Nenhuma subscription ativa encontrada",
          sent: 0,
        });
      }

      // Integrar web-push library para envio real
      const webpush = require("web-push");

      // Configurar VAPID keys do .env
      webpush.setVapidDetails(
        process.env.VAPID_SUBJECT,
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY,
      );

      let successCount = 0;
      let failureCount = 0;

      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            sub.subscription,
            JSON.stringify({
              title,
              body,
              icon: "/images/logo.png",
              badge: "/images/logo.png",
              tag: "reserva-notification",
              requireInteraction: true,
            }),
          );

          // Atualizar lastUsed após sucesso
          sub.lastUsed = new Date();
          await sub.save();
          successCount++;

          console.log(`✅ Notificação enviada a ${sub.userId}`);
        } catch (error) {
          failureCount++;
          console.error(
            `❌ Erro ao enviar a ${sub.userId}: ${error.statusCode}`,
            error.message,
          );

          // Se subscription expirou (410), remover da BD
          if (error.statusCode === 410) {
            await PushSubscription.deleteOne({ _id: sub._id });
            console.log(`🗑️  Subscription expirada removida: ${sub._id}`);
          }
        }
      }

      console.log(
        `📢 Notificações enviadas: ${successCount} sucesso, ${failureCount} falharam`,
      );

      res.json({
        success: true,
        message: `Notificações enviadas (${successCount}/${subscriptions.length} dispositivos)`,
        sent: successCount,
        failed: failureCount,
      });
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Endpoint para o utilizador cancelar sua push subscription
router.delete(
  "/subscriptions/:subscriptionId",
  authMiddleware,
  async (req, res) => {
    try {
      const { subscriptionId } = req.params;
      const userId = req.user._id;

      // Verificar se a subscription pertence ao utilizador
      const subscription = await PushSubscription.findOne({
        _id: subscriptionId,
        userId,
      });

      if (!subscription) {
        return res.status(404).json({ error: "Subscription não encontrada" });
      }

      // Marcar como inativa em vez de deletar (mantém histórico)
      subscription.isActive = false;
      await subscription.save();

      console.log(`✅ Push subscription desativada: ${subscriptionId}`);

      res.json({ success: true, message: "Subscription cancelada" });
    } catch (error) {
      console.error("Erro ao cancelar subscription:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

module.exports = router;
