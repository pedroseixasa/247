require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const apiRoutes = require("./src/routes/api");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes("*")) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
  }),
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Conectar ao MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    // MongoDB connected
  })
  .catch((err) => {
    process.exit(1);
  });

// Rotas
app.use("/api", apiRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

// Error handling - order matters! Must be after all other middleware
app.use((err, req, res, next) => {
  console.error("🔴 Erro não capturado:", {
    message: err.message,
    statusCode: err.statusCode || 500,
    stack: err.stack,
  });

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Ficheiro muito grande" });
  }
  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({ error: "Demasiados ficheiros" });
  }
  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({ error: "Campo de ficheiro inesperado" });
  }
  if (err.code === "LIMIT_PART_COUNT") {
    return res.status(400).json({ error: "Demasiadas partes no formulário" });
  }

  // Multer file filter errors or other multer errors
  if (err.name === "MulterError" || err.message?.includes("Formato")) {
    return res
      .status(400)
      .json({ error: err.message || "Erro ao carregar ficheiro" });
  }

  // Validation errors
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Token inválido" });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    error: err.message || "Erro interno do servidor",
  });
});

// Iniciar servidor
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor online na porta ${PORT}`);
});
