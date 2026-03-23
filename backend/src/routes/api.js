const express = require("express");
const authController = require("../controllers/authController");
const reservationController = require("../controllers/reservationController");
const adminController = require("../controllers/adminController");
const cronController = require("../controllers/cronController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
  upload,
  optimizeUploadedImages,
} = require("../middleware/uploadMiddleware");

const router = express.Router();

// ===== AUTENTICAÇÃO =====
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.getCurrentBarber);
router.put(
  "/auth/change-password",
  authMiddleware,
  authController.changePassword,
);

// ===== RESERVAS =====
router.post("/reservations", reservationController.createReservation);
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

// ===== BARBER (não-admin) - ACESSO RESTRITO =====
// Barber vê suas próprias ausências
router.get("/barber/absences", authMiddleware, async (req, res) => {
  try {
    const barber = await Barber.findById(req.user._id).select("absences name");
    if (!barber) {
      return res.status(404).json({ error: "Perfil não encontrado" });
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

module.exports = router;
