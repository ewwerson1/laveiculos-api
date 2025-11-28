const Car = require("../models/Car");
const Client = require("../models/Client"); // Importar o modelo Client para buscar dados
const axios = require('axios'); // Para fazer chamadas internas (se necessário)
const Rent = require('../models/Rent'); // Importar Rent para a finalização

// Defina a URL base da sua API para chamadas internas
const API = "https://laveiculos-api-1.onrender.com/api";

// -----------------------------------------------------
// FUNÇÃO: ENTRAR EM MANUTENÇÃO
// Mantém o acumulador vitalício (car.gastoManutencao) intocado.
// -----------------------------------------------------
exports.entrarEmManutencao = async (req, res) => {
    const { id } = req.params;
    const { status, cliente } = req.body; 

    if (status !== "Manutenção") {
        return res.status(400).json({ error: "Use a rota de finalização para sair da manutenção." });
    }

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ error: "Carro não encontrado" });

    if (car.status === "Manutenção") {
        return res.status(400).json({ error: "Carro já está em manutenção." });
    }

    const agora = new Date();

    // ❌ REMOVIDO: car.gastoManutencao = 0; // Se é vitalício, NÃO ZERA!
    
    car.dataEntradaManutencao = agora;
    car.dataSaidaManutencao = null;

    // O gasto será o valor de car.gastoManutencao antes desta entrada
    // ou 0, para que addMaintenanceCost ou finalizarManutencao o preencha
    car.manutencoes.push({
        entrada: agora,
        saida: null,
        gasto: 0, // Será atualizado por addMaintenanceCost ou finalizarManutencao
        gastoLocadora: 0,
        gastoCliente: 0,
        cliente: cliente || null
    });

    car.status = status;
    car.markModified("manutencoes");
    await car.save();

    res.json(car);
};

// -----------------------------------------------------
// FUNÇÃO: FINALIZAR MANUTENÇÃO
// Atualiza o histórico e soma os custos finais ao acumulador vitalício (car.gastoManutencao).
// -----------------------------------------------------
exports.finalizarManutencao = async (req, res) => {
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
    const custosAdicionais = custoCliente + custoLocadora; // Custos da modal (saída)

    const ultimaManutencao = car.manutencoes[car.manutencoes.length - 1];
    
    if (ultimaManutencao) {
        // 1. Acumula os custos desta saída no campo VITALÍCIO do carro
        car.gastoManutencao = (car.gastoManutencao || 0) + custosAdicionais;
        
        // 2. Atualiza o histórico (Aqui você pode escolher: o custo TOTAL da ocorrencia ou o vitalício)
        // Opção A: Custo total acumulado do carro (Vitalício, conforme sua preferência no `gastoManutencao` do carro)
        // ultimaManutencao.gasto = car.gastoManutencao;
        
        // Opção B: Custo TOTAL desta OCORRÊNCIA de manutenção (preferencial para o frontend somar)
        // Para que o frontend some corretamente, o histórico deve registrar apenas o gasto desta ocorrência.
        ultimaManutencao.gasto = ultimaManutencao.gasto + custosAdicionais; // Soma o que foi acumulado + o que veio da modal

        ultimaManutencao.saida = agora;
        ultimaManutencao.gastoLocadora = (ultimaManutencao.gastoLocadora || 0) + custoLocadora;
        ultimaManutencao.gastoCliente = (ultimaManutencao.gastoCliente || 0) + custoCliente;


        console.log(`[DEBUG] Finalizando Manutenção: Custo TOTAL DESTA OCORRÊNCIA: ${ultimaManutencao.gasto}, Vitalício no Carro: ${car.gastoManutencao}`);
        
    } else {
        return res.status(500).json({ error: "Erro: Histórico de manutenção incompleto." });
    }

    // 3. Atualiza o status
    car.status = novoStatus;
    car.dataSaidaManutencao = agora;
    // ❌ REMOVIDO: car.gastoManutencao = 0; // NUNCA ZERA SE FOR VITALÍCIO!


    // Registrar débito do cliente (Mantido)
    if (custoCliente > 0) {
        
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


    car.markModified("manutencoes");
    await car.save();

    res.json(car);
};


// -----------------------------------------------------
// FUNÇÃO: ADD MAINTENANCE COST
// Acumula o valor no campo VITALÍCIO do carro.
// -----------------------------------------------------
exports.addMaintenanceCost = async (req, res) => {
    const { id } = req.params;
    const { valor } = req.body;
    const valorNum = Number(valor || 0);

    const car = await Car.findById(id);
    if (!car) return res.status(404).json({ error: "Carro não encontrado" });

    if (car.status !== "Manutenção") {
        return res.status(400).json({ error: "Carro não está em manutenção" });
    }

    // 1. Acumula no campo VITALÍCIO
    car.gastoManutencao = (car.gastoManutencao || 0) + valorNum; 

    // 2. Acumula o custo na ocorrência atual do histórico (Para que o frontend some corretamente)
    const ultimaManutencao = car.manutencoes[car.manutencoes.length - 1];
    if(ultimaManutencao){
        ultimaManutencao.gasto = (ultimaManutencao.gasto || 0) + valorNum;
        car.markModified("manutencoes");
    }

    await car.save();

    res.json(car);
};