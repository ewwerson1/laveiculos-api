const Client = require("../models/Client");

// Listar todos os clientes
exports.listarClientes = async (req, res) => {
  try {
    const clientes = await Client.find();
    res.json(clientes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao listar clientes." });
  }
};

// Listar cliente por ID
// ATUALIZADO: Popula 'alugueis.aluguelId' para pegar o detalhe do aluguel
exports.listarClientePorId = async (req, res) => {
  try {
    const cliente = await Client.findById(req.params.id)
      .populate("alugueis.aluguelId")
      .populate("historicoManutencoes.carroId");
    if (!cliente)
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    res.json(cliente);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao buscar cliente." });
  }
};

// Criar novo cliente
exports.criarCliente = async (req, res) => {
  try {
    const { nome, email, telefone, cpf, validadeCnh } = req.body;
    const cliente = new Client({ nome, email, telefone, cpf, validadeCnh });
    await cliente.save();
    res.status(201).json(cliente);
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensagem: "Erro ao criar cliente.", erro: err.message });
  }
};

// Atualizar cliente
exports.atualizarCliente = async (req, res) => {
  try {
    const cliente = await Client.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // runValidators para reavaliar o pre('save')
    );
    if (!cliente)
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    res.json(cliente);
  } catch (err) {
    console.error(err);
    res.status(400).json({ mensagem: "Erro ao atualizar cliente." });
  }
};

// Excluir cliente
exports.excluirCliente = async (req, res) => {
  try {
    const cliente = await Client.findByIdAndDelete(req.params.id);
    if (!cliente)
      return res.status(404).json({ mensagem: "Cliente não encontrado." });
    res.json({ mensagem: "Cliente excluído com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao excluir cliente." });
  }
};

// NOVO: Adicionar um aluguel ao histórico do cliente
exports.adicionarAluguelAoCliente = async (req, res) => {
    try {
        const { aluguelId, statusPagamento = "quitado" } = req.body;
        const cliente = await Client.findById(req.params.id);

        if (!cliente) return res.status(404).json({ mensagem: "Cliente não encontrado." });

        cliente.alugueis.push({ aluguelId, statusPagamento });
        await cliente.save();

        res.json({ mensagem: "Aluguel adicionado ao histórico do cliente.", cliente });
    } catch (err) {
        console.error(err);
        res.status(500).json({ mensagem: "Erro ao adicionar aluguel ao cliente." });
    }
};

// NOVO: Adicionar custo de manutenção ao histórico do cliente
exports.adicionarManutencaoAoCliente = async (req, res) => {
  try {
    const { carroId, manutencaoId, valorDevido } = req.body;
    const cliente = await Client.findById(req.params.id);

    if (!cliente) return res.status(404).json({ mensagem: "Cliente não encontrado." });

    if (valorDevido > 0) {
      cliente.historicoManutencoes.push({
        carroId,
        manutencaoId,
        valorDevido,
        statusPagamento: "a_pagar",
      });
      await cliente.save();
    }

    res.json({ mensagem: "Custo de manutenção adicionado ao histórico do cliente.", cliente });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao adicionar custo de manutenção ao cliente." });
  }
};