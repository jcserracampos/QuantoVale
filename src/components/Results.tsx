// Componente de Resultados: Tabela + Gráfico
// Suporte a métodos dinâmicos por estágio com ponderação

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MinusCircle,
  FileJson,
  FileSpreadsheet,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useState } from 'react';
import type { ValuationResult, Estagio } from '@/types/valuation';
import { formatarBRL, formatarUSD, formatarNumeroGrande, formatarUSDGrande } from '@/utils/formulas';

interface Props {
  results: ValuationResult[];
  valorMedio: number;
  valorMediano: number;
  valorPonderado: number;
  range: { min: number; max: number };
  metodologiaRecomendada: string;
  postMoney: number;
  isCalculating: boolean;
  estagio: Estagio;
  investimento: number;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

// Cores para cada método
const CORES: Record<string, string> = {
  'Múltiplos ARR': '#3b82f6',    // blue-500
  'Múltiplos EBITDA': '#10b981', // emerald-500
  'DCF': '#8b5cf6',              // violet-500
  'Berkus': '#f59e0b',           // amber-500
  'Scorecard': '#ec4899',        // pink-500
  'Patrimônio Líquido': '#6366f1', // indigo-500
};

// Ícone de confiança
function ConfiancaIcon({ nivel }: { nivel: 'Alta' | 'Média' | 'Baixa' }) {
  switch (nivel) {
    case 'Alta':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'Média':
      return <MinusCircle className="w-4 h-4 text-yellow-500" />;
    case 'Baixa':
      return <AlertCircle className="w-4 h-4 text-red-500" />;
  }
}

// Card de resumo
function SummaryCard({
  title,
  value,
  subtitle,
  highlight = false,
  variant = 'default',
}: {
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
  variant?: 'default' | 'success' | 'warning';
}) {
  const bgClasses = {
    default: highlight
      ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
      : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
    success: 'bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700',
  };

  const textClasses = {
    default: highlight ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white',
    success: 'text-green-700 dark:text-green-400',
    warning: 'text-yellow-700 dark:text-yellow-400',
  };

  return (
    <div className={`p-4 rounded-lg ${bgClasses[variant]}`}>
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p className={`text-2xl font-bold ${textClasses[variant]}`}>
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

// Linha de assunções expansível
function AssuncoesRow({ assuncoes }: { assuncoes?: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!assuncoes || assuncoes.length === 0) return null;

  return (
    <tr className="bg-gray-50 dark:bg-gray-800/50">
      <td colSpan={6} className="px-4 py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{isOpen ? 'Ocultar' : 'Ver'} premissas ({assuncoes.length})</span>
        </button>
        {isOpen && (
          <ul className="mt-2 ml-4 text-xs text-gray-600 dark:text-gray-400 space-y-1">
            {assuncoes.map((a, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-gray-400">•</span>
                {a}
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  );
}

export function Results({
  results,
  valorMedio,
  valorMediano,
  valorPonderado,
  range,
  metodologiaRecomendada,
  postMoney,
  isCalculating,
  estagio,
  investimento,
  onExportJSON,
  onExportCSV,
}: Props) {
  // Dados para o gráfico (apenas métodos aplicáveis)
  const chartData = results
    .filter((r) => r.aplicavel && r.valorBRL > 0)
    .map((r) => ({
      metodo: r.metodo.replace('Múltiplos ', '').replace('Patrimônio Líquido', 'Patrimônio'),
      valor: r.valorBRL / 1e6,
      fill: CORES[r.metodo] || '#6b7280',
      peso: r.peso,
    }));

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="font-medium text-gray-900 dark:text-white">{data.metodo}</p>
          <p className="text-primary-600 dark:text-primary-400">
            R$ {data.valor.toFixed(2)}M
          </p>
          <p className="text-xs text-gray-500">
            Peso: {(data.peso * 100).toFixed(0)}%
          </p>
        </div>
      );
    }
    return null;
  };

  // Contagem de métodos aplicáveis
  const metodosAplicaveis = results.filter(r => r.aplicavel).length;
  const metodosComValor = results.filter(r => r.aplicavel && r.valorBRL > 0).length;

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Resultado da Análise
          </h2>
          {isCalculating && (
            <span className="text-sm text-gray-500 animate-pulse">Calculando...</span>
          )}
        </div>
        {/* Botões de exportação */}
        <div className="flex gap-2">
          <button
            onClick={onExportJSON}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Exportar JSON"
          >
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button
            onClick={onExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Exportar CSV"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Badge do estágio */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600 dark:text-gray-400">Estágio:</span>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
          {estagio}
        </span>
        <span className="text-sm text-gray-500">
          ({metodosComValor} de {metodosAplicaveis} métodos aplicáveis)
        </span>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Valuation Ponderado"
          value={formatarNumeroGrande(valorPonderado)}
          subtitle={formatarUSDGrande(valorPonderado / 5.15)}
          highlight
        />
        {investimento > 0 && (
          <SummaryCard
            title="Post-Money"
            value={formatarNumeroGrande(postMoney)}
            subtitle={`+ R$ ${(investimento / 1e6).toFixed(2)}M investimento`}
            variant="success"
          />
        )}
        <SummaryCard
          title="Range"
          value={`${formatarNumeroGrande(range.min)} - ${formatarNumeroGrande(range.max)}`}
        />
        <SummaryCard
          title="Média Simples"
          value={formatarNumeroGrande(valorMedio)}
          subtitle={`Mediana: ${formatarNumeroGrande(valorMediano)}`}
        />
      </div>

      {/* Recomendação */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Metodologia Recomendada para {estagio}:
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {metodologiaRecomendada}
            </p>
          </div>
        </div>
      </div>

      {/* Gráfico de Barras */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Comparativo de Metodologias (em milhões R$)
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 50)}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `${v}M`} />
              <YAxis
                type="category"
                dataKey="metodo"
                width={90}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Tabela Detalhada */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                Método
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                Valor (BRL)
              </th>
              <th className="text-right py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                Valor (USD)
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                Peso
              </th>
              <th className="text-center py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                Confiança
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                Detalhes
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <>
                <tr
                  key={result.metodo}
                  className={`border-b border-gray-100 dark:border-gray-800 ${
                    !result.aplicavel
                      ? 'opacity-40 bg-gray-50 dark:bg-gray-900'
                      : result.valorBRL > 0
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                      : 'opacity-60'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor: result.aplicavel ? CORES[result.metodo] : '#9ca3af',
                        }}
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {result.metodo}
                        </span>
                        {!result.aplicavel && (
                          <span className="ml-2 text-xs text-gray-500">(N/A)</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                    {result.valorBRL > 0 ? formatarBRL(result.valorBRL) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-400">
                    {result.valorUSD > 0 ? formatarUSD(result.valorUSD) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {result.aplicavel && result.peso > 0 ? (
                      <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium">
                        {(result.peso * 100).toFixed(0)}%
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <ConfiancaIcon nivel={result.confianca} />
                      <span className="text-gray-600 dark:text-gray-400 text-xs">
                        {result.confianca}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs max-w-xs truncate">
                    {result.detalhes}
                  </td>
                </tr>
                {result.aplicavel && result.assuncoes && result.assuncoes.length > 0 && (
                  <AssuncoesRow key={`${result.metodo}-assuncoes`} assuncoes={result.assuncoes} />
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <p className="text-xs text-red-700 dark:text-red-300">
          <strong>Aviso:</strong> Valores estimados para fins de referência. Esta análise não constitui
          assessoria financeira ou garantia de valor real. Consulte profissionais qualificados para avaliação formal.
        </p>
      </div>
    </div>
  );
}
