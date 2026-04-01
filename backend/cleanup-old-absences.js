require('dotenv').config();
const mongoose = require('mongoose');
const Barber = require('./src/models/Barber');

const mongoUrl = process.env.MONGODB_URI;

async function cleanupOldAbsences() {
  try {
    console.log('🔍 Conectando à base de dados...');
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('✅ Conectado com sucesso!');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const barbers = await Barber.find({});
    console.log(`\n📋 Total de barbeiros: ${barbers.length}`);

    let totalRemoved = 0;

    for (const barber of barbers) {
      if (!barber.absences || barber.absences.length === 0) continue;

      const beforeCount = barber.absences.length;

      barber.absences = barber.absences.filter((absence) => {
        const absenceDate = new Date(absence.date);
        absenceDate.setHours(0, 0, 0, 0);
        return absenceDate >= today;
      });

      const removed = beforeCount - barber.absences.length;

      if (removed > 0) {
        await barber.save();
        console.log(
          `🗑️  ${barber.name}: Removidas ${removed} ausência(s) expirada(s)`,
        );
        totalRemoved += removed;
      }
    }

    console.log(`\n✅ Limpeza completa!`);
    console.log(`   Total de ausências removidas: ${totalRemoved}`);

    await mongoose.connection.close();
    console.log('📴 Desligado da BD');
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

cleanupOldAbsences();
