# 🚀 Guia de Otimização - 24.7 Barbearia

## ✅ Melhorias Implementadas

### 1. **SEO Avançado**

- ✅ Meta tags completas (description, OG, Twitter Card)
- ✅ Schema.org JSON-LD (Local Business)
- ✅ Sitemap.xml
- ✅ Robots.txt
- ✅ Canonical URLs
- ✅ Google Analytics configurado

### 2. **Acessibilidade**

- ✅ ARIA labels em navegação
- ✅ Alt texts em imagens
- ✅ Semântica HTML correta
- ✅ Navegação por teclado funcional

---

## 📋 Próximos Passos (Opcionais)

### 🎯 **Google Analytics - Ativar**

**Ficheiro:** `index.html` (linha ~49)

1. Criar conta Google Analytics: https://analytics.google.com
2. Criar propriedade para 247barbearia.pt
3. Copiar o ID (formato: G-XXXXXXXXXX)
4. Substituir em:

```javascript
gtag("config", "G-XXXXXXXXXX"); // ← Substituir aqui
```

**Como ver estatísticas:**

- Visitas diárias/semanais
- Páginas mais vistas
- Origem dos visitantes (Google, Facebook, direto)
- Tempo médio no site

---

### 📦 **Minificar CSS/JS (Reduz tamanho ~40%)**

**Opção 1 - Online (mais fácil):**

1. CSS: https://cssminifier.com
   - Colar conteúdo de `index.html` (parte `<style>...</style>`)
   - Minificar
   - Substituir

2. JS: https://javascript-minifier.com
   - Minificar `js/main.js`
   - Substituir

**Opção 2 - Automático (melhor):**

```bash
npm install -g csso-cli uglify-js

# Minificar CSS inline (extrair primeiro para ficheiro)
csso input.css -o output.min.css

# Minificar JS
uglifyjs js/main.js -o js/main.min.js -c -m
```

**Ganhos esperados:**

- CSS: ~2300 linhas → ~600 linhas (73% menor)
- JS: ~1500 linhas → ~800 linhas (47% menor)
- **Total: -200KB (página carrega 30% mais rápido)**

---

### 🖼️ **Converter Imagens para WebP/AVIF**

**Porquê:** WebP é 30% menor que JPG com mesma qualidade.

**Ferramentas:**

1. **Online (fácil):**
   - https://squoosh.app (Google)
   - Arrasta imagens → WebP → Download

2. **Linha de comandos (batch):**

```bash
# Instalar cwebp (Google)
# https://developers.google.com/speed/webp/download

# Converter tudo
for file in images/*.jpg; do
  cwebp -q 85 "$file" -o "${file%.jpg}.webp"
done
```

3. **Cloudinary (automatizado):**
   - Upload em https://cloudinary.com (grátis até 25GB)
   - URLs automáticos com WebP/AVIF
   - Resize automático por device

**HTML com fallback:**

```html
<picture>
  <source srcset="image.avif" type="image/avif" />
  <source srcset="image.webp" type="image/webp" />
  <img src="image.jpg" alt="..." />
</picture>
```

**Ganhos esperados:**

- Imagens 30-50% menores
- Site carrega 2-3x mais rápido em mobile

---

### 🔧 **Lazy Loading de Imagens**

Já implementado em algumas imagens! Para todas:

```html
<!-- Antes -->
<img src="image.jpg" alt="..." />

<!-- Depois -->
<img src="image.jpg" alt="..." loading="lazy" />
```

**Onde adicionar:**

- Galeria (carousel images)
- Imagens staff section
- Background images (CSS: usar Intersection Observer)

---

### 🏎️ **Outras Otimizações**

1. **Preload Critical Assets:**

```html
<link rel="preload" href="images/logo.jpg" as="image" />
<link rel="preload" href="css/mobile-responsive.css" as="style" />
```

2. **DNS Prefetch:**

```html
<link rel="dns-prefetch" href="https://two4-7-barbearia.onrender.com" />
<link rel="dns-prefetch" href="https://www.googletagmanager.com" />
```

3. **CDN para jQuery/EmailJS:**
   Já está otimizado!

4. **Service Worker (PWA):**
   Cache offline do site (avançado)

---

## 📊 Como Medir Performance

### **Google PageSpeed Insights**

https://pagespeed web.dev

1. Colar URL: https://247barbearia.pt
2. Ver score (objetivo: >90)
3. Seguir sugestões

### **GTmetrix**

https://gtmetrix.com

- Performance Score
- Loading Time
- Total Page Size

### **Google Search Console**

https://search.google.com/search-console

- Indexação
- Ranking keywords
- Erros de crawl

---

## 🎯 Prioridades

**Impacto Alto, Esforço Baixo:**

1. ✅ Ativar Google Analytics (5 min)
2. ✅ Minificar CSS inline (10 min)
3. ✅ Adicionar loading="lazy" em todas as imagens (5 min)

**Impacto Alto, Esforço Médio:** 4. Converter imagens para WebP com Squoosh (30 min) 5. Submeter sitemap ao Google Search Console (10 min)

**Impacto Médio, Esforço Alto:** 6. Service Worker para cache offline (2-3 horas) 7. Cloudinary automático (1 hora setup)

---

## 📝 Checklist Final

- [x] Meta tags SEO
- [x] Schema.org markup
- [x] Sitemap.xml
- [x] Robots.txt
- [x] Google Analytics código
- [ ] Google Analytics ativado (precisa ID)
- [ ] CSS minificado
- [ ] JS minificado
- [ ] Imagens WebP
- [ ] Lazy loading completo
- [ ] Submissão Google Search Console

---

## 🆘 Precisa de Ajuda?

**Google Search Console:**
https://support.google.com/webmasters/answer/9128668

**Google Analytics:**
https://support.google.com/analytics

**Web Performance:**
https://web.dev/learn
