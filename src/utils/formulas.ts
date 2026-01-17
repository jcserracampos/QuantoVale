// Fórmulas de Valuation para Startups/SaaS
// Baseado em metodologias: DCF, Múltiplos de Mercado e Berkus

import type {
  Setor,
  MultiploSetor,
  ValuationFormData,
  ValuationResult,
} from '@/types/valuation';

// Múltiplos de ARR por setor - Dados Brasil 2026
// Fonte: portaldovaluation.com.br e pesquisas de mercado
export const MULTIPLOS_SETOR: Record<Setor, MultiploSetor> = {
  'SaaS/Tech': { min: 7, max: 12, avg: 9.5, ebitdaMin: 8, ebitdaMax: 15 },
  'Fintech': { min: 8, max: 15, avg: 11, ebitdaMin: 10, ebitdaMax: 18 },
  'E-commerce': { min: 1.5, max: 4, avg: 2.5, ebitdaMin: 5, ebitdaMax: 10 },
  'Marketplace': { min: 4, max: 8, avg: 6, ebitdaMin: 8, ebitdaMax: 14 },
  'EdTech': { min: 5, max: 10, avg: 7, ebitdaMin: 6, ebitdaMax: 12 },
  'HealthTech': { min: 6, max: 12, avg: 8.5, ebitdaMin: 8, ebitdaMax: 15 },
  'LogTech': { min: 4, max: 8, avg: 5.5, ebitdaMin: 6, ebitdaMax: 11 },
  'AgTech': { min: 5, max: 9, avg: 6.5, ebitdaMin: 7, ebitdaMax: 12 },
  'Outro': { min: 3, max: 7, avg: 5, ebitdaMin: 5, ebitdaMax: 10 },
};

// WACC padrão por setor (Brasil, risco-país incluído)
export const WACC_PADRAO: Record<Setor, number> = {
  'SaaS/Tech': 18,
  'Fintech': 20,
  'E-commerce': 22,
  'Marketplace': 19,
  'EdTech': 17,
  'HealthTech': 16,
  'LogTech': 21,
  'AgTech': 19,
  'Outro': 20,
};

// Taxa de câmbio USD/BRL
const USD_BRL = 5.15;

/**
 * Calcula múltiplo ajustado baseado em crescimento e churn
 * Startups com alto crescimento e baixo churn recebem múltiplos maiores
 */
export function calcularMultiploAjustado(
  setor: Setor,
  crescimento3y: number,
  churn: number
): number {
  const multiplos = MULTIPLOS_SETOR[setor];
  let multiplo = multiplos.avg;

  // Ajuste por crescimento (cada 10% acima de 20% aumenta 0.5x)
  if (crescimento3y > 20) {
    multiplo += ((crescimento3y - 20) / 10) * 0.5;
  } else if (crescimento3y < 20) {
    multiplo -= ((20 - crescimento3y) / 10) * 0.3;
  }

  // Ajuste por churn (churn abaixo de 3% é excelente)
  if (churn < 3) {
    multiplo += 1;
  } else if (churn > 5) {
    multiplo -= (churn - 5) * 0.2;
  }

  // Limitar ao range do setor
  return Math.max(multiplos.min, Math.min(multiplos.max * 1.2, multiplo));
}

/**
 * Valuation por Múltiplos de ARR
 * Método mais comum para SaaS
 */
export function calcularMultiplosARR(data: ValuationFormData): ValuationResult {
  const { setor } = data.basic;
  const { arr } = data.financeiro;
  const { crescimento3y } = data.projecoes;
  const { churn } = data.financeiro;
  const { equipeScore } = data.ajustes;

  const multiplo = calcularMultiploAjustado(setor, crescimento3y, churn);

  // Ajuste pelo score da equipe (0-100)
  const fatorEquipe = 0.7 + (equipeScore / 100) * 0.6; // Range: 0.7 a 1.3

  const valorBRL = arr * multiplo * fatorEquipe;
  const valorUSD = valorBRL / USD_BRL;

  // Determinar confiança baseado em dados disponíveis
  let confianca: 'Alta' | 'Média' | 'Baixa' = 'Média';
  if (arr > 1000000 && crescimento3y > 30) {
    confianca = 'Alta';
  } else if (arr < 500000) {
    confianca = 'Baixa';
  }

  return {
    metodo: 'Múltiplos ARR',
    valorBRL,
    valorUSD,
    confianca,
    detalhes: `Múltiplo aplicado: ${multiplo.toFixed(1)}x | Fator equipe: ${fatorEquipe.toFixed(2)}`,
  };
}

