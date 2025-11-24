// jobs/rentalScheduler.js
const cron = require("node-cron");
const Car = require("../models/Car");

// roda a cada minuto — ajuste se quiser rodar a cada 1 hora/dia
cron.schedule("* * * * *", async () => {
  try {
    const now = new Date();

    // encontra carros alugados cujo rentalEnd já passou
    const expirados = await Car.find({
      status: "Alugado",
      rentalEnd: { $lte: now }
    });

    if (!expirados.length) return;

    for (const carro of expirados) {
      const days = carro.rentalDays || 0;
      const valorDiaria = Number(carro.valorAluguel || 0);

      const incremento = valorDiaria * days;

      // soma faturamento
      carro.faturamento = (carro.faturamento || 0) + incremento;

      // limpa campos de aluguel temporários
      carro.rentalStart = null;
      carro.rentalEnd = null;
      carro.rentalDays = 0;

      // volta para Em espera
      carro.status = "Em espera";

      await carro.save();

      // opcional: aqui você poderia gerar um registro em outra collection (ex: Rentals/Transactions)
    }

    console.log(`[rentalScheduler] Processados ${expirados.length} aluguel(is) expirados.`);
  } catch (err) {
    console.error("Erro no rentalScheduler:", err);
  }
});
