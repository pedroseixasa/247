const mongoose = require("mongoose");
const Barber = require("../models/Barber");
const Service = require("../models/Service");
const Reservation = require("../models/Reservation");
const SiteSettings = require("../models/SiteSettings");
const Review = require("../models/Review");

function parsePriceNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function normalizeServicePrice(value) {
  const numeric = parsePriceNumber(value);
  if (numeric === null) return value;
  return numeric;
}

function formatServicePrice(value) {
  const numeric = parsePriceNumber(value);
  if (numeric === null) return value || "";
  return `${numeric} €`;
}
const MonthlyStats = require("../models/MonthlyStats");

const defaultSiteSettings = {
  header: {
    brandName: "24.7 Barbearia",
    logoImage: "images/logo.jpg",
    hoursText: "📅 Ter–Sáb 09:00–19:00",
    addressText: "📍 R. Cap. Leitão 84B",
    phoneText: "+351 963 988 807",
    phoneHref: "tel:+351963988807",
  },
  hero: {
    title: "24.7 Barbearia",
    subtitle: "O corte certo, o fade no ponto e a barba como deve ser.",
    description:
      "Ambiente relaxado com atendimento profissional. Reservas online fáceis e rápidas — qualidade e atenção ao detalhe em cada visita.",
    ctaPrimaryText: "Marcar Agora",
    ctaPrimaryHref: "#services",
    ctaSecondaryText: "Contacto",
    ctaSecondaryHref: "#contact",
    image: "images/1.jpg",
  },
  about: {
    title: "Sobre a 24.7 Barbearia",
    eyebrow: "Barbearia boutique em Almada",
    text: "Somos uma barbearia moderna em Almada, comprometida com a excelência. Cada corte é feito com precisão, cada fade é trabalhado ao detalhe e cada barba é tratada com cuidado. Ambiente descontraído mas profissional, com marcações online, atendimento rápido e sem stress.",
    coverImage: "images/cunhacorte.png",
    characterImage: "images/cunha.png",
    carouselImages: [
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&h=400&fit=crop",
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&h=400&fit=crop",
      "images/1.jpg",
    ],
    highlights: [
      "Técnicas de fades com acabamento a navalha",
      "Barbas com toalha quente e produtos portugueses premium",
      "Reservas online com confirmação imediata",
    ],
    ratingCard: {
      value: "4.9",
      label: "Avaliação média Google",
      description: "Com base em 180+ reviews verificadas",
    },
    paymentCard: {
      title: "Métodos de pagamento",
      subtitle: "Escolhe como preferires pagar",
      methods: ["MB Way", "Multibanco", "Dinheiro"],
    },
  },
  services: {
    title: "Serviços & Preços",
    subtitle: "Experiência premium com preços justos",
  },
  gallery: {
    title: "Galeria de Trabalhos",
    subtitle: "Confira alguns dos nossos melhores trabalhos",
    logoImage: "images/logo.jpg",
    instagramUrl: "https://www.instagram.com/247_barbearia",
    instagramHandle: "247_barbearia",
    images: [
      "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&h=600&fit=crop",
      "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=500&h=600&fit=crop",
      "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&h=600&fit=crop",
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&h=600&fit=crop",
      "images/1.jpg",
      "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=500&h=600&fit=crop",
      "images/cunhacorte.png",
    ],
  },
  contact: {
    title: "Localização & Contacto",
    addressText: "R. Cap. Leitão 84B, 2800-133 Almada",
    phoneText: "+351 963 988 807",
    phoneHref: "tel:+351963988807",
    mapEmbedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3114.0838!2d-9.161209!3d38.678998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzjCsDQwJzQ0LjQiTiA5wrAwOSc0MC40Ilc!5e0!3m2!1spt-PT!2spt!4v1234567890!5m2!1spt-PT!2spt",
  },
  hoursRows: [
    { label: "SEGUNDA A SABADO", value: "09:00 – 19:00", className: "open" },
    { label: "DOMINGO", value: "Encerrado", className: "closed" },
  ],
  cta: {
    title: "Pronto para o seu próximo corte?",
    text: "Marque agora mesmo online – rápido, fácil e sem complicações.",
    buttonText: "Fazer Reserva",
    buttonHref: "#services",
  },
  footerText:
    "© 2026 24.7 Barbearia. Todos os direitos reservados. | Almada, Portugal",
  loaderText: "24.7 Barbearia",
  loaderImage: "images/logo.jpg",
  barberCards: {
    barber1Name: "Diogo Cunha",
    barber1Role: "Barbeiro Profissional",
  },
};

