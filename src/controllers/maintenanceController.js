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
// Rota POST /api/carro/:id/manutencao/saida
exports.finalizarManutencao = async (req, res) => {
    const { id: carroId } = req.params;
    const { status: novoStatus, gastoLocadora, gastoCliente } = req.body; // Recebe o novo status e a divisão dos custos

    if (novoStatus === "Manutenção") {
        return res.status(400).json({ error: "Use a rota de entrada para iniciar a manutenção." });
    }
    
    const car = await Car.findById(carroId);
    if (!car) return res.status(404).json({ error: "Carro não encontrado" });
    
    if (car.status !== "Manutenção") {
        return res.status(400).json({ error: "Carro não está em manutenção para ser finalizada." });
    }

    const agora = new Date();
    const totalGasto = Number(gastoLocadora || 0) + Number(gastoCliente || 0) + car.gastoManutencao;

    // 1. Atualiza o último item do histórico de manutenção do CARRO
    const ultimaManutencao = car.manutencoes[car.manutencoes.length - 1];
    
    if (ultimaManutencao) {
        ultimaManutencao.saida = agora;
        ultimaManutencao.gasto = totalGasto; // O total é a soma do que já foi acumulado (se a rota addMaintenanceCost ainda for usada) + o que foi informado no formulário
        ultimaManutencao.gastoLocadora = Number(gastoLocadora || 0) + (car.gastoManutencao || 0); // Soma o custo da locadora com os gastos temporários
        ultimaManutencao.gastoCliente = Number(gastoCliente || 0); 
    } else {
        return res.status(500).json({ error: "Erro: Histórico de manutenção incompleto." });
    }
    
    // 2. Registra o custo do cliente na ficha do CLIENTE (Se gastoCliente > 0)
    if (Number(gastoCliente) > 0) {
        // Encontrar o último aluguel para identificar o cliente (abordagem comum)
        // **IMPORTANTE:** Você precisa de acesso ao seu Rent Model ou de uma forma de saber quem alugou por último
        const Rent = require('../models/Rent'); // Assumindo que você tem o model Rent
        const ultimoAluguel = await Rent.findOne({ carroId }).sort({ inicio: -1 });

        if (ultimoAluguel && ultimoAluguel.clienteId) {
             const clienteId = ultimoAluguel.clienteId;
             const manutencaoId = ultimaManutencao._id; // O ID da sub-doc criada no array 'manutencoes'

             try {
                // Chama a rota interna do cliente para adicionar o débito (usando axios)
                // Isto assume que você tem a rota PUT /api/cliente/:id/manutencao-debito mapeada para adicionarManutencaoAoCliente
                await axios.put(`${API}/clientes/${clienteId}/manutencao-debito`, {
                    carroId: carroId,
                    manutencaoId: manutencaoId, 
                    valorDevido: Number(gastoCliente),
                });
             } catch (error) {
                 console.error("Erro ao registrar manutenção no cliente:", error.response?.data || error.message);
                 // Não falhar o fluxo, apenas logar o erro
             }
        } else {
            console.warn(`Manutenção do carro ${carroId} finalizada, mas não foi possível identificar o cliente para o débito de R$ ${gastoCliente}.`);
        }
    }

    // 3. Finaliza a manutenção no carro
    car.status = novoStatus;
    car.dataSaidaManutencao = agora;
    car.gastoManutencao = 0; // Zera o acumulador

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