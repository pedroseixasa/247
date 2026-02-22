# Sistema de Estatísticas Mensais Agregadas

## 📋 Objetivo

Este sistema foi criado para **otimizar o espaço da base de dados** (MongoDB Atlas Free Tier: 500MB) convertendo reservas antigas em estatísticas agregadas, mantendo o histórico financeiro sem ocupar espaço desnecessário.

## 🎯 Como Funciona

### Dados Completos vs Dados Agregados

- **Últimos 12 meses**: Reservas completas guardadas na BD
- **Mais de 12 meses**: Convertidas em estatísticas mensais compactas
- **Economia**: ~99% de espaço por mês agregado

### Exemplo Prático

**Antes da agregação:**
- 500 reservas de Janeiro 2024 = ~250 KB

**Depois da agregação:**
- 1 documento de estatísticas = < 1 KB
- **Ganho**: 249 KB livres!

## 🚀 Como Usar

### 1. Agregação Manual (mês específico)

```bash
# Agregar Janeiro 2024 (mês 0 = Janeiro, 11 = Dezembro)
node aggregate-monthly-stats.js 2024 0

# Agregar e APAGAR reservas antigas
node aggregate-monthly-stats.js 2024 0 --delete
```

### 2. Agregação Automática (recomendado)

```bash
# Agrega TODOS os meses com mais de 12 meses e apaga as reservas
node aggregate-monthly-stats.js --auto
```

Este comando:
- ✅ Encontra a reserva mais antiga
- ✅ Agrega todos os meses com mais de 12 meses
- ✅ Apaga reservas antigas automaticamente
- ✅ Mantém os últimos 12 meses intactos

## 📊 O Que É Guardado

Cada mês agregado guarda:

- **Totais**: Número de reservas, receita total
- **Por Barbeiro**: Reservas e receita de cada barbeiro
- **Serviços Populares**: Top 10 serviços do mês
- **Por Dia da Semana**: Estatísticas de segunda a domingo

## 💡 Dashboard

O dashboard **automaticamente** usa dados agregados quando disponíveis:

- **Verde** 🟢: Receita Realizada (já ocorreu)
- **Azul** 🔵: Receita Prevista (futuras)
- **Badge "Agregado"**: Mostra quando dados são de estatísticas agregadas

## 🔄 Manutenção Recomendada

### Opção 1: Manual (a cada 3-6 meses)
```bash
node aggregate-monthly-stats.js --auto
```

### Opção 2: Cron Job Automático (futuro)
Configurar um cron job no Render para executar mensalmente.

## ⚠️ Avisos Importantes

1. **Backup antes de agregar**: Use `mongodump` se necessário
2. **Testar sem --delete primeiro**: Veja se as estatísticas estão corretas
3. **Não agregar mês atual**: O script só agrega meses com mais de 12 meses

## 📈 Estimativa de Crescimento

### Cenário: Barbearia com 200 reservas/mês

**Sem agregação (5 anos):**
- 200 reservas/mês × 60 meses = 12.000 reservas
- ~500 bytes cada = **6 MB** só em reservas
- + Índices + Outros dados = **~10-15 MB**

**Com agregação (5 anos):**
- Últimos 12 meses: 200 × 12 = 2.400 reservas = **1.2 MB**
- 48 meses agregados: 48 × 1 KB = **48 KB**
- **Total**: ~1.5 MB vs 10-15 MB
- **Economia**: ~85-90% de espaço!

## 🛠️ Troubleshooting

### "Nenhuma reserva encontrada"
- Mês/ano incorretos
- Não há reservas confirmadas/completadas nesse período

### "Erro ao conectar MongoDB"
- Verificar `.env` com `MONGODB_URI` correto
- Internet ativa

### Como reverter se algo correr mal?
Se apagou por engano:
1. Restaurar backup do MongoDB
2. As estatísticas agregadas ficam na collection `monthlystats`
3. Pode apagá-la manualmente se necessário

## 📝 Queries Úteis (MongoDB Atlas)

```javascript
// Ver todos os meses agregados
db.monthlystats.find({}).sort({ year: -1, month: -1 })

// Ver estatísticas de Janeiro 2024
db.monthlystats.findOne({ year: 2024, month: 0, barberId: null })

// Apagar estatísticas de um mês (se quiser refazer)
db.monthlystats.deleteOne({ year: 2024, month: 0, barberId: null })
```

## ✅ Checklist de Manutenção

- [ ] A cada 3-6 meses: executar `--auto`
- [ ] Verificar uso da BD no MongoDB Atlas
- [ ] Se > 400MB: executar agregação urgente
- [ ] Backup antes de agregações grandes

---

**Criado para**: Barbearia 24.7  
**Data**: Fevereiro 2026  
**Versão**: 1.0
