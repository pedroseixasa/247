const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.barberId = decoded.id;
    req.barberRole = decoded.role;
    // Backward-compatible shape used by several controllers
    req.user = {
      _id: decoded.id,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido ou expirado" });
  }
};

const optionalAuthMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.barberId = decoded.id;
    req.barberRole = decoded.role;
    req.user = {
      _id: decoded.id,
      role: decoded.role,
      name: decoded.name,
    };
  } catch (error) {
    req.authError = error;
  }

  next();
};

const adminMiddleware = (req, res, next) => {
  if (req.barberRole !== "admin") {
    return res.status(403).json({ error: "Acesso apenas para administrador" });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, optionalAuthMiddleware };
