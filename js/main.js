// ===== CAROUSEL =====
(function () {
  const items = document.querySelectorAll(".carousel .item");
  const total = items.length;
  let current = 0;
  let autoplayInterval;

  function update() {
    items.forEach((item) => {
      item.classList.remove("pos-center", "pos-left", "pos-right");
    });

    const left = (current - 1 + total) % total;
    const right = (current + 1) % total;

    items[current].classList.add("pos-center");
    items[left].classList.add("pos-left");
    items[right].classList.add("pos-right");
  }

  function startAutoplay() {
    if (autoplayInterval) clearInterval(autoplayInterval);
    autoplayInterval = setInterval(() => {
      current = (current + 1) % total;
      update();
    }, 3500);
  }

  // Inicia carousel
  update();
  startAutoplay();

  // Clica na imagem da direita para avançar, da esquerda para recuar
  const carouselWrapper = document.querySelector(".carousel__wrapper");
  if (carouselWrapper) {
    carouselWrapper.addEventListener("click", function (e) {
      const item = e.target.closest(".item");
      if (!item) return;

      if (item.classList.contains("pos-right")) {
        current = (current + 1) % total;
        update();
        startAutoplay();
      } else if (item.classList.contains("pos-left")) {
        current = (current - 1 + total) % total;
        update();
        startAutoplay();
      }
    });
  }
})();

// ===== SMOOTH SCROLL =====
// Smooth scroll implementado no index.html para evitar conflitos com mobile menu
/*
(function initSmoothScroll() {
  const setupSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (href !== "#" && document.querySelector(href)) {
          e.preventDefault();
          const target = document.querySelector(href);

          const headerHeight = 0;
          const targetPosition =
            target.getBoundingClientRect().top +
            window.pageYOffset -
            headerHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: "smooth",
          });

          if (href === "#services") {
            setTimeout(() => {
              const serviceCards =
                document.querySelectorAll(".service-card-new");
              serviceCards.forEach((card, index) => {
                setTimeout(() => {
                  card.style.animation = "pulse 0.6s ease";
                  setTimeout(() => {
                    card.style.animation = "";
                  }, 600);
                }, index * 50);
              });
            }, 800);
          }
        }
      });
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupSmoothScroll);
  } else {
    setupSmoothScroll();
  }
})();
*/

// ===== SCROLL OBSERVER =====
const observerOptions = {
  threshold: 0.15,
  rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver(function (entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, observerOptions);

document.querySelectorAll(".scroll-observer").forEach((element) => {
  observer.observe(element);
});

// ===== PARALLAX EFFECT =====
let ticking = false;
window.addEventListener(
  "scroll",
  function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        const scrollY = window.scrollY;
        const heroSection = document.querySelector(".hero");
        if (heroSection) {
          heroSection.style.backgroundPosition = "0 " + -scrollY * 0.5 + "px";
        }
        ticking = false;
      });
      ticking = true;
    }
  },
  { passive: true },
);

// ===== LOADER =====
(function () {
  const loaderOverlay = document.getElementById("loaderOverlay");
  const minLoaderTime = 2500;
  const startTime = Date.now();

  function hideLoader() {
    const elapsedTime = Date.now() - startTime;
    const delayNeeded = Math.max(0, minLoaderTime - elapsedTime);

    setTimeout(() => {
      if (loaderOverlay) {
        loaderOverlay.classList.add("hidden");
      }
    }, delayNeeded);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hideLoader);
  } else {
    hideLoader();
  }

  window.addEventListener("load", hideLoader);
})();

// ===== ACORDEÃO DOS SERVIÇOS =====
document.querySelectorAll(".service-card").forEach((card) => {
  const toggle = card.querySelector(".service-toggle");
  const body = card.querySelector(".service-body");

  if (toggle && body) {
    toggle.addEventListener("click", () => {
      const isOpen = card.classList.contains("open");
      document.querySelectorAll(".service-card.open").forEach((openCard) => {
        openCard.classList.remove("open");
        const openToggle = openCard.querySelector(".service-toggle");
        if (openToggle) {
          openToggle.setAttribute("aria-expanded", "false");
        }
      });

      if (!isOpen) {
        card.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
        body.style.maxHeight = body.scrollHeight + "px";
      } else {
        card.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
        body.style.maxHeight = null;
      }
    });
  }
});

let siteSchedule = null;
const FILMING_MODE_ACTIVE = false;

const FILMING_MODE_OVERRIDES = {
  staff: {
    barber1Name: "Diogo Cunha",
    barber1Description:
      "Senior Barber focused on clean fades and executive grooming, delivering a consistent premium finish.",
    barber1CoverImage:
      "https://images.pexels.com/photos/1453005/pexels-photo-1453005.jpeg?auto=compress&cs=tinysrgb&w=900",
    barber1Image: "https://pngimg.com/d/man_PNG6511.png",
  },
  galleryImages: [
    "https://images.pexels.com/photos/1453005/pexels-photo-1453005.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/3993299/pexels-photo-3993299.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/3993464/pexels-photo-3993464.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/2521978/pexels-photo-2521978.jpeg?auto=compress&cs=tinysrgb&w=900",
    "https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=900",
  ],
  serviceImagesByKeyword: {
    combo:
      "https://images.pexels.com/photos/3993133/pexels-photo-3993133.jpeg?auto=compress&cs=tinysrgb&w=900",
    social:
      "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=900",
    socialBeard:
      "https://images.pexels.com/photos/1319461/pexels-photo-1319461.jpeg?auto=compress&cs=tinysrgb&w=900",
    color:
      "https://images.pexels.com/photos/3993299/pexels-photo-3993299.jpeg?auto=compress&cs=tinysrgb&w=900",
    highlights:
      "https://images.pexels.com/photos/2521978/pexels-photo-2521978.jpeg?auto=compress&cs=tinysrgb&w=900",
    platinum:
      "https://images.pexels.com/photos/3998429/pexels-photo-3998429.jpeg?auto=compress&cs=tinysrgb&w=900",
    beard:
      "https://images.pexels.com/photos/1319461/pexels-photo-1319461.jpeg?auto=compress&cs=tinysrgb&w=900",
    fade: "https://images.pexels.com/photos/1570807/pexels-photo-1570807.jpeg?auto=compress&cs=tinysrgb&w=900",
    haircut:
      "https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=900",
    machine:
      "https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?auto=compress&cs=tinysrgb&w=900",
    child:
      "https://images.pexels.com/photos/769739/pexels-photo-769739.jpeg?auto=compress&cs=tinysrgb&w=900",
    eyebrow:
      "https://images.pexels.com/photos/3993464/pexels-photo-3993464.jpeg?auto=compress&cs=tinysrgb&w=900",
    treatment:
      "https://images.pexels.com/photos/1805600/pexels-photo-1805600.jpeg?auto=compress&cs=tinysrgb&w=900",
    default:
      "https://images.pexels.com/photos/3993133/pexels-photo-3993133.jpeg?auto=compress&cs=tinysrgb&w=900",
  },
};

