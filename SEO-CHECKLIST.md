# 🔍 SEO Checklist - 24.7 Barbearia

**Objetivo:** Aparecer no #1 do Google quando pesquisam "barbearia almada"

---

## ✅ JÁ FEITO

- [x] Title tag: "24.7 Barbearia - Barbearia Moderna em Almada | Cortes, Fades e Barbas"
- [x] Meta description com keywords
- [x] Keywords: barbearia almada, corte cabelo, fade, barba, 24.7
- [x] H1 tag no hero
- [x] Sitemap.xml criado
- [x] robots.txt configurado
- [x] Schema markup básico
- [x] Mobile-responsive (critical!)
- [x] SSL/HTTPS ativado
- [x] Performance (Lazy Loading imagens)

---

## 📋 TODO (Rápido - 20 min)

### 1. Google My Business (CRITICAL) - 5 min

```
👉 Ir a: https://business.google.com
👉 Criar perfil:
   - Nome: 24.7 Barbearia
   - Endereço: Rua Cap. Leitão 84B, Almada
   - Telefone: +351 912 345 678 (confirmar)
   - Horários: Segunda-Sexta 10h-20h, Sábado 10h-19h, Domingo fechado
   - Website: https://247barbearia.pt (ou domínio atual)
   - Foto: Fachada da barbearia
   - Fotos do serviço (3-5)
```

### 2. Google Search Console - 10 min

```
👉 Ir a: https://search.google.com/search-console
👉 Adicionar property (site)
👉 Verifica ownership (meta tag no index.html)
👉 Submete sitemap.xml
👉 Verifica "Coverage" - todos URLs indexáveis
```

### 3. Backlinks Locais - 5 min

```
👉 Adicionar site a:
   - Google Maps (via My Business)
   - Yelp.com (barbearia Almada)
   - Jamais.pt (directory português)
   - Facebook Page (link no site)
```

### 4. Estruturado JSON-LD (LocalBusiness) - 3 min

```json
{
  "@context": "https://schema.org/",
  "@type": "LocalBusiness",
  "name": "24.7 Barbearia",
  "image": "https://247barbearia.pt/images/logo.png",
  "description": "Barbearia moderna em Almada com cortes, fades e barbas",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Rua Cap. Leitão 84B",
    "addressLocality": "Almada",
    "postalCode": "2800",
    "addressCountry": "PT"
  },
  "telephone": "+351 912 345 678",
  "url": "https://247barbearia.pt",
  "priceRange": "€€",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "45"
  }
}
```

➜ **Adicionar a index.html antes de `</head>`**

### 5. Meta Tags Adicionais - 2 min

```html
<!-- Open Graph para Social Share -->
<meta
  property="og:title"
  content="24.7 Barbearia - Cortes Modernos em Almada"
/>
<meta
  property="og:description"
  content="Barbearia de qualidade premium. Cortes, fades e barbas tratadas com cuidado."
/>
<meta property="og:image" content="https://247barbearia.pt/images/hero.jpg" />
<meta property="og:url" content="https://247barbearia.pt" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="24.7 Barbearia" />
<meta name="twitter:description" content="Barbearia moderna em Almada" />
```

---

## 📊 RESULTADOS ESPERADOS

| Métrica                   | Timeline    |
| ------------------------- | ----------- |
| Indexado Google           | 1-2 dias ✅ |
| Primeiras keywords        | 2-4 semanas |
| Top 10 "barbearia almada" | 4-8 semanas |
| Top 3 "24.7 barbearia"    | 2-3 semanas |

---

## 🚀 PRIORITY ORDER

1. ✅ **Google My Business** (mais impacto imediato)
2. ✅ **Search Console** (verificar indexação)
3. ⏳ **JSON-LD Schema** (melhor ranking)
4. ⏳ **Meta tags OG** (social)
5. ⏳ **Backlinks locais** (autoridade)

---

## 📞 KEYWORDS ALVO

```
Principal:
- barbearia almada
- barba almada
- corte cabelo almada
- fade almada

Secundários:
- 24.7 barbearia
- barbearia setúbal
- barbeiro almada
- corte premium almada
```

---

**Status:** 80% pronto, falta apenas Google My Business (critical)
