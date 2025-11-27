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
exports.listarClientePorId = async (req, res) => {
  try {
    const cliente = await Client.findById(req.params.id).populate("alugueis");
    if (!cliente) return res.status(404).json({ mensagem: "Cliente não encontrado." });
    res.json(cliente);
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao buscar cliente." });
  }
};

// Criar novo cliente
exports.criarCliente = async (req, res) => {
  try {
    const { nome, email, telefone, cpf } = req.body;
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
      { new: true }
    );
    if (!cliente) return res.status(404).json({ mensagem: "Cliente não encontrado." });
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
    if (!cliente) return res.status(404).json({ mensagem: "Cliente não encontrado." });
    res.json({ mensagem: "Cliente excluído com sucesso." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensagem: "Erro ao excluir cliente." });
  }
};