function normalizeServiceName(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function setImageWithFallback(element, primarySrc, fallbackSrc) {
  if (!element) return;

  if (fallbackSrc) {
    element.onerror = () => {
      element.onerror = null;
      element.src = fallbackSrc;
    };
  }

  element.src = primarySrc || fallbackSrc || element.src;
}

function getServiceFilmingImage(serviceName) {
  const name = normalizeServiceName(serviceName);
  const imageMap = FILMING_MODE_OVERRIDES.serviceImagesByKeyword;

  if (name.includes("social") && name.includes("barba")) {
    return imageMap.socialBeard;
  }
  if (
    name.includes("pintura") ||
    name.includes("color") ||
    name.includes("preto")
  ) {
    return imageMap.color;
  }
  if (
    name.includes("madeixa") ||
    name.includes("luzes") ||
    name.includes("highlight")
  ) {
    return imageMap.highlights;
  }
  if (
    name.includes("platin") ||
    name.includes("platina") ||
    name.includes("blond")
  ) {
    return imageMap.platinum;
  }
  if (name.includes("social")) {
    return imageMap.social;
  }

  if (
    name.includes("combo") ||
    name.includes("pack") ||
    name.includes("completo")
  ) {
    return imageMap.combo;
  }
  if (name.includes("barba") || name.includes("beard")) {
    return imageMap.beard;
  }
  if (name.includes("fade") || name.includes("degrade")) {
    return imageMap.fade;
  }
  if (
    name.includes("maquina") ||
    name.includes("máquina") ||
    name.includes("machine")
  ) {
    return imageMap.machine;
  }
  if (
    name.includes("crianca") ||
    name.includes("criança") ||
    name.includes("kids") ||
    name.includes("junior")
  ) {
    return imageMap.child;
  }
  if (name.includes("sobrancelha") || name.includes("eyebrow")) {
    return imageMap.eyebrow;
  }
  if (
    name.includes("tratamento") ||
    name.includes("treatment") ||
    name.includes("spa")
  ) {
    return imageMap.treatment;
  }
  if (
    name.includes("corte") ||
    name.includes("haircut") ||
    name.includes("tesoura")
  ) {
    return imageMap.haircut;
  }

  return imageMap.default;
}

function applyFilmingStaffOverrides() {
  if (!FILMING_MODE_ACTIVE) return;

  const staff = FILMING_MODE_OVERRIDES.staff;

  const name1 = document.getElementById("staffName1");
  if (name1) name1.textContent = staff.barber1Name;
  const desc1 = document.getElementById("staffDescription1");
  if (desc1) desc1.textContent = staff.barber1Description;

  const aboutCover = document.getElementById("aboutCoverImage");
  const aboutCharacter = document.getElementById("aboutCharacterImage");
  const sharedCoverSrc =
    aboutCover?.getAttribute("src") || "images/cunhacorte.png";
  const sharedCharacterSrc =
    aboutCharacter?.getAttribute("src") || "images/cunha.png";

  const cover1 = document.getElementById("staffCoverImage1");
  setImageWithFallback(cover1, sharedCoverSrc, "images/cunhacorte.png");
  const char1 = document.getElementById("staffCharacterImage1");
  setImageWithFallback(char1, sharedCharacterSrc, "images/cunha.png");
}

function applyFilmingGalleryOverrides() {
  if (!FILMING_MODE_ACTIVE) return;

  const items = document.querySelectorAll(".carousel .item img");
  items.forEach((img, index) => {
    const src = FILMING_MODE_OVERRIDES.galleryImages[index];
    if (src) img.setAttribute("src", src);
  });
}

function normalizeText(value) {
  return (value || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function parseTimeRange(value) {
  const text = normalizeText(value);
  if (!text || text.includes("ENCERRADO") || text.includes("FECHADO")) {
    return null;
  }

  const match = text.match(/(\d{1,2}:\d{2})\s*[\u2013\-]\s*(\d{1,2}:\d{2})/);
  if (!match) return null;

  const [openStr, closeStr] = [match[1], match[2]];
  const [openH, openM] = openStr.split(":").map(Number);
  const [closeH, closeM] = closeStr.split(":").map(Number);
  return {
    openMinutes: openH * 60 + openM,
    closeMinutes: closeH * 60 + closeM,
  };
}

function parseHoursRowsToSchedule(hoursRows) {
  const dayMap = {
    DOMINGO: 0,
    SEGUNDA: 1,
    SEGUNDAFEIRA: 1,
    TERCA: 2,
    TERCAFEIRA: 2,
    QUARTA: 3,
    QUARTAFEIRA: 3,
    QUINTA: 4,
    QUINTAFEIRA: 4,
    SEXTA: 5,
    SEXTAFEIRA: 5,
    SABADO: 6,
  };

  const schedule = {};

  (hoursRows || []).forEach((row) => {
    const label = normalizeText(row.label || "").replace(/\s+/g, " ");
    if (!label) return;

    let days = [];
    const parts = label.split(" A ");
    if (parts.length === 2) {
      const startKey = parts[0].replace(/\s|\-FEIRA/g, "");
      const endKey = parts[1].replace(/\s|\-FEIRA/g, "");
      const start = dayMap[startKey];
      const end = dayMap[endKey];
      if (start !== undefined && end !== undefined) {
        if (start <= end) {
          for (let d = start; d <= end; d++) days.push(d);
        } else {
          for (let d = start; d <= 6; d++) days.push(d);
          for (let d = 0; d <= end; d++) days.push(d);
        }
      }
    } else {
      const key = label.replace(/\s|\-FEIRA/g, "");
      if (dayMap[key] !== undefined) {
        days = [dayMap[key]];
      }
    }

    const range = parseTimeRange(row.value || "");
    days.forEach((day) => {
      schedule[day] = range
        ? {
            open: true,
            openMinutes: range.openMinutes,
            closeMinutes: range.closeMinutes,
          }
        : { open: false };
    });
  });

  return schedule;
}

// ===== STATUS DE HORÁRIO =====
function updateHoursStatus() {
  const now = new Date();
  const day = now.getDay(); // 0 = Domingo, 1-6 = Segunda-Sábado
  const hour = now.getHours();
  const minute = now.getMinutes();
  const currentTime = hour * 60 + minute;

  let isOpen = false;
  let statusText = "";
  let statusColor = "var(--accent)";

  const schedule = siteSchedule && siteSchedule[day];
  if (schedule && schedule.open) {
    if (
      currentTime >= schedule.openMinutes &&
      currentTime < schedule.closeMinutes
    ) {
      isOpen = true;
      statusText = "● ABERTO AGORA";
    } else {
      statusText = "● ENCERRADO";
      statusColor = "#d32f2f";
    }
  } else if (schedule && schedule.open === false) {
    statusText = "● ENCERRADO";
    statusColor = "#d32f2f";
  } else {
    // Fallback caso nao haja configuracao
    statusText = "● ENCERRADO";
    statusColor = "#d32f2f";
  }

  // Atualizar o badge
  const badge = document.querySelector(".badge-open");
  if (badge) {
    badge.textContent = statusText;
    badge.style.backgroundColor = statusColor;
    badge.style.color = "#fff";
  }
}

// Executar ao carregar
updateHoursStatus();
// Atualizar a cada minuto
setInterval(updateHoursStatus, 60000);

// ===== DATAS DAS AVALIAÇÕES =====
function updateReviewDates() {
  const reviewDates = document.querySelectorAll(".review-date[data-date]");
  const now = new Date();

  reviewDates.forEach((element) => {
    const dateStr = element.getAttribute("data-date");
    const reviewDate = new Date(dateStr);
    const diffMs = now - reviewDate;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    let timeText = "";
    if (diffYears > 0) {
      timeText = diffYears === 1 ? "Há 1 ano" : `Há ${diffYears} anos`;
    } else if (diffMonths > 0) {
      timeText = diffMonths === 1 ? "Há 1 mês" : `Há ${diffMonths} meses`;
    } else if (diffWeeks > 0) {
      timeText = diffWeeks === 1 ? "Há 1 semana" : `Há ${diffWeeks} semanas`;
    } else if (diffDays > 0) {
      timeText = diffDays === 1 ? "Há 1 dia" : `Há ${diffDays} dias`;
    } else {
      timeText = "Hoje";
    }

    element.textContent = timeText;
  });
}

// Executar ao carregar
updateReviewDates();
// Atualizar a cada hora
setInterval(updateReviewDates, 3600000);

// ===== ANIMAÇÃO DO GOOGLE MAPS =====
document.addEventListener("DOMContentLoaded", function () {
  const mapContainer = document.querySelector(".map-container");
  const mapIframe = document.getElementById("map");

  if (!mapContainer || !mapIframe) return;

  let hasAnimated = false;

  const mapObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasAnimated) {
          hasAnimated = true;
          setTimeout(() => {
            mapContainer.classList.add("loaded");
          }, 300);
          mapObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 },
  );

  mapObserver.observe(mapContainer);
});

// ===== SITE SETTINGS =====
(function () {
  const API_BASE_URL = "https://two4-7-barbearia.onrender.com/api";
  const DEFAULT_PAYMENT_METHODS = ["MB Way", "Multibanco", "Dinheiro"];

  function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value) {
      el.textContent = value;
    }
  }

  function setHtml(id, value) {
    const el = document.getElementById(id);
    if (el && value) {
      el.innerHTML = value;
    }
  }

  function setSrc(id, value) {
    const el = document.getElementById(id);
    if (el && value) {
      el.setAttribute("src", value);
    }
  }

  function setHref(id, value) {
    const el = document.getElementById(id);
    if (el && value) {
      el.setAttribute("href", value);
    }
  }

  function setHeroBackgroundImage(value) {
    const heroSection = document.querySelector(".hero");
    if (!heroSection) {
      return;
    }

    if (value) {
      heroSection.style.setProperty(
        "--hero-background-image",
        `url("${value}")`,
      );
    } else {
      heroSection.style.removeProperty("--hero-background-image");
    }
  }

  function applySiteSettings(settings) {
    if (!settings) return;

    setText("loaderText", settings.loaderText);
    setSrc("loaderImage", settings.loaderImage || settings.header?.logoImage);

    setText("siteBrandName", settings.header?.brandName);
    setSrc("siteLogo", settings.header?.logoImage);

    // Build dynamic hours - show "Ter - Dom*" for all day range
    if (settings.header?.hoursText) {
      const timeMatch = settings.header.hoursText.match(
        /\d{2}:\d{2}.*\d{2}:\d{2}/,
      );
      const timeRange = timeMatch ? timeMatch[0] : "09:00–19:00";
      setText("headerHours", `📅 Ter - Dom* ${timeRange}`);
    }

    setText("headerAddress", settings.header?.addressText);
    setText("headerPhoneText", settings.header?.phoneText);
    setHref("headerPhoneLink", settings.header?.phoneHref);

    setText("heroTitle", settings.hero?.title);
    setText("heroSubtitle", settings.hero?.subtitle);
    setText("heroDescription", settings.hero?.description);
    setText("heroCtaPrimary", settings.hero?.ctaPrimaryText);
    setHref("heroCtaPrimary", settings.hero?.ctaPrimaryHref);
    setText("heroCtaSecondary", settings.hero?.ctaSecondaryText);
    setHref("heroCtaSecondary", settings.hero?.ctaSecondaryHref);
    setSrc("heroImage", settings.hero?.image);
    setHeroBackgroundImage(settings.hero?.image);

    setText("aboutEyebrow", settings.about?.eyebrow);
    setText("aboutTitle", settings.about?.title);
    setText("aboutText", settings.about?.text);
    setSrc("aboutCoverImage", settings.about?.coverImage);
    setSrc("aboutCharacterImage", settings.about?.characterImage);

    setText("aboutPaymentTitle", settings.about?.paymentCard?.title);

    const aboutPaymentList = document.getElementById("aboutPaymentMethods");
    if (aboutPaymentList) {
      const paymentMethods =
        Array.isArray(settings.about?.paymentCard?.methods) &&
        settings.about.paymentCard.methods.length > 0
          ? settings.about.paymentCard.methods
          : DEFAULT_PAYMENT_METHODS;

      // Icons for payment methods
      const paymentIcons = {
        "MB Way": "💳",
        Multibanco: "🏧",
        Dinheiro: "💵",
      };

      aboutPaymentList.innerHTML = paymentMethods
        .map((method) => {
          const icon = paymentIcons[method] || "💳"; // Default icon
          return `<li>${icon} ${method}</li>`;
        })
        .join("");
    }

    setText("servicesTitle", settings.services?.title);
    setText("servicesSubtitle", settings.services?.subtitle);

    setText("galleryTitle", settings.gallery?.title);
    setText("gallerySubtitle", settings.gallery?.subtitle);
    setSrc("galleryLogoImage", settings.gallery?.logoImage);
    setHref("instagramLink", settings.gallery?.instagramUrl);
    setText("instagramHandle", settings.gallery?.instagramHandle);

    const galleryImages = settings.gallery?.images;
    if (Array.isArray(galleryImages) && galleryImages.length > 0) {
      const items = document.querySelectorAll(".carousel .item img");
      items.forEach((img, index) => {
        if (galleryImages[index]) {
          img.setAttribute("src", galleryImages[index]);
        }
      });
    }

    applyFilmingGalleryOverrides();
    applyFilmingStaffOverrides();

    setText("contactTitle", settings.contact?.title);
    setText("contactAddress", settings.contact?.addressText);
    setText("contactPhoneText", settings.contact?.phoneText);
    setHref("contactPhoneLink", settings.contact?.phoneHref);

    const mapEl = document.getElementById("map");
    if (mapEl && settings.contact?.mapEmbedUrl) {
      mapEl.setAttribute("src", settings.contact.mapEmbedUrl);
    }

    const hoursTable = document.getElementById("hoursTable");
    if (hoursTable && Array.isArray(settings.hoursRows)) {
      hoursTable.innerHTML = settings.hoursRows
        .map(
          (row) =>
            `<tr class="${row.className || ""}"><td>${row.label}</td><td style="text-align:right">${row.value}</td></tr>`,
        )
        .join("");
    }

    siteSchedule = parseHoursRowsToSchedule(settings.hoursRows || []);
    window.siteSchedule = siteSchedule;
    updateHoursStatus();

    if (typeof window.refreshBookingSchedule === "function") {
      window.refreshBookingSchedule();
    }

    setText("ctaTitle", settings.cta?.title);
    setText("ctaText", settings.cta?.text);
    setText("ctaButton", settings.cta?.buttonText);
    setHref("ctaButton", settings.cta?.buttonHref);

    if (settings.footerText) {
      setHtml("footerText", settings.footerText);
    }

    if (typeof window.updateBookingBarbers === "function") {
      window.updateBookingBarbers(settings);
    }

    // Load Showcase Cards Images
    const showcaseCards = settings.showcase?.cards || [];
    showcaseCards.forEach((card, cardIndex) => {
      const images = card.images || [];
      const cardElement =
        document.querySelectorAll(".showcase-card")[cardIndex];
      if (cardElement && images.length > 0) {
        const imagesContainer = cardElement.querySelector(
          ".showcase-card-images",
        );
        imagesContainer.innerHTML = images
          .map(
            (img, idx) => `
            <img class="showcase-card-img ${idx === 0 ? "active" : ""}" src="${img}" alt="Showcase ${cardIndex + 1}-${idx + 1}" loading="lazy" />
          `,
          )
          .join("");

        // Adicionar indicadores de imagem
        if (images.length > 1) {
          const indicatorsHTML = `
            <div class="showcase-card-indicators">
              ${images.map((_, idx) => `<span class="dot ${idx === 0 ? "active" : ""}"></span>`).join("")}
            </div>
          `;
          imagesContainer.insertAdjacentHTML("beforeend", indicatorsHTML);

          // Carousel automático
          let currentImageIndex = 0;
          const rotateImages = () => {
            const imgs = cardElement.querySelectorAll(".showcase-card-img");
            const dots = cardElement.querySelectorAll(
              ".showcase-card-indicators .dot",
            );

            // Remove active de todos
            imgs.forEach((img) => img.classList.remove("active"));
            dots.forEach((dot) => dot.classList.remove("active"));

            // Próxima imagem
            currentImageIndex = (currentImageIndex + 1) % images.length;
            imgs[currentImageIndex].classList.add("active");
            dots[currentImageIndex].classList.add("active");
          };

          // Auto-rotate a cada 4 segundos quando o card está visível
          const observer = new IntersectionObserver(
            (entries) => {
              entries.forEach((entry) => {
                if (entry.isIntersecting) {
                  cardElement.rotationInterval = setInterval(
                    rotateImages,
                    4000,
                  );
                } else if (cardElement.rotationInterval) {
                  clearInterval(cardElement.rotationInterval);
                }
              });
            },
            { threshold: 0.5 },
          );

          observer.observe(cardElement);

          // Click nos dots para mudar imagem manualmente
          cardElement
            .querySelectorAll(".showcase-card-indicators .dot")
            .forEach((dot, idx) => {
              dot.addEventListener("click", () => {
                clearInterval(cardElement.rotationInterval);
                currentImageIndex = idx;

                const imgs = cardElement.querySelectorAll(".showcase-card-img");
                const dots = cardElement.querySelectorAll(
                  ".showcase-card-indicators .dot",
                );
                imgs.forEach((img) => img.classList.remove("active"));
                dots.forEach((d) => d.classList.remove("active"));

                if (imgs[idx]) imgs[idx].classList.add("active");
                if (dots[idx]) dots[idx].classList.add("active");

                // Reiniciar rotação automática
                cardElement.rotationInterval = setInterval(rotateImages, 4000);
              });
            });
        }
      }
    });
  }

  async function loadSiteSettings() {
    try {
      const response = await fetch(`${API_BASE_URL}/site-settings`);
      const data = await response.json();
      if (!response.ok) return;
      applySiteSettings(data);
    } catch (error) {
      // Erro ao carregar configurações
    }
  }

  async function loadServices() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/services`);
      if (!response.ok) {
        console.error("Erro ao carregar serviços");
        return;
      }

      const services = await response.json();
      const servicesGrid = document.getElementById("servicesGrid");

      if (!servicesGrid) return;

      // Filtrar apenas serviços ativos e ordenar
      const activeServices = services
        .filter((s) => s.isActive !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      if (activeServices.length === 0) {
        servicesGrid.innerHTML = `
          <div style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
            <p style="color: var(--text-light);">Nenhum serviço disponível no momento.</p>
          </div>
        `;
        return;
      }

      // Gerar HTML dos cards
      servicesGrid.innerHTML = activeServices
        .map((service) => {
          const price =
            typeof service.price === "number"
              ? `${service.price.toFixed(2)} €`
              : service.price || "Sob consulta";

          const overrideImage = FILMING_MODE_ACTIVE
            ? getServiceFilmingImage(service.name)
            : "";
          const hasImage = Boolean(overrideImage || service.image);
          const imageSrc = overrideImage || service.image;

          return `
          <div class="service-card-new" data-service-id="${service._id || ""}" data-duration="${service.duration || 60}" data-service="${service.name?.toLowerCase().replace(/\s+/g, "-") || ""}">
            <div class="service-card-content">
              <div class="service-photo ${!hasImage ? "service-photo--placeholder" : ""}">
                ${
                  hasImage
                    ? `<img src="${imageSrc}" alt="${service.name}" loading="lazy">`
                    : `<span>24.7</span>`
                }
              </div>
              <div class="service-info">
                <div class="service-main-line">
                  <span class="service-name">${service.name}</span>
                  <span class="service-price">${price}</span>
                </div>
                <div class="service-meta-line">
                  <button class="btn btn--primary" type="button">Marcar</button>
                </div>
              </div>
            </div>
          </div>
        `;
        })
        .join("");

      document.dispatchEvent(
        new CustomEvent("services:rendered", {
          detail: {
            services: activeServices,
          },
        }),
      );
    } catch (error) {
      console.error("Erro ao carregar serviços:", error);
      const servicesGrid = document.getElementById("servicesGrid");
      if (servicesGrid) {
        servicesGrid.innerHTML = `
          <div style="text-align: center; padding: 2rem; grid-column: 1 / -1;">
            <p style="color: var(--text-light);">Erro ao carregar serviços. Tente novamente mais tarde.</p>
          </div>
        `;
      }
    }
  }

  async function loadBarberData() {
    const API_BASE_URL = "https://two4-7-barbearia.onrender.com/api";

    const barberIds = [
      "6998aaf59119a721cdc1e136", // Diogo Cunha
    ];

    const barberKeyMap = {
      "6998aaf59119a721cdc1e136": "diogo-cunha",
    };

    for (const barberId of barberIds) {
      try {
        const response = await fetch(`${API_BASE_URL}/barbers/${barberId}`);
        if (!response.ok) {
          console.warn(
            `Falha ao carregar barbeiro ${barberId}:`,
            response.status,
          );
          continue;
        }

        const barberData = await response.json();
        const barberKey = barberKeyMap[barberId];

        console.log(`📥 Dados do barbeiro ${barberKey} carregados:`, {
          name: barberData.name,
          lunchBreak: barberData.lunchBreak,
        });

        if (window.updateBarberLunchBreak) {
          window.updateBarberLunchBreak(barberKey, barberData.lunchBreak);
        }
        if (window.updateBarberWorkingHours) {
          window.updateBarberWorkingHours(barberKey, barberData.workingHours);
        }
        if (barberData.absences) {
          window["absences_" + barberKey] = barberData.absences;
        }
      } catch (error) {
        console.error(`Erro ao carregar dados do barbeiro ${barberId}:`, error);
      }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    loadSiteSettings();
    loadServices();
    loadBarberData();
  });
})();

// ===== SISTEMA DE RESERVAS =====
(function () {
  // API Configuration
  const API_BASE_URL = "https://two4-7-barbearia.onrender.com/api";

  const bookingState = {
    currentStep: 1,
    service: null,
    serviceId: null,
    servicePrice: null,
    serviceDuration: 60, // duração em minutos (padrão 60)
    barber: null,
    barberId: null,
    date: null,
    time: null,
    selectedMonth: new Date().getMonth(),
    selectedYear: new Date().getFullYear(),
  };

  const barbers = {
    "diogo-cunha": {
      id: "6998aaf59119a721cdc1e136",
      name: "Diogo Cunha",
      workingHours: {
        monday: { start: "closed", end: "closed" },
        tuesday: { start: "09:30", end: "20:00" },
        wednesday: { start: "09:30", end: "20:00" },
        thursday: { start: "09:30", end: "20:00" },
        friday: { start: "09:30", end: "20:00" },
        saturday: { start: "09:00", end: "18:00" },
        sunday: { start: "closed", end: "closed" },
      },
      lunchBreak: {
        enabled: undefined,
        startTime: "12:00",
        endTime: "13:00",
      },
    },
  };

  function getScheduleForDay(day) {
    const schedule = window.siteSchedule || siteSchedule;
    return schedule ? schedule[day] : null;
  }

  function formatTime(minutes) {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, "0");
    const m = (minutes % 60).toString().padStart(2, "0");
    return `${h}:${m}`;
  }

  function formatDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function getTimeSlotsForDate(date, serviceDuration = 60, barberData = null) {
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const dayKey = dayNames[date.getDay()];

    // Horário global da barbearia (SiteSettings)
    const globalSchedule = getScheduleForDay(date.getDay());

    // Horário específico do barbeiro
    let barberSchedule = null;
    const barberWorkingHours = barberData?.workingHours?.[dayKey];
    if (
      barberWorkingHours &&
      barberWorkingHours.start &&
      barberWorkingHours.end &&
      barberWorkingHours.start !== "closed" &&
      barberWorkingHours.end !== "closed"
    ) {
      const [openH, openM] = barberWorkingHours.start.split(":").map(Number);
      const [closeH, closeM] = barberWorkingHours.end.split(":").map(Number);
      barberSchedule = {
        open: true,
        openMinutes: openH * 60 + openM,
        closeMinutes: closeH * 60 + closeM,
      };
    }

    // Regra: o horário do barbeiro é a fonte principal; a barbearia entra como fallback.
    let schedule = null;
    if (barberSchedule?.open) {
      schedule = barberSchedule;
    } else if (globalSchedule?.open) {
      schedule = globalSchedule;
    }

    if (!schedule || !schedule.open) return [];

    const slots = [];
    const slotMinutes = 30; // Sempre 30 minutos entre slots (09:00, 09:30, 10:00, 10:30...)

    // Último slot deve permitir que o serviço termine antes do fecho
    // Ex: Fecho às 18:00 (1080 min), serviço de 90 min → último slot às 16:30 (990 min)
    const lastPossibleStartTime = schedule.closeMinutes - serviceDuration;

    // Converter lunch break times para minutos se disponível
    let lunchStartMinutes = null;
    let lunchEndMinutes = null;
    if (
      barberData?.lunchBreak?.startTime &&
      barberData?.lunchBreak?.endTime &&
      barberData?.lunchBreak?.enabled !== false
    ) {
      const [startH, startM] = barberData.lunchBreak.startTime
        .split(":")
        .map(Number);
      const [endH, endM] = barberData.lunchBreak.endTime.split(":").map(Number);
      lunchStartMinutes = startH * 60 + startM;
      lunchEndMinutes = endH * 60 + endM;

      // DEBUG: Mostrar valores de pausa
      console.log("🍽️ Lunch break enabled:", barberData.lunchBreak);
      console.log("🍽️ Lunch minutes:", { lunchStartMinutes, lunchEndMinutes });
    } else {
      console.log("🍽️ Lunch break disabled or not configured");
    }

    for (
      let t = schedule.openMinutes;
      t <= lastPossibleStartTime;
      t += slotMinutes
    ) {
      // Verificar se o slot cai dentro do intervalo de almoço
      if (lunchStartMinutes !== null && lunchEndMinutes !== null) {
        // Se o slot começa dentro ou após o início do almoço e antes do fim
        if (t >= lunchStartMinutes && t < lunchEndMinutes) {
          console.log(`⏭️ Skipping slot ${formatTime(t)} (lunch break)`);
          continue; // Pular este slot
        }
      }
      slots.push(formatTime(t));
    }

    // Ordenar slots por hora
    slots.sort((a, b) => {
      const [aH, aM] = a.split(":").map(Number);
      const [bH, bM] = b.split(":").map(Number);
      return aH * 60 + aM - (bH * 60 + bM);
    });

    return slots;
  }

  window.updateBookingBarbers = function (settings) {
    const barberSettings = settings?.barberCards;
    if (!barberSettings) return;

    const barber1 = barbers["diogo-cunha"];
    if (barber1 && barberSettings.barber1Name) {
      barber1.name = barberSettings.barber1Name;
    }

    const barber1Card = document.querySelector(
      '.barber-card[data-barber="diogo-cunha"]',
    );
    if (barber1Card && barberSettings.barber1Name) {
      const nameEl = barber1Card.querySelector(".barber-name");
      if (nameEl) nameEl.textContent = barberSettings.barber1Name;
    }
    if (barber1Card && barberSettings.barber1Role) {
      const roleEl = barber1Card.querySelector(".barber-role");
      if (roleEl) roleEl.textContent = barberSettings.barber1Role;
    }

    // Keep booking card name synced with filming override
    applyFilmingStaffOverrides();
  };

  // Função para atualizar lunchBreak de um barbeiro (carregado do endpoint /api/barbers/:id)
  window.updateBarberLunchBreak = function (barberKey, lunchBreak) {
    if (!barberKey || !barbers[barberKey]) {
      console.warn(`❌ Invalid barberKey or barber not found:`, barberKey);
      return;
    }

    console.log(`🔧 updateBarberLunchBreak called with:`, {
      barberKey,
      lunchBreak,
      type: typeof lunchBreak,
    });
    console.log(`🔧 Detailed lunchBreak structure:`, {
      enabled: lunchBreak?.enabled,
      startTime: lunchBreak?.startTime,
      endTime: lunchBreak?.endTime,
    });

    if (lunchBreak && typeof lunchBreak === "object") {
      barbers[barberKey].lunchBreak = lunchBreak;
      console.log(
        `✅ Lunch break atualizado para ${barberKey}. Novo valor em memória:`,
        barbers[barberKey].lunchBreak,
      );
    } else {
      console.warn(
        `⚠️ Sem dados válidos de lunch break para ${barberKey}. Recebido:`,
        lunchBreak,
      );
    }

    // Re-render slots se o barbeiro tiver sido selecionado
    if (bookingState.barber === barberKey && bookingState.date) {
      console.log("🔄 Re-rendering time slots with updated lunch break");
      if (typeof window.reRenderTimeSlots === "function") {
        window.reRenderTimeSlots();
      }
    }
  };

  // Função para atualizar workingHours de um barbeiro (carregado do endpoint /api/barbers/:id)
  window.updateBarberWorkingHours = function (barberKey, workingHours) {
    if (!barberKey || !barbers[barberKey]) {
      return;
    }

    if (workingHours && typeof workingHours === "object") {
      barbers[barberKey].workingHours = workingHours;
    }

    if (bookingState.barber === barberKey && bookingState.date) {
      if (typeof window.reRenderTimeSlots === "function") {
        window.reRenderTimeSlots();
      }
    }
  };

  let bookedSlots = {}; // Será carregado da API

  document.addEventListener("DOMContentLoaded", function () {
    const modal = document.getElementById("bookingModal");
    const closeBtn = document.getElementById("closeBookingModal");
    const overlay = document.querySelector(".booking-modal-overlay");

    if (!modal) return;

    function openBookingModalFromCard(card) {
      if (!card) return;

      const nameEl = card.querySelector(".service-name");
      const priceEl = card.querySelector(".service-price");
      const durationAttr = card.getAttribute("data-duration");

      bookingState.service = nameEl ? nameEl.textContent : "Serviço";
      bookingState.servicePrice = priceEl ? priceEl.textContent : "";
      bookingState.serviceId = card.getAttribute("data-service-id");

      // DEBUG: Log dos valores
      console.log("📋 Service card data:", {
        name: bookingState.service,
        price: bookingState.servicePrice,
        id: bookingState.serviceId,
        durationAttr: durationAttr,
      });

      bookingState.serviceDuration = parseInt(durationAttr || "60", 10);

      // Se duração é inválida, tenta busc ar da API
      if (
        !durationAttr ||
        isNaN(bookingState.serviceDuration) ||
        bookingState.serviceDuration <= 0
      ) {
        console.warn("⚠️ Duração inválida no card, usando padrão 30 minutos");
        bookingState.serviceDuration = 30;
      }

      console.log(
        "⏱️ Service duration:",
        bookingState.serviceDuration,
        "minutos",
      );

      const selectedServiceEl = document.getElementById("selectedService");
      if (selectedServiceEl) {
        selectedServiceEl.textContent = `${bookingState.service} - ${bookingState.servicePrice}`;
      }

      modal.classList.add("active");
      document.body.style.overflow = "hidden";
      resetBooking();
    }

    function bindServiceButtons() {
      const buttons = document.querySelectorAll(".service-card-new .btn--primary");
      buttons.forEach((button) => {
        if (button.dataset.bookingBound === "true") return;
        button.dataset.bookingBound = "true";
        button.addEventListener("click", (event) => {
          event.preventDefault();
          openBookingModalFromCard(button.closest(".service-card-new"));
        });
      });
    }

    bindServiceButtons();
    document.addEventListener("services:rendered", bindServiceButtons);

    // Fechar modal
    if (closeBtn) {
      closeBtn.addEventListener("click", closeModal);
    }
    if (overlay) {
      overlay.addEventListener("click", closeModal);
    }

    function closeModal() {
      modal.classList.remove("active");
      document.body.style.overflow = "";
      resetBooking();
    }

    // Seleção de barbeiro
    const barberCards = document.querySelectorAll(".barber-card");
    barberCards.forEach((card) => {
      card.addEventListener("click", function () {
        barberCards.forEach((c) => c.classList.remove("selected"));
        this.classList.add("selected");
        bookingState.barber = this.getAttribute("data-barber");
      });
    });

    // Navegação de passos
    const nextBtn = document.getElementById("bookingNext");
    const backBtn = document.getElementById("bookingBack");

    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        if (validateStep(bookingState.currentStep)) {
          if (bookingState.currentStep === 3) {
            submitBooking();
          } else {
            goToStep(bookingState.currentStep + 1);
          }
        }
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        goToStep(bookingState.currentStep - 1);
      });
    }

    // Validação em tempo real do telefone
    const phoneInput = document.getElementById("clientPhone");
    if (phoneInput) {
      phoneInput.addEventListener("input", function (e) {
        const phone = e.target.value.replace(/\s/g, "");
        const phoneRegex = /^(\+351)?[29]\d{8}$/;

        if (phone.length > 0 && !phoneRegex.test(phone)) {
          e.target.style.borderColor = "#ff6b35";
        } else {
          e.target.style.borderColor = "";
        }
      });

      phoneInput.addEventListener("blur", function (e) {
        const phone = e.target.value.replace(/\s/g, "");
        const phoneRegex = /^(\+351)?[29]\d{8}$/;

        if (phone.length > 0 && !phoneRegex.test(phone)) {
          e.target.setCustomValidity("Formato: +351 912345678 ou 912345678");
        } else {
          e.target.setCustomValidity("");
        }
      });
    }

    // Validação em tempo real do email
    const emailInput = document.getElementById("clientEmail");
    if (emailInput) {
      emailInput.addEventListener("input", function (e) {
        const email = e.target.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (email.length > 0 && !emailRegex.test(email)) {
          e.target.style.borderColor = "#ff6b35";
        } else {
          e.target.style.borderColor = "";
        }
      });

      emailInput.addEventListener("blur", function (e) {
        const email = e.target.value;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const domain = email.split("@")[1];

        if (email.length > 0) {
          if (!emailRegex.test(email)) {
            e.target.setCustomValidity("Insira um email válido");
          } else if (
            !domain ||
            domain.split(".").length < 2 ||
            domain.endsWith(".test") ||
            domain.endsWith(".fake")
          ) {
            e.target.setCustomValidity("Use um email real");
          } else {
            e.target.setCustomValidity("");
          }
        } else {
          e.target.setCustomValidity("");
        }
      });
    }

    // Limpar mensagem de erro ao editar os campos do formulário
    const formInputs = document.querySelectorAll(
      "#clientName, #clientPhone, #clientEmail",
    );
    formInputs.forEach((input) => {
      input.addEventListener("input", hideBookingError);
    });

    // Calendário
    const prevMonthBtn = document.getElementById("prevMonth");
    const nextMonthBtn = document.getElementById("nextMonth");

    if (prevMonthBtn) {
      prevMonthBtn.addEventListener("click", () => changeMonth(-1));
    }
    if (nextMonthBtn) {
      nextMonthBtn.addEventListener("click", () => changeMonth(1));
    }

    // Close success modal
    const closeSuccessBtn = document.getElementById("closeSuccessModal");
    if (closeSuccessBtn) {
      closeSuccessBtn.addEventListener("click", function () {
        const modal = document.getElementById("successModal");
        if (modal) {
          modal.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    }

    // Close success modal on overlay click
    const successModalOverlay = document.querySelector(
      ".success-modal-overlay",
    );
    if (successModalOverlay) {
      successModalOverlay.addEventListener("click", function () {
        const modal = document.getElementById("successModal");
        if (modal) {
          modal.classList.remove("active");
          document.body.style.overflow = "";
        }
      });
    }

    renderCalendar();
  });

  function validateStep(step) {
    if (step === 1 && !bookingState.barber) {
      showBookingError("Por favor, selecione um barbeiro");
      return false;
    }
    if (step === 2 && (!bookingState.date || !bookingState.time)) {
      showBookingError("Por favor, selecione data e horário");
      return false;
    }
    if (step === 3) {
      const name = document.getElementById("clientName");
      const email = document.getElementById("clientEmail");
      if (!name || !email || !name.value || !email.value) {
        showBookingError("Por favor, preencha nome e email");
        return false;
      }
    }
    return true;
  }

  function showBookingError(message) {
    const errorDiv = document.getElementById("bookingError");
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = "block";

      // Scroll suave para a mensagem de erro
      errorDiv.scrollIntoView({ behavior: "smooth", block: "nearest" });

      // Auto-hide após 5 segundos
      setTimeout(() => {
        errorDiv.style.display = "none";
      }, 5000);
    }
  }

  function hideBookingError() {
    const errorDiv = document.getElementById("bookingError");
    if (errorDiv) {
      errorDiv.style.display = "none";
    }
  }

  function goToStep(step) {
    bookingState.currentStep = step;

    // Limpar mensagem de erro ao mudar de passo
    hideBookingError();

    document.querySelectorAll(".booking-step").forEach((s, i) => {
      s.classList.toggle("active", i + 1 === step);
      s.classList.toggle("completed", i + 1 < step);
    });

    document.querySelectorAll(".booking-step-content").forEach((c, i) => {
      c.classList.toggle("active", i + 1 === step);
    });

    const backBtn = document.getElementById("bookingBack");
    const nextBtn = document.getElementById("bookingNext");

    if (backBtn) {
      backBtn.style.display = step > 1 ? "block" : "none";
    }
    if (nextBtn) {
      nextBtn.textContent = step === 3 ? "Confirmar Reserva" : "Continuar";
    }

    if (step === 2) {
      renderCalendar();
      renderTimeSlots();
    } else if (step === 3) {
      updateSummary();
    }
  }

  function renderCalendar() {
    if (!bookingState.barber) return;

    const firstDay = new Date(
      bookingState.selectedYear,
      bookingState.selectedMonth,
      1,
    );
    const lastDay = new Date(
      bookingState.selectedYear,
      bookingState.selectedMonth + 1,
      0,
    );
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek =
      firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const monthNames = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const calendarMonthEl = document.getElementById("calendarMonth");
    if (calendarMonthEl) {
      calendarMonthEl.textContent = `${monthNames[bookingState.selectedMonth]} ${bookingState.selectedYear}`;
    }

    const calendarDays = document.getElementById("calendarDays");
    if (!calendarDays) return;

    calendarDays.innerHTML = "";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Dias vazios antes do início do mês
    for (let i = 0; i < startingDayOfWeek; i++) {
      calendarDays.innerHTML += '<div class="calendar-day empty"></div>';
    }

    const barberWorkDays = [0, 1, 2, 3, 4, 5, 6].filter((day) => {
      const schedule = getScheduleForDay(day);
      return schedule && schedule.open;
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        bookingState.selectedYear,
        bookingState.selectedMonth,
        day,
      );
      const dayOfWeek = date.getDay();
      const isPast = date < today;
      const isWorkDay = barberWorkDays.includes(dayOfWeek);

      // Verificar folga do barbeiro
      const dayKeys = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      const dayKey = dayKeys[dayOfWeek];
      const barberData = barbers[bookingState.barber];
      const barberDayHours = barberData?.workingHours?.[dayKey];
      const isBarberDayOff =
        barberDayHours &&
        (barberDayHours.start === "closed" || barberDayHours.end === "closed");
      const isSelected =
        bookingState.date &&
        bookingState.date.getDate() === day &&
        bookingState.date.getMonth() === bookingState.selectedMonth &&
        bookingState.date.getFullYear() === bookingState.selectedYear;

      let classes = "calendar-day";
      if (isPast || isBarberDayOff) classes += " disabled";
      else if (!isWorkDay) classes += " disabled";
      if (isSelected) classes += " selected";

      const dayEl = document.createElement("div");
      dayEl.className = classes;
      dayEl.textContent = day;

      if (!isPast && isWorkDay && !isBarberDayOff) {
        dayEl.addEventListener("click", () =>
          selectDate(
            new Date(
              bookingState.selectedYear,
              bookingState.selectedMonth,
              day,
            ),
          ),
        );
      }

      calendarDays.appendChild(dayEl);
    }
  }

  function selectDate(date) {
    bookingState.date = date;
    bookingState.time = null;
    renderCalendar();
    renderTimeSlots();
    reloadTimeSlots(); // Carregar slots da API
  }

  function renderTimeSlots() {
    const timeSlotsContainer = document.getElementById("timeSlots");
    if (!timeSlotsContainer) {
      return;
    }

    timeSlotsContainer.innerHTML = "";

    if (!bookingState.date) {
      timeSlotsContainer.innerHTML =
        '<p class="time-slots-empty">Selecione uma data primeiro</p>';
      return;
    }

    if (!bookingState.barber) {
      timeSlotsContainer.innerHTML =
        '<p class="time-slots-empty">Selecione um barbeiro primeiro</p>';
      return;
    }

    const dateKey = formatDateKey(bookingState.date);

    // Obter dados do barbeiro (incluindo lunchBreak)
    const barberData = barbers[bookingState.barber];

    // DEBUG: Verificar se os dados da pausa estão a chegar
    console.log("🍽️ Barber data:", barberData);
    console.log("🍽️ Lunch break config:", barberData?.lunchBreak);

    // PROTEÇÃO: Garantir que temos duração válida
    if (!bookingState.serviceDuration || bookingState.serviceDuration <= 0) {
      console.error("ERRO CRITICO: serviceDuration invalida", {
        serviceDuration: bookingState.serviceDuration,
        bookingState,
      });
      timeSlotsContainer.innerHTML =
        '<p class="time-slots-empty"><strong>ERRO:</strong> Nenhum serviço selecionado. Por favor, volte e selecione um serviço.</p>';
      return;
    }

    console.log("⏱️ Usando duração:", bookingState.serviceDuration, "minutos");

    const barberHours = getTimeSlotsForDate(
      bookingState.date,
      bookingState.serviceDuration,
      barberData,
    );

    // DEBUG: Mostrar slots após filtro de pausa
    console.log("📅 Available hours after lunch break filter:", barberHours);
    const dayOfWeek = bookingState.date.getDay();
    const dayNames = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];

    if (barberHours.length === 0) {
      timeSlotsContainer.innerHTML =
        '<p class="time-slots-empty">Sem horarios disponiveis neste dia</p>';
      return;
    }

    // Verificar se a data selecionada é hoje
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const selectedDate = new Date(
      bookingState.date.getFullYear(),
      bookingState.date.getMonth(),
      bookingState.date.getDate(),
    );
    const isToday = today.getTime() === selectedDate.getTime();

    // Se for hoje, obter hora e minuto atual
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Filtrar horários que já passaram se for hoje
    const availableHours = barberHours
      .filter((time) => {
        // código existente de filtrar horários passados...
        if (!isToday) return true;
        const [slotHour, slotMinute] = time.split(":").map(Number);
        if (slotHour < currentHour) return false;
        if (slotHour === currentHour && slotMinute <= currentMinute)
          return false;
        return true;
      })
      // ✅ NOVO filtro de ausências:
      .filter((time) => {
        const absences =
          barberData?.absences ||
          window["absences_" + bookingState.barber] ||
          [];
        return !absences.some((absence) => {
          const absDate = formatDateKey(new Date(absence.date));
          if (absDate !== dateKey) return false;
          if (absence.type === "full") return true;
          if (absence.type === "morning") return time < "13:00";
          if (absence.type === "afternoon") return time >= "13:00";
          if (absence.type === "specific") {
            const [slotH, slotM] = time.split(":").map(Number);
            const slotEndMinutes =
              slotH * 60 + slotM + bookingState.serviceDuration;
            const [absStartH, absStartM] = absence.startTime
              .split(":")
              .map(Number);
            const [absEndH, absEndM] = absence.endTime.split(":").map(Number);
            const absStart = absStartH * 60 + absStartM;
            const absEnd = absEndH * 60 + absEndM;
            const slotStart = slotH * 60 + slotM;
            // Bloqueia se o slot ou o serviço sobrepõe a ausência
            return slotEndMinutes > absStart && slotStart < absEnd;
          }
          return false;
        });
      });

    if (availableHours.length === 0) {
      timeSlotsContainer.innerHTML =
        '<p class="time-slots-empty">Sem horários disponíveis para hoje</p>';
      return;
    }

    availableHours.forEach((time) => {
      const slotKey = `${bookingState.barber}-${dateKey}-${time}`;
      const isBooked = bookedSlots[slotKey];

      const timeSlot = document.createElement("button");
      timeSlot.className = "time-slot";
      if (isBooked) timeSlot.classList.add("booked");
      if (bookingState.time === time) timeSlot.classList.add("selected");
      timeSlot.textContent = time;
      timeSlot.disabled = isBooked;

      if (!isBooked) {
        timeSlot.addEventListener("click", () => {
          bookingState.time = time;
          renderTimeSlots();
        });
      }

      timeSlotsContainer.appendChild(timeSlot);
    });
  }

  window.refreshBookingSchedule = function () {
    if (bookingState.currentStep === 2) {
      renderCalendar();
      renderTimeSlots();
    }
  };

  window.reRenderTimeSlots = function () {
    if (bookingState.date && bookingState.barber) {
      renderTimeSlots();
    }
  };

  function changeMonth(direction) {
    bookingState.selectedMonth += direction;
    if (bookingState.selectedMonth > 11) {
      bookingState.selectedMonth = 0;
      bookingState.selectedYear++;
    } else if (bookingState.selectedMonth < 0) {
      bookingState.selectedMonth = 11;
      bookingState.selectedYear--;
    }
    renderCalendar();
  }

  function updateSummary() {
    const summaryService = document.getElementById("summaryService");
    const summaryPrice = document.getElementById("summaryPrice");
    const summaryBarber = document.getElementById("summaryBarber");
    const summaryDate = document.getElementById("summaryDate");
    const summaryTime = document.getElementById("summaryTime");

    if (summaryService) summaryService.textContent = bookingState.service;
    if (summaryPrice) summaryPrice.textContent = bookingState.servicePrice;
    if (summaryBarber)
      summaryBarber.textContent = barbers[bookingState.barber].name;
    if (summaryDate)
      summaryDate.textContent = bookingState.date.toLocaleDateString("pt-PT");
    if (summaryTime) summaryTime.textContent = bookingState.time;
  }

  async function submitBooking() {
    const name = document.getElementById("clientName").value;
    const phone = document.getElementById("clientPhone").value;
    const email = document.getElementById("clientEmail").value;

    if (!name || !phone || !email) {
      showBookingError("Por favor, preencha todos os dados");
      return;
    }

    // Validar telefone português
    const phoneRegex = /^(\+351\s?)?[29]\d{8}$/;
    const cleanPhone = phone.replace(/\s/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      showBookingError(
        "Número de telefone inválido! Use formato: +351 912345678 ou 912345678",
      );
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showBookingError(
        "Email inválido! Insira um email válido como: exemplo@email.com",
      );
      return;
    }

    // Verificar se o email tem domínio válido (não apenas @test ou @fake)
    const domain = email.split("@")[1];
    if (
      !domain ||
      domain.split(".").length < 2 ||
      domain.endsWith(".test") ||
      domain.endsWith(".fake")
    ) {
      showBookingError("Email inválido! Por favor, use um email real.");
      return;
    }

    // Limpar mensagens de erro anteriores
    hideBookingError();

    // Preparar dados para enviar à API
    const reservationData = {
      barberId: barbers[bookingState.barber].id,
      serviceId: bookingState.serviceId,
      clientName: name,
      clientPhone: phone,
      clientEmail: email,
      // Enviar apenas a data; a hora vem separada em timeSlot
      reservationDate: formatDateKey(bookingState.date),
      timeSlot: bookingState.time,
      notes: "",
    };

    try {
      const response = await fetch(`${API_BASE_URL}/reservations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reservationData),
      });

      const rawText = await response.text();
      let data = null;
      if (rawText) {
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          console.error("Erro ao converter resposta em JSON:", parseError);
        }
      }

      if (!response.ok || (data && data.error)) {
        const errorMessage =
          data?.error || `Erro ${response.status}: ${response.statusText}`;
        showBookingError(errorMessage);
        return;
      }

      const barberName = barbers[bookingState.barber]?.name || "Barbeiro";
      const dateLabel = bookingState.date
        ? bookingState.date.toLocaleDateString("pt-PT")
        : new Date(reservationData.reservationDate).toLocaleDateString("pt-PT");
      const timeLabel = bookingState.time || reservationData.timeSlot;

      showSuccessModal({
        service: bookingState.service || "Serviço confirmado",
        barber: barberName,
        date: dateLabel,
        time: timeLabel,
        email: email,
        name: name,
      });

      const modal = document.getElementById("bookingModal");
      if (modal) {
        modal.classList.remove("active");
      }
      document.body.style.overflow = "";
      resetBooking();
      reloadTimeSlots();
    } catch (error) {
      console.error("Erro ao criar reserva:", error);
      showBookingError(
        "Erro ao processar reserva. Verifique a ligação ou tente novamente em instantes.",
      );
    }
  }

  // Carregar slots do backend
  async function reloadTimeSlots() {
    if (!bookingState.date) {
      renderTimeSlots();
      return;
    }

    if (!bookingState.barber) {
      renderTimeSlots();
      return;
    }

    try {
      const dateStr = formatDateKey(bookingState.date);
      const barberId = barbers[bookingState.barber].id;
      const url = `${API_BASE_URL}/reservations/barber/${barberId}?date=${dateStr}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reservations = await response.json();

      // Construir lista de intervalos ocupados (reservações existentes)
      const bookedIntervals = reservations
        .filter((r) => r.status !== "cancelled")
        .map((reservation) => {
          const [hour, minute] = reservation.timeSlot.split(":").map(Number);
          const reservaStartMinutes = hour * 60 + minute;
          const reservaDuration =
            reservation.serviceId?.duration ||
            reservation.serviceDuration ||
            60;
          const reservaEndMinutes = reservaStartMinutes + reservaDuration;

          return { start: reservaStartMinutes, end: reservaEndMinutes };
        });

      // Verificar cada slot gerado se sobrepõe com alguma reserva existente
      // Um slot está ocupado se: slotStart < reservaFim && slotFim > reservaInício
      bookedSlots = {};
      const currentServiceDuration = bookingState.serviceDuration || 60;
      const barberData = barbers[bookingState.barber];
      const generatedSlots = getTimeSlotsForDate(
        bookingState.date,
        currentServiceDuration,
        barberData,
      );

      generatedSlots.forEach((slotTime) => {
        const [slotHour, slotMinute] = slotTime.split(":").map(Number);
        const slotStartMinutes = slotHour * 60 + slotMinute;
        const slotEndMinutes = slotStartMinutes + currentServiceDuration;

        const isConflict = bookedIntervals.some(
          (reservation) =>
            slotStartMinutes < reservation.end &&
            slotEndMinutes > reservation.start,
        );

        if (isConflict) {
          const key = `${bookingState.barber}-${dateStr}-${slotTime}`;
          bookedSlots[key] = true;
        }
      });

      renderTimeSlots();
    } catch (error) {
      // Fallback: renderizar slots mesmo sem dados da API
      renderTimeSlots();
    }
  }

  function resetBooking() {
    bookingState.currentStep = 1;
    bookingState.barber = null;
    bookingState.date = null;
    bookingState.time = null;
    bookingState.selectedMonth = new Date().getMonth();
    bookingState.selectedYear = new Date().getFullYear();

    document
      .querySelectorAll(".barber-card")
      .forEach((c) => c.classList.remove("selected"));

    const bookingForm = document.getElementById("bookingForm");
    if (bookingForm) {
      bookingForm.reset();
    }

    const timeSlotsContainer = document.getElementById("timeSlots");
    if (timeSlotsContainer) {
      timeSlotsContainer.innerHTML =
        '<p class="time-slots-empty">Selecione um barbeiro primeiro</p>';
    }

    goToStep(1);
  }

  // Success Modal
  function showSuccessModal(data) {
    const modal = document.getElementById("successModal");
    const details = document.getElementById("successDetails");

    if (!modal || !details) return;

    details.innerHTML = `
      <div class="success-detail-item">
        <span class="success-detail-label">Serviço</span>
        <span class="success-detail-value">${data.service}</span>
      </div>
      <div class="success-detail-item">
        <span class="success-detail-label">Barbeiro</span>
        <span class="success-detail-value">${data.barber}</span>
      </div>
      <div class="success-detail-item">
        <span class="success-detail-label">Data</span>
        <span class="success-detail-value">${data.date}</span>
      </div>
      <div class="success-detail-item">
        <span class="success-detail-label">Hora</span>
        <span class="success-detail-value">${data.time}</span>
      </div>
      <div class="success-detail-item">
        <span class="success-detail-label">Email</span>
        <span class="success-detail-value">${data.email}</span>
      </div>
    `;

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
})();

// ===== MOSTRAR 2ª IMAGEM ABOUT SECTION (Mobile + Tablet + Desktop) =====
(function initAboutImage() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAboutImage);
    return;
  }

  const aboutCard = document.querySelector(".about-card");
  const aboutSection = document.querySelector(".about");

  if (!aboutCard || !aboutSection) {
    return;
  }

  // Ajustar threshold conforme o tamanho da tela
  let threshold = 0.8;
  let rootMargin = "0px 0px -22% 0px";
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth < 768;
  const isTablet = screenWidth >= 768 && screenWidth < 1024;

  if (isMobile) {
    // Mobile (iPhone/Android) - ativa mais tarde com mais scroll necessário
    threshold = 0.45;
    rootMargin = "0px 0px -20% 0px";
  } else if (isTablet) {
    // Tablet - ativa quando 70% visível com margem de -18%
    threshold = 0.7;
    rootMargin = "0px 0px -18% 0px";
  }
  // Desktop: threshold 0.8, rootMargin -22% (ativa mais tarde, ao fazer mais scroll)

  if (!("IntersectionObserver" in window)) {
    aboutCard.classList.add("is-3d");
    return;
  }

  // IntersectionObserver - ativa 3D quando card está visível
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-3d");
        } else {
          entry.target.classList.remove("is-3d");
        }
      });
    },
    {
      threshold: threshold,
      rootMargin: rootMargin,
    },
  );

  observer.observe(aboutCard);
})();

// ===== STAFF SECTION - Load and 3D Animation =====
(function initStaff() {
  const API_BASE_URL = "https://two4-7-barbearia.onrender.com/api";

  // Load staff data from backend
  async function loadStaffData() {
    try {
      const response = await fetch(`${API_BASE_URL}/site-settings`);
      if (!response.ok) return;

      const data = await response.json();
      const barberCards = data?.barberCards;

      if (!barberCards) return;

      // Update Barbeiro 1
      if (barberCards.barber1Name) {
        const name1 = document.getElementById("staffName1");
        if (name1) name1.textContent = barberCards.barber1Name;
      }
      if (barberCards.barber1Description) {
        const desc1 = document.getElementById("staffDescription1");
        if (desc1) desc1.textContent = barberCards.barber1Description;
      }
      if (barberCards.barber1CoverImage) {
        const img1 = document.getElementById("staffCoverImage1");
        if (img1) img1.src = barberCards.barber1CoverImage;
      }
      if (barberCards.barber1Image) {
        const char1 = document.getElementById("staffCharacterImage1");
        if (char1) char1.src = barberCards.barber1Image;
      }

      applyFilmingStaffOverrides();
    } catch (error) {
      // Error loading staff data
      applyFilmingStaffOverrides();
    }
  }

  // Initialize 3D animation with IntersectionObserver
  function init3DAnimation() {
    const staffCards = document.querySelectorAll(".staff-card");
    const staffSection = document.querySelector(".staff");

    if (!staffCards.length || !staffSection) return;

    // Adjust threshold based on screen size
    let threshold = 0.8;
    let rootMargin = "0px 0px -22% 0px";
    const screenWidth = window.innerWidth;
    const isMobile = screenWidth < 768;
    const isTablet = screenWidth >= 768 && screenWidth < 1024;

    if (isMobile) {
      // Mobile (iPhone/Android) - valores mais acessíveis
      threshold = 0.3;
      rootMargin = "0px 0px -10% 0px";
    } else if (isTablet) {
      // Tablet - ativa quando 70% visível com margem de -15%
      threshold = 0.7;
      rootMargin = "0px 0px -18% 0px";
    }
    // Desktop: threshold 0.8, rootMargin -22% (ativa mais tarde, ao fazer mais scroll)

    if (!("IntersectionObserver" in window)) {
      staffCards.forEach((card) => card.classList.add("is-3d"));
      return;
    }

    // IntersectionObserver para ativar 3D individualmente em cada card
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-3d");
          } else {
            entry.target.classList.remove("is-3d");
          }
        });
      },
      {
        threshold: threshold,
        rootMargin: rootMargin,
      },
    );

    // Observar cada card individualmente
    staffCards.forEach((card) => observer.observe(card));
  }

  // Execute on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      loadStaffData();
      init3DAnimation();
    });
  } else {
    loadStaffData();
    init3DAnimation();
  }
})();
