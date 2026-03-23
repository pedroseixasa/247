const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const Barber = require("../models/Barber");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email e password obrigatórios" });
    }

    const barber = await Barber.findOne({ email });
    if (!barber) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const isPasswordValid = await barber.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Credenciais inválidas" });
    }

    const token = jwt.sign(
      { id: barber._id, role: barber.role, name: barber.name },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    res.json({
      token,
      barber: {
        id: barber._id,
        name: barber.name,
        email: barber.email,
        role: barber.role,
        avatar: barber.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCurrentBarber = async (req, res) => {
  try {
    let barberId;
    try {
      if (typeof req.barberId === "string") {
        if (!mongoose.Types.ObjectId.isValid(req.barberId)) {
          throw new Error("Barbeiro ID inválido");
        }
        barberId = new mongoose.Types.ObjectId(req.barberId);
      } else {
        barberId = req.barberId;
      }
    } catch (err) {
      return res.status(400).json({ error: "ID inválido: " + err.message });
    }
    const barber = await Barber.findById(barberId).select("-password");
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }
    res.json(barber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Password atual e nova password são obrigatórias",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "A nova password deve ter pelo menos 6 caracteres",
      });
    }

    // Buscar o barbeiro
    const barber = await Barber.findById(req.barberId);
    if (!barber) {
      return res.status(404).json({ error: "Utilizador não encontrado" });
    }

    // Verificar password atual
    const isPasswordValid = await barber.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Password atual incorreta" });
    }

    // Atualizar password - hash manualmente para evitar validação de outros campos
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    await Barber.findByIdAndUpdate(
      req.barberId,
      { password: hashedPassword },
      { runValidators: false }, // Não validar outros campos, só atualizar password
    );

    res.json({
      success: true,
      message: "Password alterada com sucesso",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const barber = await Barber.findById(req.barberId).select("-password");
    if (!barber) {
      return res.status(404).json({ error: "Utilizador não encontrado" });
    }
    res.json(barber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { notificationEmail, lunchBreak } = req.body;

    if (!req.barberId) {
      return res.status(401).json({ error: "Utilizador não autenticado" });
    }

    const barber = await Barber.findById(req.barberId);
    if (!barber) {
      return res.status(404).json({ error: "Utilizador não encontrado" });
    }

    // Atualizar email de notificação
    if (notificationEmail !== undefined) {
      if (
        notificationEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(notificationEmail)
      ) {
        return res.status(400).json({ error: "Email inválido" });
      }
      barber.notificationEmail = notificationEmail || null;
    }

    // Atualizar intervalo de almoço
    if (lunchBreak !== undefined) {
      if (lunchBreak && lunchBreak.enabled) {
        if (!lunchBreak.startTime || !lunchBreak.endTime) {
          return res
            .status(400)
            .json({ error: "Horas de almoço obrigatórias" });
        }
        // Validar formato HH:mm
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        if (
          !timeRegex.test(lunchBreak.startTime) ||
          !timeRegex.test(lunchBreak.endTime)
        ) {
          return res
            .status(400)
            .json({ error: "Formato de hora inválido (HH:mm)" });
        }
        // Comparar horários
        if (lunchBreak.startTime >= lunchBreak.endTime) {
          return res
            .status(400)
            .json({ error: "Hora de início deve ser antes da hora de fim" });
        }
      }
      barber.lunchBreak = lunchBreak;
    }

    await barber.save();

    res.json({
      success: true,
      message: "Perfil atualizado com sucesso",
      barber: await Barber.findById(req.barberId).select("-password"),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
