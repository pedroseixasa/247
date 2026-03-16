const multer = require("multer");
const sharp = require("sharp");

// Configurar armazenamento em memória para poder processar e otimizar
const storage = multer.memoryStorage();

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "image/heic",
    "image/heif",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Formato não suportado: ${file.mimetype}. Use JPG, PNG, WebP, GIF, AVIF ou HEIC.`,
      ),
      false,
    );
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

    console.log("Ficheiros recebidos:", Object.keys(req.files));

    // Processar cada arquivo enviado
    const fileFields = [
      "logoImage",
      "heroImage",
      "aboutCoverImage",
      "aboutCharacterImage",
      "galleryLogoImage",
      "loaderImage",
      "barber1Image",
      "barber1CoverImage",
      "barber2Image",
      "barber2CoverImage",
      "serviceImage",
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
      console.log(
        `Processando ${req.files.galleryImages.length} imagens da galeria...`,
      );
      const galleryBase64 = [];
      let totalBytes = 0;

      for (let i = 0; i < req.files.galleryImages.length; i++) {
        const file = req.files.galleryImages[i];
        console.log(
          `Otimizando imagem ${i + 1}/${req.files.galleryImages.length}: ${file.originalname} (${file.mimetype})`,
        );

        let optimizedImage;
        try {
          // Reduzir mais para galeria: 800px e qualidade 55% (AVIF costuma ser grande)
          optimizedImage = await optimizeToWebp(file.buffer, 800, 800, 55);
        } catch (err) {
          console.error(`Erro ao otimizar imagem ${file.originalname}:`, err);
          return res.status(400).json({
            error: `Erro ao otimizar imagem "${file.originalname}": ${err.message}`,
          });
        }

        totalBytes += optimizedImage.length;
        const sizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
        console.log(
          `Imagem ${i + 1} otimizada: ${(optimizedImage.length / 1024).toFixed(1)} KB (total: ${sizeMB} MB)`,
        );

        // Reduzir limite para 8MB para deixar margem no documento MongoDB
        if (totalBytes > 8 * 1024 * 1024) {
          return res.status(400).json({
            error: `Imagens muito grandes (${sizeMB} MB). Selecione menos imagens ou de menor resolução.`,
          });
        }

        galleryBase64.push(
          `data:image/webp;base64,${optimizedImage.toString("base64")}`,
        );
      }

      req.galleryImagesBase64 = galleryBase64;
      console.log(
        `✓ ${galleryBase64.length} imagens processadas com sucesso (${(totalBytes / (1024 * 1024)).toFixed(2)} MB total)`,
      );
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
    { name: "barber1Image", maxCount: 1 },
    { name: "barber1CoverImage", maxCount: 1 },
    { name: "barber2Image", maxCount: 1 },
    { name: "barber2CoverImage", maxCount: 1 },
    { name: "serviceImage", maxCount: 1 },
  ]),
  optimizeUploadedImages,
};
