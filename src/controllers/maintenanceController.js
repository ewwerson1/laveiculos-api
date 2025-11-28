const Car = require("../models/Car");
const Client = require("../models/Client"); // Importar o modelo Client para buscar dados
const axios = require('axios'); // Para fazer chamadas internas (se necessário)

// Defina a URL base da sua API para chamadas internas (necessário para a função de adicionar manutenção ao cliente)
const API = "https://laveiculos-api-1.onrender.com/api";

// Função única para ENTRAR EM MANUTENÇÃO (Mantida do original)
exports.entrarEmManutencao = async (req, res) => {
    const { id } = req.params;
    const { status, cliente } = req.body; // 👈 AGORA SIM

    if (status !== "Manutenção") {
        return res.status(400).json({ error: "Use a rota de finalização para sair da manutenção." });
    }

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ error: "Carro não encontrado" });

    if (car.status === "Manutenção") {
        return res.status(400).json({ error: "Carro já está em manutenção." });
    }

    const agora = new Date();

    car.gastoManutencao = 0;
    car.dataEntradaManutencao = agora;
    car.dataSaidaManutencao = null;

    // Agora 'cliente' existe e será salvo corretamente
    car.manutencoes.push({
        entrada: agora,
        saida: null,
        gasto: 0,
        gastoLocadora: 0,
        gastoCliente: 0,
        cliente: cliente || null // 👈 GARANTE QUE SALVA ALGO
    });

    car.status = status;
    car.markModified("manutencoes");
    await car.save();

    res.json(car);
};

// Função única para FINALIZAR MANUTENÇÃO (Substitui a lógica de SAIR)
// Rota POST /api/carro/:id/manutencao/saidaexports.finalizarManutencao = async (req, res) => {
    const { id: carroId } = req.params;
    const { status: novoStatus, gastoLocadora, gastoCliente } = req.body;

    if (novoStatus === "Manutenção") {
        return res.status(400).json({ error: "Use a rota de entrada para iniciar a manutenção." });
    }
    
    const car = await Car.findById(carroId);
    if (!car) return res.status(404).json({ error: "Carro não encontrado" });
    
    if (car.status !== "Manutenção") {
        return res.status(400).json({ error: "Carro não está em manutenção para ser finalizada." });
    }

    const agora = new Date();
    const custoCliente = Number(gastoCliente || 0);
    const custoLocadora = Number(gastoLocadora || 0);
    const somaCustos = custoCliente + custoLocadora;

    // Incrementa o gastoManutencao
    car.gastoManutencao = (car.gastoManutencao || 0) + somaCustos;
    console.log(`[DEBUG] Novo gastoManutencao do carro ${carroId}: ${car.gastoManutencao}`);

    // Atualiza o último item do histórico de manutenção
    const ultimaManutencao = car.manutencoes[car.manutencoes.length - 1];
    if (ultimaManutencao) {
        ultimaManutencao.saida = agora;
        ultimaManutencao.gasto = car.gastoManutencao; // total acumulado
        ultimaManutencao.gastoLocadora = (ultimaManutencao.gastoLocadora || 0) + custoLocadora;
        ultimaManutencao.gastoCliente = (ultimaManutencao.gastoCliente || 0) + custoCliente;

        console.log(`[DEBUG] Atualizando manutenção: gastoLocadora=${ultimaManutencao.gastoLocadora}, gastoCliente=${ultimaManutencao.gastoCliente}, total=${ultimaManutencao.gasto}`);
    } else {
        return res.status(500).json({ error: "Erro: Histórico de manutenção incompleto." });
    }

    // Registrar débito do cliente
    if (custoCliente > 0) {
        const Rent = require('../models/Rent');
        const ultimoAluguel = await Rent.findOne({ carroId }).sort({ inicio: -1 });

        if (ultimoAluguel && ultimoAluguel.clienteId) {
            const clienteId = ultimoAluguel.clienteId;
            const manutencaoId = ultimaManutencao._id;

            try {
                await axios.put(`${API}/clientes/${clienteId}/manutencao-debito`, {
                    carroId,
                    manutencaoId,
                    valorDevido: custoCliente,
                });
                console.log(`[DEBUG] Débito de R$${custoCliente} registrado para cliente ${clienteId}`);
            } catch (error) {
                console.error("Erro ao registrar manutenção no cliente:", error.response?.data || error.message);
            }
        } else {
            console.warn(`[WARN] Cliente não identificado para débito de R$ ${custoCliente}`);
        }
    }

    // Finaliza manutenção
    car.status = novoStatus;
    car.dataSaidaManutencao = agora;

    car.markModified("manutencoes");
    await car.save();

    res.json(car);
};


// Se você ainda quiser uma rota para ADICIONAR CUSTOS durante a manutenção, mantenha esta.
// Caso contrário, remova-a, pois o fluxo foi simplificado para registrar os custos apenas na saída.
exports.addMaintenanceCost = async (req, res) => {
    const { id } = req.params;
    const { valor } = req.body;

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ error: "Carro não encontrado" });

    if (car.status !== "Manutenção") {
        return res.status(400).json({ error: "Carro não está em manutenção" });
    }

    car.gastoManutencao += valor; // Acumula no campo temporário

    // NÃO ATUALIZA O HISTÓRICO AQUI, APENAS NA SAÍDA.
    // O campo 'gastoManutencao' é o acumulador.
    
    await car.save();

    res.json(car);
};