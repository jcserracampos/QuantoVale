// Componente de Resultados Premium - The Hero Section
// Design fintech moderno com valores em destaque

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
  ChevronDown,
  ChevronUp,
  Sparkles,
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

// Cores para cada método (emerald-based)
const CORES: Record<string, string> = {
  'Múltiplos ARR': '#34d399',
  'Múltiplos EBITDA': '#10b981',
  'DCF': '#6ee7b7',
  'Berkus': '#059669',
  'Scorecard': '#047857',
  'Patrimônio Líquido': '#065f46',
};

function ConfiancaIcon({ nivel }: { nivel: 'Alta' | 'Média' | 'Baixa' }) {
  switch (nivel) {
    case 'Alta':
      return <CheckCircle className="w-4 h-4 text-primary-400" />;
    case 'Média':
      return <MinusCircle className="w-4 h-4 text-amber-400" />;
    case 'Baixa':
      return <AlertCircle className="w-4 h-4 text-red-400" />;
  }
}

// Card de métrica
function MetricCard({
  label,
  value,
  subvalue,
  highlight = false,
  variant = 'default',
}: {
  label: string;
  value: string;
  subvalue?: string;
  highlight?: boolean;
  variant?: 'default' | 'success';
}) {
  return (
    <div
      className={`p-4 rounded-xl ${
        highlight
          ? 'bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/30'
          : variant === 'success'
          ? 'bg-emerald-500/10 border border-emerald-500/20'
          : 'bg-white/[0.03] border border-white/[0.06]'
      }`}
    >
      <p className="text-sm text-slate-400 mb-1">{label}</p>
      <p
        className={`text-xl font-bold tabular-nums ${
          highlight ? 'text-primary-400' : variant === 'success' ? 'text-emerald-400' : 'text-white'
        }`}
      >
        {value}
      </p>
      {subvalue && <p className="text-xs text-slate-500 mt-1">{subvalue}</p>}
    </div>
  );
}

// Linha de assunções expansível
function AssuncoesRow({ assuncoes }: { assuncoes?: string[] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!assuncoes || assuncoes.length === 0) return null;

  return (
    <tr className="bg-white/[0.02]">
      <td colSpan={5} className="px-4 py-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          <span>{isOpen ? 'Ocultar' : 'Ver'} premissas ({assuncoes.length})</span>
        </button>
        {isOpen && (
          <ul className="mt-2 ml-4 text-xs text-slate-500 space-y-1">
            {assuncoes.map((a, i) => (
              <li key={i} className="flex items-start gap-1">
                <span className="text-slate-600">•</span>
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
  // Dados para o gráfico
  const chartData = results
    .filter((r) => r.aplicavel && r.valorBRL > 0)
    .map((r) => ({
      metodo: r.metodo.replace('Múltiplos ', '').replace('Patrimônio Líquido', 'Patrimônio'),
      valor: r.valorBRL / 1e6,
      fill: CORES[r.metodo] || '#6b7280',
      peso: r.peso,
    }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-800 p-3 rounded-lg shadow-xl border border-white/10">
          <p className="font-medium text-white">{data.metodo}</p>
          <p className="text-primary-400 tabular-nums">R$ {data.valor.toFixed(2)}M</p>
          <p className="text-xs text-slate-400">Peso: {(data.peso * 100).toFixed(0)}%</p>
        </div>
      );
    }
    return null;
  };

  const metodosAplicaveis = results.filter((r) => r.aplicavel).length;
  const metodosComValor = results.filter((r) => r.aplicavel && r.valorBRL > 0).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Resultado da Análise</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                {estagio}
              </span>
              <span className="text-xs text-slate-500">
                {metodosComValor}/{metodosAplicaveis} métodos
              </span>
              {isCalculating && (
                <span className="text-xs text-slate-500 animate-pulse">Calculando...</span>
              )}
            </div>
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button onClick={onExportJSON} className="btn-secondary flex items-center gap-1.5 text-sm">
            <FileJson className="w-4 h-4" />
            <span className="hidden sm:inline">JSON</span>
          </button>
          <button onClick={onExportCSV} className="btn-secondary flex items-center gap-1.5 text-sm">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Hero Value */}
      <div className="text-center py-8 px-4 rounded-2xl bg-gradient-to-br from-primary-500/10 via-transparent to-emerald-500/5 border border-primary-500/20">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary-400" />
          <p className="text-sm text-slate-400 uppercase tracking-wider font-medium">
            Valuation Ponderado
          </p>
        </div>
        <p className="text-5xl sm:text-6xl font-extrabold tracking-tight text-white tabular-nums glow-text">
          {formatarNumeroGrande(valorPonderado)}
        </p>
        <p className="text-lg text-slate-400 mt-2 tabular-nums">
          {formatarUSDGrande(valorPonderado / 5.15)}
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {investimento > 0 && (
          <MetricCard
            label="Post-Money"
            value={formatarNumeroGrande(postMoney)}
            subvalue={`+ R$ ${(investimento / 1e6).toFixed(1)}M`}
            variant="success"
          />
        )}
        <MetricCard
          label="Range"
          value={`${formatarNumeroGrande(range.min)} - ${formatarNumeroGrande(range.max)}`}
        />
        <MetricCard
          label="Média Simples"
          value={formatarNumeroGrande(valorMedio)}
          subvalue={`Mediana: ${formatarNumeroGrande(valorMediano)}`}
        />
        <MetricCard label="Recomendação" value={metodologiaRecomendada} />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
          <h3 className="text-sm font-medium text-slate-400 mb-4">
            Comparativo de Metodologias
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(180, chartData.length * 45)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis
                type="number"
                tickFormatter={(v) => `${v}M`}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                type="category"
                dataKey="metodo"
                width={80}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={24}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Table */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="text-left py-3 px-4 font-medium text-slate-400">Método</th>
              <th className="text-right py-3 px-4 font-medium text-slate-400">BRL</th>
              <th className="text-right py-3 px-4 font-medium text-slate-400">USD</th>
              <th className="text-center py-3 px-4 font-medium text-slate-400">Peso</th>
              <th className="text-center py-3 px-4 font-medium text-slate-400">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <>
                <tr
                  key={result.metodo}
                  className={`border-b border-white/[0.04] ${
                    !result.aplicavel
                      ? 'opacity-30'
                      : result.valorBRL > 0
                      ? 'hover:bg-white/[0.02]'
                      : 'opacity-50'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: result.aplicavel ? CORES[result.metodo] : '#475569' }}
                      />
                      <span className="font-medium text-slate-200">{result.metodo}</span>
                      {!result.aplicavel && (
                        <span className="text-[10px] text-slate-600 uppercase">N/A</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300 tabular-nums">
                    {result.valorBRL > 0 ? formatarBRL(result.valorBRL) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-500 tabular-nums">
                    {result.valorUSD > 0 ? formatarUSD(result.valorUSD) : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {result.aplicavel && result.peso > 0 ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-slate-400">
                        {(result.peso * 100).toFixed(0)}%
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <ConfiancaIcon nivel={result.confianca} />
                    </div>
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
      <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
        <p className="text-xs text-red-400/80">
          <strong className="text-red-400">Aviso:</strong> Valores estimados para fins de referência.
          Esta análise não constitui assessoria financeira ou garantia de valor real. Consulte
          profissionais qualificados para avaliação formal.
        </p>
      </div>
    </div>
  );
}