/**
 * Valuation por Múltiplos de EBITDA
 * Usado para empresas mais maduras com EBITDA positivo
 */
export function calcularMultiplosEBITDA(data: ValuationFormData): ValuationResult {
  const { setor } = data.basic;
  const { ebitda } = data.financeiro;

  const multiplos = MULTIPLOS_SETOR[setor];
  const multiplo = (multiplos.ebitdaMin! + multiplos.ebitdaMax!) / 2;

  // EBITDA negativo = método não aplicável
  if (ebitda <= 0) {
    return {
      metodo: 'Múltiplos EBITDA',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: 'EBITDA negativo - método não aplicável',
    };
  }

  const valorBRL = ebitda * multiplo;
  const valorUSD = valorBRL / USD_BRL;

  return {
    metodo: 'Múltiplos EBITDA',
    valorBRL,
    valorUSD,
    confianca: 'Alta',
    detalhes: `Múltiplo EBITDA: ${multiplo.toFixed(1)}x`,
  };
}

/**
 * DCF Simplificado (Discounted Cash Flow)
 * Projeta FCF por 3 anos + valor terminal
 */
export function calcularDCF(data: ValuationFormData): ValuationResult {
  const { ebitda, arr } = data.financeiro;
  const { crescimento3y, wacc, perpetuo } = data.projecoes;
  const { capexPct } = data.ajustes;

  // Alíquota IR Brasil (simplificada)
  const aliquotaIR = 0.34;

  // FCF Ano 1 = EBITDA * (1 - IR) - CapEx
  const fcf1 = ebitda * (1 - aliquotaIR) - (arr * capexPct / 100);

  // Se FCF negativo, usar projeção otimista
  const fcfBase = fcf1 > 0 ? fcf1 : ebitda * 0.1;

  // Projetar FCF para anos 2-4
  const taxaCrescimento = crescimento3y / 100;
  const fcf2 = fcfBase * (1 + taxaCrescimento);
  const fcf3 = fcf2 * (1 + taxaCrescimento);
  const fcf4 = fcf3 * (1 + taxaCrescimento * 0.7); // Desacelera no ano 4

  // Valor Terminal (Gordon Growth)
  const waccDecimal = wacc / 100;
  const perpetuoDecimal = perpetuo / 100;

  // Evitar divisão por zero ou negativo
  const denominador = waccDecimal - perpetuoDecimal;
  if (denominador <= 0.01) {
    return {
      metodo: 'DCF',
      valorBRL: 0,
      valorUSD: 0,
      confianca: 'Baixa',
      detalhes: 'WACC deve ser maior que taxa perpétua',
    };
  }

  const valorTerminal = fcf4 * (1 + perpetuoDecimal) / denominador;

  // Valor Presente de cada fluxo
  const pv1 = fcfBase / Math.pow(1 + waccDecimal, 1);
  const pv2 = fcf2 / Math.pow(1 + waccDecimal, 2);
  const pv3 = fcf3 / Math.pow(1 + waccDecimal, 3);
  const pvTerminal = valorTerminal / Math.pow(1 + waccDecimal, 3);

  const valorBRL = pv1 + pv2 + pv3 + pvTerminal;
  const valorUSD = valorBRL / USD_BRL;

  return {
    metodo: 'DCF',
    valorBRL: Math.max(0, valorBRL),
    valorUSD: Math.max(0, valorUSD),
    confianca: fcf1 > 0 ? 'Média' : 'Baixa',
    detalhes: `WACC: ${wacc}% | Perpétuo: ${perpetuo}% | TV: R$ ${(valorTerminal/1000000).toFixed(1)}M`,
  };
}

/**
 * Método Berkus
 * Para startups early-stage, max USD 2.5M por fator (5 fatores)
 * Valor máximo total: USD 12.5M (pré-revenue) ou USD 20M (com tração)
 */
