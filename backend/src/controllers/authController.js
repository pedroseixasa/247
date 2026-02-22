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
