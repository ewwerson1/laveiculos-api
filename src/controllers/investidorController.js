const Investidor = require("../models/Investor");
const Car = require("../models/Car");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// LOGIN
exports.loginInvestidor = async (req, res) => {
  try {
    const { email, senha } = req.body;

    const investidor = await Investidor.findOne({ email });

    if (!investidor) {
      return res.status(404).json({ error: "Investidor não encontrado." });
    }

    const senhaCorreta = await bcrypt.compare(senha, investidor.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ error: "Senha incorreta." });
    }

    const token = jwt.sign(
      { id: investidor._id },
      "SEGREDO_SUPER_SEGURO_123",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login realizado com sucesso",
      token,
      investidor
    });

  } catch (e) {
    console.error("Erro login:", e);
    res.status(500).json({ error: "Erro ao realizar login" });
  }
};

exports.atualizarMeuPerfil = async (req, res) => {
  try {
    const investidor = await Investidor.findById(req.user.id);
    if (!investidor) return res.status(404).json({ error: "Investidor não encontrado" });

    // Atualiza os campos enviados no body
    Object.keys(req.body).forEach(key => {
      investidor[key] = req.body[key];
    });

    await investidor.save();

    const populado = await Investidor.findById(req.user.id).populate("carros");
    res.json(populado);

  } catch (e) {
    console.error("Erro atualizar perfil:", e);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
};


exports.listarPorId = async (req, res) => {
  try {
    const investor = await Investidor.findById(req.params.id).populate("carros");
    if (!investor) return res.status(404).json({ error: "Investidor não encontrado" });
    res.json(investor);
  } catch (err) {
    res.status(500).json({ error: "Erro ao buscar investidor" });
  }
};

// LISTAR INVESTIDORES
exports.listarInvestidores = async (req, res) => {
  try {
    const data = await Investidor.find().populate("carros");
    res.json(data);
  } catch (e) {
    console.error("Erro listar:", e);
    res.status(500).json({ error: "Erro ao listar investidores" });
  }
};


// CRIAR INVESTIDOR
exports.criarInvestidor = async (req, res) => {
  try {
    const { carros, senha, ...investidorData } = req.body;

    // Garante senha sempre presente
    const senhaFinal = senha && senha.length > 0 ? senha : "123456";

    const novoInvestidor = new Investidor({
      ...investidorData,
      senha: senhaFinal
    });

    await novoInvestidor.save();

    // Se tiver carros
    if (carros && carros.length > 0) {
      const carrosCriados = [];

      for (const c of carros) {
        const novoCarro = await Car.create({
          modelo: c.modelo,
          placa: c.placa,
          cor: c.cor,
          valorAluguel: c.valorAluguel,
          porcentagem: c.porcentagem,
          faturamento: c.faturamento || 0,
          gastoManutencao: c.gastoManutencao || 0,
          status: c.status || "Disponivel",
          investor: novoInvestidor._id, 
        });

        carrosCriados.push(novoCarro._id);
      }

      novoInvestidor.carros = carrosCriados;
      await novoInvestidor.save();
    }

    const populado = await Investidor.findById(novoInvestidor._id).populate("carros");
    res.json(populado);

  } catch (e) {
    console.error("Erro criar:", e);
    res.status(500).json({ error: "Erro ao criar investidor", details: e.message });
  }
};


// ATUALIZAR INVESTIDOR
exports.atualizarInvestidor = async (req, res) => {
  try {
    // Se estiver atualizando senha → fazer hash corretamente
    if (req.body.senha) {
      const investidor = await Investidor.findById(req.params.id);
      investidor.senha = req.body.senha;
      await investidor.save();

      return res.json(await Investidor.findById(req.params.id).populate("carros"));
    }

    const atualizado = await Investidor.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate("carros");

    if (!atualizado) {
      return res.status(404).json({ error: "Investidor não encontrado" });
    }

    res.json(atualizado);

  } catch (e) {
    console.error("Erro atualizar:", e);
    res.status(500).json({ error: "Erro ao atualizar investidor", details: e.message });
  }
};


// EXCLUIR INVESTIDOR
exports.excluirInvestidor = async (req, res) => {
  try {
    const { id } = req.params;

    const investidor = await Investidor.findById(id);
    if (!investidor) {
      return res.status(404).json({ error: "Investidor não encontrado" });
    }

    await Car.deleteMany({ investor: id });
    await investidor.deleteOne();

    res.json({ message: "Investidor e carros excluídos com sucesso" });

  } catch (error) {
    console.error("Erro excluir:", error);
    res.status(500).json({ error: "Erro ao excluir investidor" });
  }
};


// ADICIONAR CARRO
exports.adicionarCarro = async (req, res) => {
  try {
    const { investidorId } = req.params;
    const { modelo, placa, cor, valorAluguel, porcentagem } = req.body;

    const inv = await Investidor.findById(investidorId);
    if (!inv) return res.status(404).json({ error: "Investidor não encontrado." });

    const novoCarro = await Car.create({
      modelo,
      placa,
      cor,
      valorAluguel,
      porcentagem,
      faturamento: 0,
      gastoManutencao: 0,
      status: "Disponível",
      investor: investidorId
    });

    inv.carros.push(novoCarro._id);
    await inv.save();

    const populado = await Investidor.findById(investidorId).populate("carros");
    res.json(populado);

  } catch (e) {
    console.error("Erro adicionar carro:", e);
    res.status(500).json({ error: "Erro ao adicionar carro", details: e.message });
  }
};


// ATUALIZAR CARRO
exports.atualizarCarro = async (req, res) => {
  try {
    const { carroId } = req.params;
    const data = req.body;

    const carro = await Car.findById(carroId);
    if (!carro) {
      return res.status(404).json({ error: "Carro não encontrado" });
    }

    const camposPermitidos = [
      "modelo",
      "placa",
      "cor",
      "valorAluguel",
      "porcentagem",
      "faturamento",
      "gastoManutencao",
      "status",
      "rentalDays",
      "rentalStart",
      "rentalEnd",
      "investor",
    ];

    camposPermitidos.forEach(campo => {
      if (data[campo] !== undefined) {
        carro[campo] = data[campo];
      }
    });

    if (data.status) {
      if (data.status === "Alugado") {
        if (data.rentalStart) carro.rentalStart = new Date(data.rentalStart);
        if (data.rentalEnd) carro.rentalEnd = new Date(data.rentalEnd);
        if (data.rentalDays) carro.rentalDays = Number(data.rentalDays);
      } else {
        carro.rentalStart = null;
        carro.rentalEnd = null;
        carro.rentalDays = 0;
      }
    }

    await carro.save();

    res.json(carro);

  } catch (e) {
    console.error("Erro ao atualizar carro:", e);
    res.status(500).json({ error: "Erro ao atualizar carro", details: e.message });
  }
};


// EXCLUIR CARRO
exports.excluirCarro = async (req, res) => {
  try {
    const { carroId } = req.params;

    const carro = await Car.findById(carroId);
    if (!carro) return res.status(404).json({ error: "Carro não encontrado" });

    await Investidor.findByIdAndUpdate(carro.investor, {
      $pull: { carros: carro._id }
    });

    await carro.deleteOne();

    res.json({ message: "Carro removido" });

  } catch (e) {
    console.error("Erro excluir carro:", e);
    res.status(500).json({ error: "Erro ao excluir carro", details: e.message });
  }
};