export function calcularBerkus(data: ValuationFormData): ValuationResult {
  const { estagio } = data.basic;
  const { equipeScore, ltvCac } = data.ajustes;
  const { mrr, clientes } = data.financeiro;

  // Fator máximo por categoria (USD)
  const maxPorFator = 2500000;

  // 1. Ideia Sólida (baseado no setor e potencial)
  const fatorIdeia = maxPorFator * 0.8;

  // 2. Protótipo/Produto (baseado no estágio)
  const estagioMultiplo: Record<string, number> = {
    'Pre-seed': 0.3,
    'Seed': 0.5,
    'Early-stage': 0.7,
    'Growth': 0.9,
    'Scale-up': 1.0,
    'Late-stage': 1.0,
  };
  const fatorPrototipo = maxPorFator * (estagioMultiplo[estagio] || 0.5);

  // 3. Equipe (baseado no equipeScore)
  const fatorEquipe = maxPorFator * (equipeScore / 100);

  // 4. Relações Estratégicas (proxy: LTV/CAC)
  const fatorRelacoes = maxPorFator * Math.min(1, ltvCac / 5);

  // 5. Tração (baseado em MRR e clientes)
  let fatorTracao = 0;
  if (mrr > 0) {
    // Normaliza: MRR de 100k = 100% do fator
    fatorTracao = maxPorFator * Math.min(1, mrr / 100000);
    // Bonus por número de clientes
    if (clientes > 100) {
      fatorTracao *= 1.2;
    }
  }

  const valorUSD = fatorIdeia + fatorPrototipo + fatorEquipe + fatorRelacoes + fatorTracao;
  const valorBRL = valorUSD * USD_BRL;

  // Berkus é mais confiável para early-stage
  let confianca: 'Alta' | 'Média' | 'Baixa' = 'Média';
  if (estagio === 'Pre-seed' || estagio === 'Seed') {
    confianca = 'Alta';
  } else if (estagio === 'Scale-up' || estagio === 'Late-stage') {
    confianca = 'Baixa';
  }

  return {
    metodo: 'Berkus',
    valorBRL,
    valorUSD,
    confianca,
    detalhes: `Ideia: $${(fatorIdeia/1e6).toFixed(1)}M | Produto: $${(fatorPrototipo/1e6).toFixed(1)}M | Equipe: $${(fatorEquipe/1e6).toFixed(1)}M`,
  };
}

/**
 * Calcula todos os métodos e retorna análise completa
 */
export function calcularValuationCompleto(data: ValuationFormData): {
  results: ValuationResult[];
  valorMedio: number;
  valorMediano: number;
  range: { min: number; max: number };
  metodologiaRecomendada: string;
} {
  const results: ValuationResult[] = [
    calcularMultiplosARR(data),
    calcularMultiplosEBITDA(data),
    calcularDCF(data),
    calcularBerkus(data),
  ];

  // Filtrar resultados válidos (valor > 0)
  const valoresValidos = results
    .filter(r => r.valorBRL > 0)
    .map(r => r.valorBRL);

  if (valoresValidos.length === 0) {
    return {
      results,
      valorMedio: 0,
      valorMediano: 0,
      range: { min: 0, max: 0 },
      metodologiaRecomendada: 'Dados insuficientes para cálculo',
    };
  }

  // Calcular estatísticas
  const valorMedio = valoresValidos.reduce((a, b) => a + b, 0) / valoresValidos.length;

  const sorted = [...valoresValidos].sort((a, b) => a - b);
  const valorMediano = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const range = {
    min: Math.min(...valoresValidos),
    max: Math.max(...valoresValidos),
  };

  // Recomendar metodologia baseado no estágio
  let metodologiaRecomendada: string;
  const { estagio } = data.basic;
  const { ebitda, arr } = data.financeiro;

  if (estagio === 'Pre-seed' || estagio === 'Seed') {
    metodologiaRecomendada = 'Berkus (recomendado para early-stage)';
  } else if (ebitda > 0 && arr > 5000000) {
    metodologiaRecomendada = 'Múltiplos EBITDA + DCF (empresa madura)';
  } else {
    metodologiaRecomendada = 'Múltiplos ARR (padrão SaaS)';
  }

  return {
    results,
    valorMedio,
    valorMediano,
    range,
    metodologiaRecomendada,
  };
}

/**
 * Formata valor em moeda brasileira
 */
export function formatarBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

/**
 * Formata valor em dólar
 */
export function formatarUSD(valor: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor);
}

/**
 * Formata número grande (milhões/bilhões)
 */
export function formatarNumeroGrande(valor: number): string {
  if (valor >= 1e9) {
    return `R$ ${(valor / 1e9).toFixed(2)}B`;
  }
  if (valor >= 1e6) {
    return `R$ ${(valor / 1e6).toFixed(2)}M`;
  }
  if (valor >= 1e3) {
    return `R$ ${(valor / 1e3).toFixed(0)}K`;
  }
  return formatarBRL(valor);
}
