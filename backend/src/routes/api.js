const express = require("express");
const authController = require("../controllers/authController");
const reservationController = require("../controllers/reservationController");
const adminController = require("../controllers/adminController");
const { authMiddleware, adminMiddleware } = require("../middleware/auth");
const {
  upload,
  optimizeUploadedImages,
} = require("../middleware/uploadMiddleware");

const router = express.Router();

// ===== AUTENTICAÇÃO =====
router.post("/auth/login", authController.login);
router.get("/auth/me", authMiddleware, authController.getCurrentBarber);

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

// ===== ADMIN - SERVIÇOS =====
router.get("/admin/services", adminController.getAllServices);
router.post(
  "/admin/services",
  authMiddleware,
  adminMiddleware,
  adminController.createService,
);
router.put(
  "/admin/services/:serviceId",
  authMiddleware,
  adminMiddleware,
  adminController.updateService,
);
router.delete(
  "/admin/services/:serviceId",
  authMiddleware,
  adminMiddleware,
  adminController.deleteService,
);

// ===== ADMIN - SITE =====
router.get(
  "/admin/settings",
  authMiddleware,
  adminMiddleware,
  adminController.getSiteSettings,
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

module.exports = router;
