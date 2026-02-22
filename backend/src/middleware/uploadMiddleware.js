const multer = require("multer");
const sharp = require("sharp");

// Configurar armazenamento em memória para poder processar e otimizar
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Apenas imagens são permitidas"), false);
  }
};

// Configurar multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

const optimizeToWebp = async (buffer, maxWidth, maxHeight, quality) => {
  if (!buffer || buffer.length === 0) {
    throw new Error("Ficheiro vazio ou invalido");
  }

  return sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality })
    .toBuffer();
};

// Middleware para otimizar imagens e converter em base64
const optimizeUploadedImages = async (req, res, next) => {
  try {
    if (!req.files) {
      req.files = {};
    }

    // Processar cada arquivo enviado
    const fileFields = [
      "logoImage",
      "heroImage",
      "aboutCoverImage",
      "aboutCharacterImage",
      "galleryLogoImage",
      "loaderImage",
    ];

    for (const field of fileFields) {
      if (req.files[field] && req.files[field].length > 0) {
        const file = req.files[field][0];

        // Otimizar imagem
        let optimizedImage;
        try {
          const isLoader = field === "loaderImage";
          optimizedImage = await optimizeToWebp(
            file.buffer,
            isLoader ? 800 : 1600,
            isLoader ? 800 : 1200,
            isLoader ? 80 : 82,
          );
        } catch (err) {
          return res.status(400).json({
            error: `Erro ao otimizar imagem (${field}): ${err.message}`,
          });
        }

        // Converter para base64 para armazenar na BD
        const base64 = `data:image/webp;base64,${optimizedImage.toString("base64")}`;
        req[`${field}Base64`] = base64;

        // Gerar nome do arquivo
        const fileName = `${field}-${Date.now()}.webp`;
        req[`${field}Name`] = fileName;
      }
    }

    // Processar imagens da galeria (múltiplas)
    if (req.files.galleryImages && req.files.galleryImages.length > 0) {
      const galleryBase64 = [];
      let totalBytes = 0;

      for (const file of req.files.galleryImages) {
        let optimizedImage;
        try {
          optimizedImage = await optimizeToWebp(file.buffer, 1200, 1200, 75);
        } catch (err) {
          return res.status(400).json({
            error: `Erro ao otimizar imagem (galeria): ${err.message}`,
          });
        }

        totalBytes += optimizedImage.length;
        if (totalBytes > 12 * 1024 * 1024) {
          return res.status(400).json({
            error:
              "Imagens demasiado grandes. Reduza o tamanho ou a quantidade.",
          });
        }

        galleryBase64.push(
          `data:image/webp;base64,${optimizedImage.toString("base64")}`,
        );
      }

      req.galleryImagesBase64 = galleryBase64;
    }

    next();
  } catch (error) {
    res
      .status(400)
      .json({ error: `Erro ao otimizar imagem: ${error.message}` });
  }
};

module.exports = {
  upload: upload.fields([
    { name: "logoImage", maxCount: 1 },
    { name: "heroImage", maxCount: 1 },
    { name: "aboutCoverImage", maxCount: 1 },
    { name: "aboutCharacterImage", maxCount: 1 },
    { name: "galleryLogoImage", maxCount: 1 },
    { name: "galleryImages", maxCount: 10 },
    { name: "loaderImage", maxCount: 1 },
  ]),
  optimizeUploadedImages,
};
