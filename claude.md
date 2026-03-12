# 🎯 24.7 Barbearia - Contexto do Projeto

**Última atualização:** 12 Mar 2026  
**Status:** Em desenvolvimento ativo

---

## 📋 Resumo Executivo

Projeto de website moderno para barbearia em Almada, Portugal. Stack: HTML/CSS/JS frontend + Node.js/Express backend (Render). Sistema completo com reservas online, admin panel, 3D animations, carousel, reviews dinâmicas.

---

## 🏗️ Arquitetura

### Frontend (c:\Users\pedro\Downloads\247)

- **index.html** (4802 linhas): Estrutura completa com sections + estilos inline
- **js/main.js** (1573 linhas): Lógica de carousel, 3D effects, booking modal, reviews
- **css/** : Estilos responsivos (mobile-responsive.css)
- **images/** : Assets (logo, photos, cunha.png para 3D)

### Backend (Render - Express)

- **Base URL:** `https://two4-7-barbearia.onrender.com/api`
- **Endpoints principais:**
  - `/api/site-settings` - Dados dinâmicos (hero, about, staff, contact)
  - `/api/admin/services` - Serviços e preços
  - `/api/reviews/random` - Avaliações
  - POST `/api/bookings` - Reservas (recebe: service, barber, date, time, name, phone, email)

### Base de Dados

- MongoDB Atlas com modelos:
  - **SiteSettings** : Conteúdo dinâmico (hero, about, staff, contact, hours)
  - **Services** : Nome, preço, descrição
  - **Bookings** : Reservas (com Resend email notifications)
  - **Reviews** : Avaliações Google

---

## 🎨 Design System

**Cores:**

- Primary: `#1a1a1a` (preto)
- Accent: `#8b7355` / `#c9a961` (ouro)
- Background: `#f5f5f5` / `#f9f8f7` (claro)
- Text: `#1f2933` (escuro) / `#4b5563` (cinzento)

**Tipografia:**

- Font: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
- Espacamento: `--spacing-sm: 0.75rem` até `--spacing-xl: 4rem`
- Transições: `--transition-fast: 180ms`, `--transition-smooth: 280ms`

---

## 📱 Sections Implementadas

### ✅ Completas

1. **Header** - Logo + Nav + Info (responsivo com mobile toggle)
2. **Hero** - CTA + Imagem herói
3. **Sobre** - 3D card com IntersectionObserver (ativa ao scroll)
4. **Serviços** - Grid dinâmica (API)
5. **Galeria** - Carousel com 7 items (manual + autoplay)
6. **Staff** - 2 cards 3D com IntersectionObserver + nomes e descrições editáveis
   - Layout grid (2 colunas desktop, 1 mobile)
   - Imagens 3D (background + character) editáveis via admin
   - Backend: barberCards com barber1/2 (Name, Role, Description, Image, CoverImage)
7. **Avaliações** - Cards dinâmicas (API Google reviews)
8. **Contacto** - Mapa + Horas + Telefone
9. **Footer** - Copyright

### 🔄 Em Desenvolvimento

- Admin panel completo (upload de imagens via Cloudinary/ImgBB)

### ⏰ Futuro

- Staff: upload direto de imagens (atualmente via URL)

---

## 💾 CSS 3D Card System

**Classes principais:**

```css
.about-card-3d {
  display: flex;
}
.about-card {
  width: var(--about-card-width);
  height: 340px;
  perspective: 2000px;
}
.about-card-wrapper {
  width: 120%;
  height: 120%;
  transform-style: preserve-3d;
}
.about-card.is-3d .about-card-wrapper {
  transform: perspective(900px) translateY(-5%) rotateX(22deg) translateZ(0);
  box-shadow: 0px 13px 20px rgba(0, 0, 0, 0.75);
}
.about-cover-image {
  width: 100%;
  object-fit: cover;
  border-radius: 0.75rem;
}
.about-card.is-3d .about-cover-image {
  filter: brightness(0.4) contrast(1.1);
}
.about-character-image {
  width: 110%;
  opacity: 0;
  position: absolute;
  bottom: 0;
  z-index: -1;
}
.about-card.is-3d .about-character-image {
  opacity: 1;
  transform: translate3d(0, -1%, 280px);
}
```

**JS Triggerboard:**

- IntersectionObserver com threshold adaptivo (mobile: 0.35, tablet: 0.6, desktop: 0.7)
- Ativa classe `.is-3d` ao entrar na viewport
- Suporta mouse movement para parallax adicional

---

## 🎪 Carousel (Instagram Gallery)

- 7 items (imagens Unsplash + locais)
- Autoplay a cada 3.5s
- Manual: clica imagem direita (avança), esquerda (recua)
- Transição: `cubic-bezier(0.25, 0.46, 0.45, 0.94)`
- Layout: pos-center (100%), pos-left (zoom out esquerda), pos-right (zoom out direita)

---

## 🗂️ Booking Modal

**3 Steps:**

1. Selecionar barbeiro (Diogo Cunha / Ricardo Silva)
2. Escolher data + hora (calendário dinâmico + time slots)
3. Preencher dados (nome, telefone, email)

**Integração:**

- Clica em "Marcar" num serviço → abre modal
- Submissão POST `/api/bookings`
- EmailJS envia confirmação
- Success modal com detalhes

---

## 🔧 Problemas Anteriores & Soluções

| Problema                      | Solução                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| Staff section incoerente      | Cloned Sobre section's 3D card (even CSS)                      |
| 3D animation fraco            | IntersectionObserver + perspective transform                   |
| Performance                   | Lazy loading + CSS transitions (GPU accelerated)               |
| Mobile menu                   | Toggle com smooth scroll (450ms easing)                        |
| Staff responsive quebrado     | Fix `\n` literal em CSS + !important rules                     |
| Grid não mudava para 1 coluna | Added @media (max-width: 900px) com grid-template-columns: 1fr |

---

## 📊 Checklist Técnico

- [x] Responsivo (mobile-first)
- [x] 3D animations (WebGL-ready, uses perspective + transform)
- [x] Carousel funcional
- [x] API integration (fetch)
- [x] EmailJS notificações
- [x] Dinamização hero/about/contact (site-settings)
- [x] Services grid dinâmico
- [x] Reviews dinâmicas
- [x] Booking modal (3 steps)
- [x] Staff section dinâmica (2 barbeiros com 3D cards)
- [x] Admin panel para staff (nomes, descrições, imagens via URL)
- [ ] Admin panel: upload direto de imagens (Cloudinary/ImgBB)

---

## 📝 Como Usar Este Arquivo

**A cada nova conversa:**

1. Lê este `claude.md`
2. Identifica secção relevante
3. Propõe mudanças específicas com menos contexto necesário
4. Atualiza este arquivo com mudanças significativas

**Economiza:** ~30-40% tokens em comparação a reler todo código

---

## 🚀 Recomendações Modelo IA

### Para Programação Complexa (Refactoring, Bugs, 3D)

→ **Claude Sonnet 4.5** ou **Claude Opus**  
Razão: Melhor reasoning, compreensão profunda do contexto

### Para Troubleshooting Rápido (CSS, JS small fixes)

→ **Claude Haiku 4.5** (atual - eficiente para tweaks)

### Para Design/UX

→ **Gemini 3.1 Pro**  
Razão: Melhor visual reasoning

### Para Problemas Que Exigem Muito Raciocínio

→ **GPT 5.3 Codex**  
Razão: O'Reilly extended thinking para edge cases

---

## � Sistema de Email (Resend)

**Migração:** EmailJS → Resend (12 Mar 2026)

### EmailJS (Antigo - REMOVIDO)

- ❌ 200 emails/mês → insuficiente para 9 reservas/dia (270 emails necessários)
- ❌ API key exposta no frontend (segurança fraca)
- ❌ Envio direto do browser (menos confiável)

### Resend (Atual)

- ✅ **3000 emails/mês grátis** → suficiente até 45 reservas/dia
- ✅ **100 emails/dia** sem custo
- ✅ Envio via backend (seguro)
- ✅ Domínio custom: `noreply@247barbearia.pt`
- ✅ Templates HTML modernos com CSS inline
- ✅ Notificações duplas: cliente + admin

### Arquivos Relacionados

- `backend/src/services/emailService.js` - Serviço de email (2 funções)
- `backend/src/controllers/reservationController.js` - Integração (linhas 8-9, 182-205)
- `backend/RESEND_SETUP.md` - Guia completo de configuração
- `.env.example` - Variáveis necessárias (RESEND_API_KEY, ADMIN_EMAIL)

### Funcionamento

1. Cliente faz reserva no site
2. Backend cria reserva no MongoDB
3. Backend chama `sendBookingConfirmation()` → email ao cliente
4. Backend chama `sendAdminNotification()` → email ao admin
5. Ambos executam em paralelo (Promise.all) sem bloquear resposta

### Templates

- **Cliente:** Confirmação com detalhes + link de cancelamento
- **Admin:** Notificação com dados completos do cliente

### Variáveis de Ambiente

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx  # Obter em resend.com/api-keys
ADMIN_EMAIL=admin@247barbearia.pt        # Email que recebe notificações
```

---

## �📌 Notas de Desenvolvimento

- **Cores custom properties** guardadas em `:root` → facilita manutenção
- **Mobile-responsive.css** override inline styles para pequenos ecrãs (com !important)
- **API base URL hardcoded** em main.js → considerar config env
- **Z-index management:** loader (10000) > booking modal (10000) > header (~100) > content
- **Transitions:** prefira cubic-bezier(0.34, 1.56, 0.64, 1) para smooth feel
- **Staff responsive:** Usa !important em mobile-responsive.css para sobrescrever inline styles
- **Media queries staff:** 900px (1 col), 768px (mobile), 480px (small), 769-1024px (tablet)

---

## 🎯 Próximas Prioridades

1. **Staff dinâmico** - Carregar 2 barbeiros do backend + IDs únicos
2. **Admin panel** - Editar staff + serviços + conteúdo
3. **Otimização** - Minify CSS/JS, asset lazy loading
4. **Testes** - Unit tests para booking modal, API calls
