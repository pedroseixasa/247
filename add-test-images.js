// Script para adicionar imagens de teste aos serviços
// Usa no browser console do admin panel após fazer login

const testImages = {
  "Corte degradé":
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80",
  "Corte + Pintura (preto)":
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&q=80",
  "Corte Social + barba":
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=600&q=80",
  "Corte Social":
    "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&q=80",
  "Corte + Madeixas":
    "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&q=80",
  "Corte + platinado":
    "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=600&q=80",
  "Barba completa":
    "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&q=80",
  "Corte (Degradé) + Barba + sobrancelha":
    "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=600&q=80",
  "Corte criança até 7 anos":
    "https://images.unsplash.com/photo-1598880940371-c756e015faf1?w=600&q=80",
};

console.log("🖼️ Imagens de teste preparadas:");
Object.entries(testImages).forEach(([name, url]) => {
  console.log(`${name}: ${url}`);
});

console.log("\n✅ Copia estas URLs e adiciona manualmente no admin panel!");
