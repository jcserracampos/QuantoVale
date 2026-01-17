// Componente de Resultados: Tabela + Gráfico
// Exibe valuation calculado por diferentes metodologias

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
} from 'lucide-react';
import type { ValuationResult } from '@/types/valuation';
import { formatarBRL, formatarUSD, formatarNumeroGrande } from '@/utils/formulas';

interface Props {
  results: ValuationResult[];
  valorMedio: number;
  valorMediano: number;
  range: { min: number; max: number };
  metodologiaRecomendada: string;
  isCalculating: boolean;
  onExportJSON: () => void;
  onExportCSV: () => void;
}

// Cores para cada método
const CORES = {
  'Múltiplos ARR': '#3b82f6',    // blue-500
  'Múltiplos EBITDA': '#10b981', // emerald-500
  'DCF': '#8b5cf6',              // violet-500
  'Berkus': '#f59e0b',           // amber-500
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
}: {
  title: string;
  value: string;
  subtitle?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`p-4 rounded-lg ${
        highlight
          ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500'
          : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
      }`}
    >
      <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
      <p
        className={`text-2xl font-bold ${
          highlight ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
        }`}
      >
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
      )}
    </div>
  );
}

export function Results({
  results,
  valorMedio,
  valorMediano,
  range,
  metodologiaRecomendada,
  isCalculating,
  onExportJSON,
  onExportCSV,
}: Props) {
  // Dados para o gráfico
  const chartData = results
    .filter((r) => r.valorBRL > 0)
    .map((r) => ({
      metodo: r.metodo.replace('Múltiplos ', ''),
      valor: r.valorBRL / 1e6, // Em milhões
      fill: CORES[r.metodo as keyof typeof CORES] || '#6b7280',
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
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Valor Médio"
          value={formatarNumeroGrande(valorMedio)}
          subtitle={formatarUSD(valorMedio / 5.15)}
          highlight
        />
        <SummaryCard
          title="Valor Mediano"
          value={formatarNumeroGrande(valorMediano)}
        />
        <SummaryCard
          title="Range Mínimo"
          value={formatarNumeroGrande(range.min)}
        />
        <SummaryCard
          title="Range Máximo"
          value={formatarNumeroGrande(range.max)}
        />
      </div>

      {/* Recomendação */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Metodologia Recomendada:</strong> {metodologiaRecomendada}
        </p>
      </div>

      {/* Gráfico de Barras */}
      {chartData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Comparativo de Metodologias (em milhões R$)
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} layout="vertical">
              <XAxis type="number" tickFormatter={(v) => `${v}M`} />
              <YAxis
                type="category"
                dataKey="metodo"
                width={80}
                tick={{ fontSize: 12 }}
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
                Confiança
              </th>
              <th className="text-left py-3 px-4 font-medium text-gray-700 dark:text-gray-300">
                Detalhes
              </th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr
                key={result.metodo}
                className={`border-b border-gray-100 dark:border-gray-800 ${
                  result.valorBRL === 0
                    ? 'opacity-50'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                }`}
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor: CORES[result.metodo as keyof typeof CORES],
                      }}
                    />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {result.metodo}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-900 dark:text-white">
                  {result.valorBRL > 0 ? formatarBRL(result.valorBRL) : '-'}
                </td>
                <td className="py-3 px-4 text-right font-mono text-gray-600 dark:text-gray-400">
                  {result.valorUSD > 0 ? formatarUSD(result.valorUSD) : '-'}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center justify-center gap-1">
                    <ConfiancaIcon nivel={result.confianca} />
                    <span className="text-gray-600 dark:text-gray-400">
                      {result.confianca}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-500 dark:text-gray-400 text-xs">
                  {result.detalhes}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        * Valores estimados para fins de referência. Consulte especialistas para avaliação formal.
      </p>
    </div>
  );
}
