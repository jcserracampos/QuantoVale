// Tipos para Calculadora de Valuation SaaS/Startups BR

// Setores disponíveis com múltiplos de mercado BR 2026
export type Setor =
  | 'SaaS/Tech'
  | 'Fintech'
  | 'E-commerce'
  | 'Marketplace'
  | 'EdTech'
  | 'HealthTech'
  | 'LogTech'
  | 'AgTech'
  | 'Outro';

// Estágios de maturidade da startup
export type Estagio =
  | 'Pre-seed'
  | 'Seed'
  | 'Early-stage'
  | 'Growth'
  | 'Scale-up'
  | 'Late-stage';

// Estrutura do formulário
export interface ValuationFormData {
  basic: {
    name?: string;
    setor: Setor;
    estagio: Estagio;
  };
  financeiro: {
    mrr: number;           // Monthly Recurring Revenue (R$)
    arr: number;           // Annual Recurring Revenue (computed: mrr * 12)
    receitaTTM: number;    // Receita últimos 12 meses
    ebitda: number;        // EBITDA anual
    churn: number;         // Churn mensal (%)
    clientes: number;      // Número de clientes ativos
  };
  projecoes: {
    crescimento3y: number; // Taxa crescimento anual 3 anos (%)
    wacc: number;          // Weighted Average Cost of Capital (%)
    perpetuo: number;      // Taxa de crescimento perpétuo (%)
  };
  ajustes: {
    capexPct: number;      // CapEx como % da receita
    ltvCac: number;        // Ratio LTV/CAC
    equipeScore: number;   // Score da equipe (0-100)
  };
}

// Múltiplos por setor (dados BR 2026)
export interface MultiploSetor {
  min: number;
  max: number;
  avg: number;
  ebitdaMin?: number;
  ebitdaMax?: number;
}

// Resultado de cada método de valuation
export interface ValuationResult {
  metodo: 'Múltiplos ARR' | 'Múltiplos EBITDA' | 'DCF' | 'Berkus';
  valorBRL: number;
  valorUSD: number;
  confianca: 'Alta' | 'Média' | 'Baixa';
  detalhes?: string;
}

// Resultado completo da análise
export interface ValuationAnalysis {
  id?: string;
  userId?: string;
  inputs: ValuationFormData;
  results: ValuationResult[];
  valorMedio: number;
  valorMediano: number;
  range: {
    min: number;
    max: number;
  };
  createdAt?: Date;
  metodologiaRecomendada: string;
}

// Estrutura para salvar no PocketBase
export interface PocketBaseValuation {
  id?: string;
  userId: string;
  inputs: string;    // JSON stringified
  results: string;   // JSON stringified
  created?: string;
  updated?: string;
}

// Estado de autenticação
export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    email: string;
    name?: string;
  } | null;
  token?: string;
}

// Props para componentes
export interface AccordionSectionProps {
  title: string;
  icon?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

// Dados para gráfico
export interface ChartData {
  metodo: string;
  valor: number;
  fill: string;
}

// Constantes de taxa de câmbio (atualizar periodicamente)
export const EXCHANGE_RATE_USD_BRL = 5.15; // Taxa média 2026