async function getOrCreateSiteSettings() {
  let settings = await SiteSettings.findOne();
  if (!settings) {
    settings = await SiteSettings.create(defaultSiteSettings);
  }
  return settings;
}

// ===== GERENCIAR BARBEIROS =====
exports.getAllBarbers = async (req, res) => {
  try {
    const barbers = await Barber.find().select("-password");
    res.json(barbers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBarberById = async (req, res) => {
  try {
    const { barberId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(barberId)) {
      return res.status(400).json({ error: "ID inválido" });
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

exports.updateBarber = async (req, res) => {
  try {
    const { barberId } = req.params;
    const {
      name,
      email,
      phone,
      notificationEmail,
      avatar,
      bio,
      workingHours,
      isActive,
    } = req.body;

    let barberIdObj;
    try {
      if (typeof barberId === "string") {
        if (!mongoose.Types.ObjectId.isValid(barberId)) {
          throw new Error("Barbeiro ID inválido");
        }
        barberIdObj = new mongoose.Types.ObjectId(barberId);
      } else {
        barberIdObj = barberId;
      }
    } catch (err) {
      return res.status(400).json({ error: "ID inválido: " + err.message });
    }

    const barber = await Barber.findByIdAndUpdate(
      barberIdObj,
      {
        name,
        email,
        phone,
        notificationEmail,
        avatar,
        bio,
        workingHours,
        isActive,
      },
      { new: true },
    ).select("-password");

    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    res.json(barber);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== GERENCIAR SERVIÇOS =====
exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ order: 1 });
    // Garantir que todos os serviços têm uma duração válida
    const servicesWithDuration = services.map((service) => ({
      ...service.toObject(),
      duration: service.duration || 30, // Padrão de 30 minutos se não definido
    }));
    res.json(servicesWithDuration);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createService = async (req, res) => {
  try {
    // Aceitar tanto JSON normal quanto FormData
    let data = req.body || {};
    if (req.body && req.body.data) {
      try {
        data = JSON.parse(req.body.data || "{}");
      } catch (parseError) {
        console.error("Erro ao fazer parse JSON:", parseError);
        data = req.body;
      }
    }

    const { name, description, price, duration, order } = data;

    if (!name || !price) {
      return res.status(400).json({ error: "Nome e preço são obrigatórios" });
    }

    const normalizedPrice = normalizeServicePrice(price);

    // Processar imagem se foi feito upload
    let imageUrl = data.image || req.body.image || "";
    if (req.serviceImageBase64) {
      imageUrl = req.serviceImageBase64;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const maxOrderService = await Service.findOne().sort({ order: -1 });
    const nextOrder = maxOrderService ? maxOrderService.order + 1 : 0;

    const service = new Service({
      name,
      description,
      price: normalizedPrice,
      duration: duration || 30,
      image: imageUrl,
      order: order !== undefined && order !== null ? order : nextOrder,
    });

    await service.save();
    res.status(201).json(service);
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    // Aceitar tanto JSON normal quanto FormData
    let data = req.body || {};
    if (req.body && req.body.data) {
      try {
        data = JSON.parse(req.body.data || "{}");
      } catch (parseError) {
        console.error("Erro ao fazer parse JSON:", parseError);
        // Se falhar parse, usa o req.body como está
        data = req.body;
      }
    }

    const { name, description, price, duration, isActive, order } = data;

    if (!name || !price) {
      return res.status(400).json({ error: "Nome e preço são obrigatórios" });
    }

    const normalizedPrice = normalizeServicePrice(price);

    // Obter serviço atual para preservar imagem se não for atualizada
    const currentService = await Service.findById(serviceId);
    if (!currentService) {
      return res.status(404).json({ error: "Serviço não encontrado" });
    }

    // Processar imagem se foi feito upload
    let imageUrl = currentService.image; // Manter imagem atual por padrão
    if (req.serviceImageBase64) {
      imageUrl = req.serviceImageBase64;
    } else if (data.image) {
      imageUrl = data.image;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    const service = await Service.findByIdAndUpdate(
      serviceId,
      {
        name,
        description: description || currentService.description,
        price: normalizedPrice,
        duration: duration || currentService.duration,
        image: imageUrl,
        isActive: isActive !== undefined ? isActive : currentService.isActive,
        order: order !== undefined ? order : currentService.order,
      },
      { new: true },
    );

    res.json(service);
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { serviceId } = req.params;

    const service = await Service.findByIdAndDelete(serviceId);
    if (!service) {
      return res.status(404).json({ error: "Serviço não encontrado" });
    }

    res.json({ message: "Serviço deletado" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.reorderService = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const { direction } = req.body; // 'up' ou 'down'

    if (!["up", "down"].includes(direction)) {
      return res
        .status(400)
        .json({ error: "Direção inválida. Use 'up' ou 'down'" });
    }

    // Obter todos os serviços ordenados
    const services = await Service.find().sort({ order: 1 });

    // Encontrar o índice do serviço atual
    const currentIndex = services.findIndex(
      (s) => s._id.toString() === serviceId,
    );

    if (currentIndex === -1) {
      return res.status(404).json({ error: "Serviço não encontrado" });
    }

    // Calcular o índice do serviço a trocar
    const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Verificar limites
    if (swapIndex < 0 || swapIndex >= services.length) {
      return res
        .status(400)
        .json({ error: `Não é possível mover ${direction}` });
    }

    // Trocar as ordens
    const currentService = services[currentIndex];
    const swapService = services[swapIndex];

    const tempOrder = currentService.order;
    currentService.order = swapService.order;
    swapService.order = tempOrder;

    // Atualizar na BD
    await Service.findByIdAndUpdate(currentService._id, {
      order: currentService.order,
    });
    await Service.findByIdAndUpdate(swapService._id, {
      order: swapService.order,
    });

    // Retornar a lista atualizada
    const updatedServices = await Service.find().sort({ order: 1 });
    res.json(updatedServices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.syncServiceToIndexClean = async (req, res) => {
  try {
    const fs = require("fs").promises;
    const path = require("path");
    const { service, action } = req.body;

    const indexCleanPath = path.join(__dirname, "../../..", "index_clean.html");

    let html = await fs.readFile(indexCleanPath, "utf-8");

    if (action === "add") {
      // Generate slug from service name
      const slug = service.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .replace(/[^\w\-]+/g, "");

      const serviceCardHTML = `
                <div class="service-card-new service-card-compact" data-service="${slug}"
                    data-service-id="${service._id}">
                    <div class="service-main-line">
                        <span class="service-name">${service.name}</span>
                <span class="service-price">${formatServicePrice(service.price)}</span>
                    </div>
                    <button class="service-book-btn">Marcar</button>
                </div>`;

      // Find the closing tag of services-grid and add before it
      const servicesGridEndPattern =
        /([\s]*)<\/div>\s*\n\s*<\/div>\s*\n\s*<\/section>\s*\n\s*<section class="gallery/;

      if (servicesGridEndPattern.test(html)) {
        html = html.replace(
          servicesGridEndPattern,
          `${serviceCardHTML}\n            </div>\n\n        </div>\n    </section>\n\n    <section class="gallery`,
        );
      } else {
        // Fallback: procurar apenas pelo fim do services-grid
        html = html.replace(
          /(<div class="service-card-new service-card-compact"[\s\S]*?<\/div>\s*<\/div>)([\s]*<\/div>)/,
          `$1${serviceCardHTML}\n$2`,
        );
      }
    } else if (action === "update") {
      // Update existing service card
      const servicePattern = new RegExp(
        `(<div class="service-card-new service-card-compact"[^>]*data-service-id="${service._id}"[^>]*>\\s*<div class="service-main-line">\\s*<span class="service-name">)[^<]*(</span>\\s*<span class="service-price">)[^<]*(</span>)`,
        "g",
      );

      const priceLabel = formatServicePrice(service.price);
      html = html.replace(servicePattern, `$1${service.name}$2${priceLabel}$3`);
    } else if (action === "delete") {
      // Remove service card completely
      const servicePattern = new RegExp(
        `\\s*<div class="service-card-new service-card-compact"[^>]*data-service-id="${service._id}"[^>]*>[\\s\\S]*?<\\/div>\\s*<\\/div>`,
        "g",
      );

      html = html.replace(servicePattern, "");
    }

    await fs.writeFile(indexCleanPath, html, "utf-8");

    // File synced

    res.json({ message: "Sincronizado com sucesso" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== GERENCIAR RESERVAS =====
exports.getAllReservations = async (req, res) => {
  try {
    // Se for barbeiro (não admin), mostrar apenas suas reservas
    let barberId = null;
    try {
      if (req.barberRole !== "admin") {
        if (typeof req.barberId === "string") {
          if (!mongoose.Types.ObjectId.isValid(req.barberId)) {
            throw new Error("Barbeiro ID inválido");
          }
          barberId = new mongoose.Types.ObjectId(req.barberId);
        } else {
          barberId = req.barberId;
        }
      } else if (req.query.barberId) {
        if (typeof req.query.barberId === "string") {
          if (!mongoose.Types.ObjectId.isValid(req.query.barberId)) {
            throw new Error("Query barberId inválido");
          }
          barberId = new mongoose.Types.ObjectId(req.query.barberId);
        } else {
          barberId = req.query.barberId;
        }
      }
    } catch (err) {
      return res.status(400).json({ error: "ID inválido: " + err.message });
    }

    const filter = barberId ? { barberId } : {};

    const reservations = await Reservation.find(filter)
      .populate({
        path: "barberId",
        select: "_id name email phone avatar",
      })
      .populate({
        path: "serviceId",
        select: "_id name price duration",
      })
      .sort({ reservationDate: 1, timeSlot: 1 })
      .lean();

    res.json(reservations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== GERENCIAR SITE (Fotos, Textos, etc) =====
function getStartOfWeek(date) {
  const start = new Date(date);
  const day = (start.getDay() + 6) % 7; // Monday as start of week
  start.setDate(start.getDate() - day);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getStartOfMonth(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  start.setHours(0, 0, 0, 0);
  const end = new Date(year, month, 0);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function parseSelectedMonth(query) {
  const year = Number(query.year);
  const month = Number(query.month);
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null;
  if (year < 2026 || month < 1 || month > 12) return null;
  return { year, month };
}

async function sumRevenue(filter) {
  const reservations = await Reservation.find(filter).populate({
    path: "serviceId",
    select: "price",
  });

  let total = 0;
  reservations.forEach((reservation) => {
    if (reservation.serviceId && reservation.serviceId.price !== undefined) {
      const numeric = parsePriceNumber(reservation.serviceId.price);
      if (numeric !== null) {
        total += numeric;
      }
    }
  });

  return total;
}

exports.getSiteSettings = async (req, res) => {
  try {
    const now = new Date();

    // Parâmetro de ano: por default é o ano atual
    const selectedYear = req.query.year
      ? Number(req.query.year)
      : now.getFullYear();
    if (selectedYear < 2026 || !Number.isInteger(selectedYear)) {
      return res.status(400).json({ error: "Ano inválido" });
    }

    // Os 3 cards mostram dados do mês ATUAL
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    currentMonthStart.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    currentMonthEnd.setHours(23, 59, 59, 999);

    let barberId = null;
    try {
      if (req.barberRole !== "admin") {
        if (typeof req.barberId === "string") {
          if (!mongoose.Types.ObjectId.isValid(req.barberId)) {
            throw new Error("Barbeiro ID inválido");
          }
          barberId = new mongoose.Types.ObjectId(req.barberId);
        } else {
          barberId = req.barberId;
        }
      } else if (req.query.barberId) {
        if (typeof req.query.barberId === "string") {
          if (!mongoose.Types.ObjectId.isValid(req.query.barberId)) {
            throw new Error("Query barberId inválido");
          }
          barberId = new mongoose.Types.ObjectId(req.query.barberId);
        } else {
          barberId = req.query.barberId;
        }
      }
    } catch (err) {
      return res.status(400).json({ error: "ID inválido: " + err.message });
    }

    const baseFilter = barberId ? { barberId } : {};
    const confirmedFilter = {
      ...baseFilter,
      status: { $in: ["confirmed", "completed"] },
    };

    // ===== CARDS: Dados do mês ATUAL =====
    const pastFilter = {
      ...confirmedFilter,
      reservationDate: { $gte: currentMonthStart, $lte: now },
    };

    const futureFilter = {
      ...confirmedFilter,
      reservationDate: { $gt: now, $lte: currentMonthEnd },
    };

    const totalMonthFilter = {
      ...confirmedFilter,
      reservationDate: { $gte: currentMonthStart, $lte: currentMonthEnd },
    };

    // Contar reservas do mês atual
    const reservasPast = await Reservation.countDocuments(pastFilter);
    const reservasFuture = await Reservation.countDocuments(futureFilter);
    const reservasTotal = await Reservation.countDocuments(totalMonthFilter);

    // Calcular receitas do mês atual
    const receitaPast = await sumRevenue(pastFilter);
    const receitaFuture = await sumRevenue(futureFilter);
    const receitaTotal = receitaPast + receitaFuture;

    // ===== HISTÓRICO: Todos os 12 meses do ANO SELECIONADO =====
    const monthlyBreakdown = [];
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(selectedYear, month, 1);
      monthStart.setHours(0, 0, 0, 0);
      const monthEnd = new Date(selectedYear, month + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);

      // Verificar se existe estatística agregada para este mês
      const monthlyStats = await MonthlyStats.findOne({
        year: selectedYear,
        month: month,
        barberId: barberId || null,
      });

      // Determinar se o mês é passado, atual ou futuro
      const isMonthPast = monthEnd < now; // monthEnd antes de agora
      const isMonthCurrent = monthStart <= now && now <= monthEnd; // Agora dentro do mês
      const isMonthFuture = monthStart > now; // monthStart depois de agora

      if (monthlyStats && isMonthPast) {
        // Usar dados agregados apenas para meses já fechados
        monthlyBreakdown.push({
          label: monthStart.toLocaleDateString("pt-PT", {
            month: "long",
            year: "numeric",
          }),
          count: monthlyStats.totalReservations,
          revenue: monthlyStats.totalRevenue,
          revenuePast: monthlyStats.totalRevenue, // Tudo é passado
          revenueFuture: 0,
          isAggregated: true,
        });
      } else {
        // Calcular dados das reservas normalmente
        const count = await Reservation.countDocuments({
          ...confirmedFilter,
          reservationDate: { $gte: monthStart, $lte: monthEnd },
        });

        let revenuePast = 0;
        let revenueFuture = 0;

        if (isMonthPast) {
          // ✅ Mês passado: TODA a receita é realizada
          revenuePast = await sumRevenue({
            ...confirmedFilter,
            reservationDate: { $gte: monthStart, $lte: monthEnd },
          });
          revenueFuture = 0;
        } else if (isMonthCurrent) {
          // ✅ Mês atual: SEPARAR realizada vs prevista
          revenuePast = await sumRevenue({
            ...confirmedFilter,
            reservationDate: { $gte: monthStart, $lte: now },
          });
          revenueFuture = await sumRevenue({
            ...confirmedFilter,
            reservationDate: { $gt: now, $lte: monthEnd },
          });
        } else if (isMonthFuture) {
          // ✅ Mês futuro: TODA a receita é prevista
          revenuePast = 0;
          revenueFuture = await sumRevenue({
            ...confirmedFilter,
            reservationDate: { $gte: monthStart, $lte: monthEnd },
          });
        }

        const revenue = revenuePast + revenueFuture;

        monthlyBreakdown.push({
          label: monthStart.toLocaleDateString("pt-PT", {
            month: "long",
            year: "numeric",
          }),
          count,
          revenue,
          revenuePast,
          revenueFuture,
          isAggregated: false,
        });
      }
    }

    const barbersCount = await Barber.countDocuments({ isActive: true });
    const servicesCount = await Service.countDocuments({ isActive: true });

    res.json({
      stats: {
        barbersCount,
        servicesCount,

        // Dados do mês ATUAL
        reservasPast, // Confirmadas (passado no mês atual)
        reservasFuture, // Confirmadas (futuro no mês atual)
        reservasTotal, // Total no mês atual

        receitaPast, // Receita realizada (passado no mês atual)
        receitaFuture, // Receita estimada (futuro no mês atual)
        receitaTotal, // Total estimado no mês atual

        monthlyBreakdown, // Todos os 12 meses do ano selecionado

        selectedYear, // Ano selecionado
        currentMonth: now.getMonth() + 1,
        currentYear: now.getFullYear(),

        currentMonthLabel: currentMonthStart.toLocaleDateString("pt-PT", {
          month: "long",
          year: "numeric",
        }),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== OBTER DADOS SEMANAIS PARA UM MÊS ESPECÍFICO =====
exports.getWeeklyStats = async (req, res) => {
  try {
    const { month, year, barberId } = req.query;

    if (!month || !year) {
      return res.status(400).json({ error: "Month and year are required" });
    }

    const selectedMonth = parseInt(month);
    const selectedYear = parseInt(year);
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Estabelecer barberId filter
    let barbIdFilter = {};
    if (barberId && barberId !== "undefined" && barberId !== "") {
      barbIdFilter = { barberId };
    }

    // Gerar semanas para o mês selecionado (segunda-feira é o início)
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);
    const weeks = [];
    let currentWeekStart = new Date(firstDay);

    // Ajustar para segunda-feira se necessário
    const dayOfWeek = currentWeekStart.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    currentWeekStart.setDate(currentWeekStart.getDate() - daysToMonday);

    while (currentWeekStart <= lastDay) {
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const weekLabel = `${currentWeekStart.getDate()} - ${weekEnd.getDate()} de ${currentWeekStart.toLocaleDateString("pt-PT", { month: "long" })}`;
      weeks.push({
        start: new Date(currentWeekStart),
        end: new Date(weekEnd),
        label: weekLabel,
      });

      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    // Para cada semana, contar reservas e somar receitas
    const confirmedFilter = { status: "confirmed" };

    const weeklyData = await Promise.all(
      weeks.map(async (week) => {
        const weekStart = new Date(week.start);
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(week.end);
        weekEnd.setHours(23, 59, 59, 999);

        // Contar reservas
        const count = await Reservation.countDocuments({
          ...confirmedFilter,
          ...barbIdFilter,
          reservationDate: { $gte: weekStart, $lte: weekEnd },
        });

        // Calcular receitas (realizada vs prevista)
        let revenuePast = 0;
        let revenueFuture = 0;

        // Receita realizada (reservas que já passaram)
        const pastReservations = await Reservation.find({
          ...confirmedFilter,
          ...barbIdFilter,
          reservationDate: {
            $gte: weekStart,
            $lte: Math.min(weekEnd, now - 1),
          },
        }).populate("serviceId");

        revenuePast = pastReservations.reduce((sum, res) => {
          const price = res.serviceId?.price || 0;
          const numPrice =
            typeof price === "number" ? price : parseFloat(price) || 0;
          return sum + numPrice;
        }, 0);

        // Receita prevista (reservas futuras dentro da semana)
        const futureReservations = await Reservation.find({
          ...confirmedFilter,
          ...barbIdFilter,
          reservationDate: { $gt: now, $lte: weekEnd },
        }).populate("serviceId");

        revenueFuture = futureReservations.reduce((sum, res) => {
          const price = res.serviceId?.price || 0;
          const numPrice =
            typeof price === "number" ? price : parseFloat(price) || 0;
          return sum + numPrice;
        }, 0);

        return {
          week: week.label,
          weekNum: weeks.indexOf(week) + 1,
          count,
          revenuePast: Math.round(revenuePast * 100) / 100,
          revenueFuture: Math.round(revenueFuture * 100) / 100,
          revenueTotal: Math.round((revenuePast + revenueFuture) * 100) / 100,
        };
      }),
    );

    res.json({
      month: selectedMonth,
      year: selectedYear,
      weeks: weeklyData,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== GERENCIAR CONTEÚDO DO SITE =====
exports.getSiteContent = async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getPublicSiteSettings = async (req, res) => {
  try {
    const settings = await getOrCreateSiteSettings();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateSiteContent = async (req, res) => {
  try {
    // Aceitar tanto JSON normal quanto FormData
    let data = req.body || {};
    if (req.body && req.body.data) {
      data = JSON.parse(req.body.data || "{}");
    }

    data.header = data.header || {};
    data.hero = data.hero || {};
    data.about = data.about || {};
    data.gallery = data.gallery || {};
    data.barberCards = data.barberCards || {};
    const settings = await getOrCreateSiteSettings();

    // Processar imagens otimizadas
    if (req.logoImageBase64) {
      data.header.logoImage = req.logoImageBase64;
    } else if (req.logoImageUrl || req.body.logoImageUrl) {
      data.header.logoImage = req.logoImageUrl || req.body.logoImageUrl;
    }

    if (req.heroImageBase64) {
      data.hero.image = req.heroImageBase64;
    } else if (req.heroImageUrl || req.body.heroImageUrl) {
      data.hero.image = req.heroImageUrl || req.body.heroImageUrl;
    }

    if (req.aboutCoverImageBase64) {
      data.about.coverImage = req.aboutCoverImageBase64;
    } else if (req.aboutCoverImageUrl || req.body.aboutCoverImageUrl) {
      data.about.coverImage =
        req.aboutCoverImageUrl || req.body.aboutCoverImageUrl;
    }

    if (req.aboutCharacterImageBase64) {
      data.about.characterImage = req.aboutCharacterImageBase64;
    } else if (req.aboutCharacterImageUrl || req.body.aboutCharacterImageUrl) {
      data.about.characterImage =
        req.aboutCharacterImageUrl || req.body.aboutCharacterImageUrl;
    }

    if (req.galleryLogoImageBase64) {
      data.gallery.logoImage = req.galleryLogoImageBase64;
    } else if (req.galleryLogoImageUrl || req.body.galleryLogoImageUrl) {
      data.gallery.logoImage =
        req.galleryLogoImageUrl || req.body.galleryLogoImageUrl;
    }

    if (req.galleryImagesBase64 && req.galleryImagesBase64.length > 0) {
      if (
        req.galleryImagesBase64.length < 3 ||
        req.galleryImagesBase64.length > 10
      ) {
        return res.status(400).json({
          error: "Selecione entre 3 e 10 imagens para a galeria.",
        });
      }
      data.gallery.images = req.galleryImagesBase64;
    }

    if (
      req.aboutCarouselImagesBase64 &&
      req.aboutCarouselImagesBase64.length > 0
    ) {
      data.about.carouselImages = req.aboutCarouselImagesBase64;
    } else if (
      !data.about.carouselImages ||
      data.about.carouselImages.length === 0
    ) {
      data.about.carouselImages = settings.about?.carouselImages || [];
    }

    if (req.loaderImageBase64) {
      data.loaderImage = req.loaderImageBase64;
    } else if (req.loaderImageUrl || req.body.loaderImageUrl) {
      data.loaderImage = req.loaderImageUrl || req.body.loaderImageUrl;
    }

    // Imagens dos barbeiros
    if (req.barber1ImageBase64) {
      data.barberCards.barber1Image = req.barber1ImageBase64;
    } else if (req.barber1ImageUrl || req.body.barber1ImageUrl) {
      data.barberCards.barber1Image =
        req.barber1ImageUrl || req.body.barber1ImageUrl;
    }

    if (req.barber1CoverImageBase64) {
      data.barberCards.barber1CoverImage = req.barber1CoverImageBase64;
    } else if (req.barber1CoverImageUrl || req.body.barber1CoverImageUrl) {
      data.barberCards.barber1CoverImage =
        req.barber1CoverImageUrl || req.body.barber1CoverImageUrl;
    }

    // Showcase Cards Images (2 Cards)
    if (!data.showcase) {
      data.showcase = { cards: [] };
    }

    for (let i = 1; i <= 2; i++) {
      if (!data.showcase.cards[i - 1]) {
        data.showcase.cards[i - 1] = { images: [] };
      }

      // Processar múltiplas imagens para cada card
      const showcaseKey = `showcaseCard${i}Images`;
      if (req[showcaseKey] && Array.isArray(req[showcaseKey])) {
        // Se houver novas cardImages, substitui as antigas
        data.showcase.cards[i - 1].images = req[showcaseKey];
      } else if (req.body.showcase?.cards?.[i - 1]?.images) {
        // Caso contrário, mantém as antigas
        data.showcase.cards[i - 1].images =
          req.body.showcase.cards[i - 1].images;
      }
    }

    // Verificar tamanho total antes de salvar (MongoDB tem limite de 16MB por documento)
    const dataSize = JSON.stringify(data).length;
    const dataSizeMB = (dataSize / (1024 * 1024)).toFixed(2);

    console.log(`Tamanho dos dados a guardar: ${dataSizeMB} MB`);

    if (dataSize > 14 * 1024 * 1024) {
      // 14MB para deixar margem
      return res.status(400).json({
        error: `Dados demasiado grandes (${dataSizeMB} MB). Reduza o número ou qualidade das imagens.`,
      });
    }

    settings.set(data);
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error("Erro ao atualizar site settings:", error);
    console.error("Stack trace:", error.stack);

    // Tratar erros específicos do MongoDB
    if (error.name === "DocumentNotFoundError") {
      return res.status(404).json({ error: "Configurações não encontradas" });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ error: `Erro de validação: ${error.message}` });
    }
    if (error.message && error.message.includes("exceeded")) {
      return res.status(400).json({
        error: "Documento muito grande. Reduza o número de imagens da galeria.",
      });
    }

    res.status(500).json({
      error: error.message || "Erro interno do servidor",
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// ===== GERENCIAR REVIEWS =====
exports.getRandomReviews = async (req, res) => {
  try {
    // Pegar 3 reviews aleatórias com rating >= 4 e que estejam ativas
    const reviews = await Review.aggregate([
      { $match: { rating: { $gte: 4 }, isActive: true } },
      { $sample: { size: 3 } },
      { $sort: { date: -1 } },
    ]);

    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ date: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createReview = async (req, res) => {
  try {
    const { author, rating, text, date } = req.body;
    const review = await Review.create({ author, rating, text, date });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { author, rating, text, date, isActive } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { author, rating, text, date, isActive },
      { new: true },
    );

    if (!review) {
      return res.status(404).json({ error: "Review não encontrada" });
    }

    res.json(review);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    await Review.findByIdAndDelete(reviewId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ===== HELPER: CLEANUP EXPIRED ABSENCES =====
// Remove ausências que já passaram (data < hoje)
async function cleanupExpiredAbsences(barber) {
  if (!barber.absences || barber.absences.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const beforeCount = barber.absences.length;
  barber.absences = barber.absences.filter((absence) => {
    const absenceDate = new Date(absence.date);
    absenceDate.setHours(0, 0, 0, 0);
    return absenceDate >= today;
  });

  if (barber.absences.length < beforeCount) {
    await barber.save();
  }
}

// ===== ABSENCE MANAGEMENT =====

exports.addBarberAbsence = async (req, res) => {
  try {
    const { barberId } = req.params;
    const { date, type, startTime, endTime, reason } = req.body;

    if (!date || !type) {
      return res.status(400).json({ error: "Data e tipo são obrigatórios" });
    }

    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    // Limpa ausências expiradas
    await cleanupExpiredAbsences(barber);

    if (!barber.absences) {
      barber.absences = [];
    }

    // Adicionar nova ausência
    barber.absences.push({
      date: new Date(date),
      type,
      startTime: type === "specific" ? startTime : undefined,
      endTime: type === "specific" ? endTime : undefined,
      reason,
    });

    await barber.save();
    res.json(barber);
  } catch (error) {
    console.error("Erro ao adicionar ausência:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.removeBarberAbsence = async (req, res) => {
  try {
    const { barberId, absenceId } = req.params;

    const barber = await Barber.findById(barberId);
    if (!barber) {
      return res.status(404).json({ error: "Barbeiro não encontrado" });
    }

    // Limpa ausências expiradas
    await cleanupExpiredAbsences(barber);

    // Remover ausência por ID
    barber.absences = barber.absences.filter(
      (absence) => absence._id.toString() !== absenceId,
    );

    await barber.save();
    res.json(barber);
  } catch (error) {
    console.error("Erro ao remover ausência:", error);
    res.status(500).json({ error: error.message });
  }
};
