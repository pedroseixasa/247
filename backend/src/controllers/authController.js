const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
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
      console.error("Erro ao validar barberId em getCurrentBarber:", err);
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

    // Atualizar password
    barber.password = newPassword;
    await barber.save();

    res.json({
      success: true,
      message: "Password alterada com sucesso",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
