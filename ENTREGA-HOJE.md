# 🎯 PRÓXIMOS PASSOS - ENTREGA HOJE

**Hora:** 14:00 (1 Jan 2026)  
**Deadline:** 18:00 (mesma data)  
**Status:** 80% pronto

---

## ⚡ TAREFAS CRÍTICAS (Ordem)

### 1️⃣ **Scroll Anchor Mobile** ✅

- ✅ Código: 90px translateY adicionado
- ✅ Testa: Clica "Marcar Agora" → deve descer para section certa
- ⏳ **Próximo**: Hard refresh (Ctrl+Shift+R) e verificar

### 2️⃣ **Google My Business** (15 min) 🔴 CRITICAL

```
1. Ir para: https://business.google.com
2. Clica "Criar Negócio"
3. Preenche:
   - Nome: 24.7 Barbearia
   - Endereço: Rua Cap. Leitão 84B, Almada, 2800-133
   - Telefone: +351 963 988 807
   - Website: https://247barbearia.pt
   - Foto fachada + 5 serviços
4. Verifica no Google Maps
```

### 3️⃣ **Google Search Console** (10 min) 🔴 CRITICAL

```
1. Ir para: https://search.google.com/search-console
2. Add property: https://247barbearia.pt
3. Verifica ownership (copia meta tag para <head>)
4. Submete sitemap.xml
5. Verifica "Coverage"
```

### 4️⃣ **Teste Final E2E** (20 min)

#### Mobile

- [ ] Abre site em iPhone/Android
- [ ] Clica "Marcar Agora" → scroll correto?
- [ ] Abre menu → fecha menu
- [ ] Completa booking (até ao passo 3)
- [ ] Verifica email de confirmação

#### Desktop

- [ ] Abre Chrome (desktop)
- [ ] Testa todos os anchor links
- [ ] Abre DevTools → verifica 0 erros console
- [ ] Testa booking completo

### 5️⃣ **Deploy Final** (5 min)

```bash
# Frontend (GitHub Pages - automático)
git add .
git commit -m "SEO + Scroll 90px final"
git push

# Backend (Render - automático no push)
# Verifica: https://two4-7-barbearia.onrender.com/api/site-settings
```

---

## 📋 QA CHECKLIST

### Frontend ✅

- [x] Hero com imagem dinâmica
- [x] Services grid com preços
- [x] Booking modal 3-step
- [x] Mobile menu funciona
- [x] Anchor scroll 90px
- [x] Sem erros console
- [x] Sem CSS warnings

### Backend ✅

- [x] API respondendo (GET /site-settings)
- [x] Bookings salva em BD
- [x] Email enviado (Resend)
- [x] Admin login funciona
- [x] Validações robustas

### SEO ⏳

- [ ] Google My Business criado
- [ ] Search Console verificado
- [ ] JSON-LD ativo
- [ ] Sitemap.xml submeto
- [ ] 0 broken links

---

## 🚀 DEPLOY CHECKLIST

```
Frontend (GitHub Pages):
✅ index.html validado
✅ CSS sem erros
✅ JS sem console errors
✅ Mobile responsive
✅ Cache buster ativo

Backend (Render):
✅ .env completo
✅ MongoDB connection OK
✅ Resend API key ok
✅ CORS configurado
✅ JWT secrets definidos

DNS/Domain:
✅ 247barbearia.pt → GitHub Pages
✅ SSL/HTTPS ativo
✅ Email DNS MX records

Database:
✅ MongoDB backup automático
✅ Collections criadas
✅ Indexes definidos
```

---

## ⏱️ TIMELINE

| Hora  | Tarefa                       | Tempo  |
| ----- | ---------------------------- | ------ |
| 14:00 | Scroll anchor + teste mobile | 10 min |
| 14:10 | Google My Business setup     | 15 min |
| 14:25 | Search Console config        | 10 min |
| 14:35 | QA final E2E                 | 20 min |
| 14:55 | Deploy final                 | 5 min  |
| 15:00 | **PRONTO PARA ENTREGAR** ✅  | --     |

---

## 🎁 BÓNUS (Se tempo): Semana 2

- [ ] Implementar PWA completo (offline)
- [ ] Testes automatizados (Cypress)
- [ ] Analytics detalhadas (Google)
- [ ] Otimize fotos (WebP)
- [ ] Admin dashboard melhorado

---

**Confiança:** 95% que vai dar tudo pronto hoje ✅
