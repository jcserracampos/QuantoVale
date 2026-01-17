// Formulário de Valuation com seções colapsáveis
// Suporte completo a estágios/rodadas e métodos qualitativos

import {
  ChevronDown,
  ChevronUp,
  Building2,
  DollarSign,
  TrendingUp,
  Sliders,
  Info,
  Rocket,
  Users,
  Scale,
} from 'lucide-react';
import type { ValuationFormData, Setor, Estagio } from '@/types/valuation';
import { useAccordion } from '@/hooks/useValuation';
import { MULTIPLOS_SETOR, MULTIPLOS_ESTAGIO } from '@/utils/formulas';
import { BERKUS_MAX_POR_FATOR } from '@/types/valuation';

// Opções de setores
const SETORES: Setor[] = [
  'SaaS/Tech',
  'Fintech',
  'E-commerce',
  'Marketplace',
  'EdTech',
  'HealthTech',
  'LogTech',
  'AgTech',
  'Outro',
];

// Opções de estágios expandidas
const ESTAGIOS: Estagio[] = [
  'Pre-seed',
  'Seed',
  'Serie-A',
  'Serie-B+',
  'Maduro',
];

interface Props {
  formData: ValuationFormData;
  updateSection: <K extends keyof ValuationFormData>(
    section: K,
    updates: Partial<ValuationFormData[K]>
  ) => void;
  resetForm: () => void;
  isEarlyStage: boolean;
  isLateStage: boolean;
}

// Componente de seção colapsável
function AccordionSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  children,
  description,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  description?: string;
  badge?: string;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">{title}</span>
              {badge && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            )}
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 bg-white dark:bg-gray-900">
          {children}
        </div>
      )}
    </div>
  );
}

// Input com label
function FormInput({
  label,
  name,
  value,
  onChange,
  type = 'number',
  placeholder,
  helpText,
  prefix,
  suffix,
  min,
  max,
  step,
  disabled,
}: {
  label: string;
  name: string;
  value: number | string;
  onChange: (value: number | string) => void;
  type?: 'number' | 'text';
  placeholder?: string;
  helpText?: string;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {prefix}
          </span>
        )}
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={(e) =>
            onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)
          }
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={`
            w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            focus:ring-2 focus:ring-primary-500 focus:border-primary-500
            disabled:bg-gray-100 dark:disabled:bg-gray-700 disabled:cursor-not-allowed
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-12' : ''}
          `}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
            {suffix}
          </span>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {helpText}
        </p>
      )}
    </div>
  );
}

// Select com label
function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  helpText,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  helpText?: string;
}) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        {label}
      </label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}

// Slider com label
function FormSlider({
  label,
  name,
  value,
  onChange,
  min,
  max,
  step = 1,
  helpText,
  showValue = true,
  suffix = '',
  formatValue,
}: {
  label: string;
  name: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  helpText?: string;
  showValue?: boolean;
  suffix?: string;
  formatValue?: (v: number) => string;
}) {
  const displayValue = formatValue ? formatValue(value) : `${value}${suffix}`;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          {label}
        </label>
        {showValue && (
          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
            {displayValue}
          </span>
        )}
      </div>
      <input
        id={name}
        name={name}
        type="range"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        min={min}
        max={max}
        step={step}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
      />
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatValue ? formatValue(min) : `${min}${suffix}`}</span>
        <span>{formatValue ? formatValue(max) : `${max}${suffix}`}</span>
      </div>
      {helpText && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}
    </div>
  );
}

export function ValuationForm({ formData, updateSection, resetForm, isEarlyStage, isLateStage }: Props) {
  const { isOpen, toggle } = useAccordion(['basic', 'financeiro', 'berkus']);

  // Info do múltiplo e estágio atual
  const multiploInfo = MULTIPLOS_SETOR[formData.basic.setor as Setor];
  const estagioInfo = MULTIPLOS_ESTAGIO[formData.basic.estagio as Estagio];

  // Formatador para valores em USD
  const formatUSD = (v: number) => `$${(v / 1000).toFixed(0)}k`;

  return (
    <form className="space-y-4">
      {/* Seção Básica */}
      <AccordionSection
        title="Informações Básicas"
        icon={Building2}
        isOpen={isOpen('basic')}
        onToggle={() => toggle('basic')}
        description="Identificação, setor e estágio"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Nome da Empresa"
            name="name"
            type="text"
            value={formData.basic.name || ''}
            onChange={(v) => updateSection('basic', { name: v as string })}
            placeholder="Ex: Minha Startup"
          />
          <FormSelect
            label="Setor"
            name="setor"
            value={formData.basic.setor}
            onChange={(v) => updateSection('basic', { setor: v as Setor })}
            options={SETORES.map((s) => ({ value: s, label: s }))}
            helpText={`Múltiplo ARR: ${multiploInfo.min}-${multiploInfo.max}x`}
          />
          <FormSelect
            label="Estágio/Rodada"
            name="estagio"
            value={formData.basic.estagio}
            onChange={(v) => updateSection('basic', { estagio: v as Estagio })}
            options={ESTAGIOS.map((e) => ({
              value: e,
              label: e === 'Serie-A' ? 'Série A' : e === 'Serie-B+' ? 'Série B+' : e,
            }))}
            helpText={`WACC padrão: ${estagioInfo.waccDefault}%`}
          />
        </div>

        {/* Info do estágio */}
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <p className="text-blue-800 dark:text-blue-200">
            <strong>Métodos recomendados para {formData.basic.estagio}:</strong>{' '}
            {estagioInfo.metodosPreferidos.join(', ')}
          </p>
        </div>
      </AccordionSection>

      {/* Seção Financeira */}
      <AccordionSection
        title="Dados Financeiros"
        icon={DollarSign}
        isOpen={isOpen('financeiro')}
        onToggle={() => toggle('financeiro')}
        description="Receitas, EBITDA e métricas"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormInput
            label="MRR (Receita Mensal)"
            name="mrr"
            value={formData.financeiro.mrr}
            onChange={(v) => updateSection('financeiro', { mrr: v as number })}
            prefix="R$"
            helpText="Receita recorrente mensal"
            min={0}
            step={1000}
          />
          <FormInput
            label="ARR (Receita Anual)"
            name="arr"
            value={formData.financeiro.arr}
            onChange={() => {}}
            prefix="R$"
            helpText="Calculado: MRR × 12"
            disabled
          />
          <FormInput
            label="EBITDA Anual"
            name="ebitda"
            value={formData.financeiro.ebitda}
            onChange={(v) => updateSection('financeiro', { ebitda: v as number })}
            prefix="R$"
            helpText={isEarlyStage ? 'Opcional early-stage' : 'Obrigatório late-stage'}
          />
          <FormInput
            label="Churn Mensal"
            name="churn"
            value={formData.financeiro.churn}
            onChange={(v) => updateSection('financeiro', { churn: v as number })}
            suffix="%"
            helpText="Taxa de cancelamento"
            min={0}
            max={100}
            step={0.1}
          />
          <FormInput
            label="Clientes Ativos"
            name="clientes"
            value={formData.financeiro.clientes}
            onChange={(v) => updateSection('financeiro', { clientes: v as number })}
            helpText="Clientes pagantes"
            min={0}
          />
          <FormInput
            label="Receita TTM"
            name="receitaTTM"
            value={formData.financeiro.receitaTTM}
            onChange={(v) => updateSection('financeiro', { receitaTTM: v as number })}
            prefix="R$"
            helpText="Últimos 12 meses"
            min={0}
          />
        </div>

        {/* Campos para Patrimônio (só Maduro) */}
        {isLateStage && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Dados para Patrimônio Líquido (opcional)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormInput
                label="Total de Ativos"
                name="ativos"
                value={formData.financeiro.ativos || 0}
                onChange={(v) => updateSection('financeiro', { ativos: v as number })}
                prefix="R$"
                min={0}
              />
              <FormInput
                label="Total de Passivos"
                name="passivos"
                value={formData.financeiro.passivos || 0}
                onChange={(v) => updateSection('financeiro', { passivos: v as number })}
                prefix="R$"
                min={0}
              />
            </div>
          </div>
        )}
      </AccordionSection>

      {/* Seção Rodada */}
      <AccordionSection
        title="Rodada Atual"
        icon={Rocket}
        isOpen={isOpen('rodada')}
        onToggle={() => toggle('rodada')}
        description="Pre-money e investimento"
        badge="Opcional"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Pre-Money Estimado"
            name="preMoneyEstimado"
            value={formData.rodada.preMoneyEstimado}
            onChange={(v) => updateSection('rodada', { preMoneyEstimado: v as number })}
            prefix="R$"
            helpText="Valuation antes do investimento"
            min={0}
          />
          <FormInput
            label="Investimento Esperado"
            name="investimento"
            value={formData.rodada.investimento}
            onChange={(v) => updateSection('rodada', { investimento: v as number })}
            prefix="R$"
            helpText="Valor da rodada"
            min={0}
          />
          <FormInput
            label="Post-Money"
            name="postMoney"
            value={formData.rodada.postMoney}
            onChange={() => {}}
            prefix="R$"
            helpText="Pre + Investimento"
            disabled
          />
        </div>
      </AccordionSection>

      {/* Seção Berkus (só early-stage) */}
      {isEarlyStage && (
        <AccordionSection
          title="Método Berkus"
          icon={Users}
          isOpen={isOpen('berkus')}
          onToggle={() => toggle('berkus')}
          description="Avaliação qualitativa (5 fatores)"
          badge="Early-Stage"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Ajuste cada fator de 0 a $500k USD. Máximo total: $2.5M USD.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormSlider
              label="Equipe"
              name="berkus-equipe"
              value={formData.berkus.equipe}
              onChange={(v) => updateSection('berkus', { equipe: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
              helpText="Experiência e track record"
            />
            <FormSlider
              label="Produto/Protótipo"
              name="berkus-produto"
              value={formData.berkus.produto}
              onChange={(v) => updateSection('berkus', { produto: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
              helpText="Maturidade do MVP"
            />
            <FormSlider
              label="Tamanho do Mercado"
              name="berkus-mercado"
              value={formData.berkus.mercado}
              onChange={(v) => updateSection('berkus', { mercado: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
              helpText="TAM/SAM potencial"
            />
            <FormSlider
              label="Tração"
              name="berkus-tracao"
              value={formData.berkus.tracao}
              onChange={(v) => updateSection('berkus', { tracao: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
              helpText="Vendas, usuários, parcerias"
            />
            <FormSlider
              label="IP/Barreiras"
              name="berkus-ip"
              value={formData.berkus.ip}
              onChange={(v) => updateSection('berkus', { ip: v })}
              min={0}
              max={BERKUS_MAX_POR_FATOR}
              step={25000}
              formatValue={formatUSD}
              helpText="Patentes, moat competitivo"
            />
          </div>

          {/* Total Berkus */}
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              <strong>Total Berkus:</strong> $
              {((formData.berkus.equipe + formData.berkus.produto +
                formData.berkus.mercado + formData.berkus.tracao +
                formData.berkus.ip) / 1e6).toFixed(2)}M USD
            </p>
          </div>
        </AccordionSection>
      )}

      {/* Seção Scorecard (só early-stage) */}
      {isEarlyStage && (
        <AccordionSection
          title="Método Scorecard"
          icon={Scale}
          isOpen={isOpen('scorecard')}
          onToggle={() => toggle('scorecard')}
          description="Ajustes vs. média do setor"
          badge="Early-Stage"
        >
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Compare sua startup com a média do setor. Ajuste de -50% a +50% para cada fator.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormSlider
              label="Equipe (30%)"
              name="scorecard-equipe"
              value={formData.scorecard.equipeAjuste}
              onChange={(v) => updateSection('scorecard', { equipeAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
              helpText="Experiência vs. média"
            />
            <FormSlider
              label="Mercado (25%)"
              name="scorecard-mercado"
              value={formData.scorecard.tamanhoMercadoAjuste}
              onChange={(v) => updateSection('scorecard', { tamanhoMercadoAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
              helpText="Tamanho vs. média"
            />
            <FormSlider
              label="Produto (15%)"
              name="scorecard-produto"
              value={formData.scorecard.produtoAjuste}
              onChange={(v) => updateSection('scorecard', { produtoAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
              helpText="Maturidade vs. média"
            />
            <FormSlider
              label="Competição (10%)"
              name="scorecard-competicao"
              value={formData.scorecard.competicaoAjuste}
              onChange={(v) => updateSection('scorecard', { competicaoAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
              helpText="Ambiente competitivo"
            />
            <FormSlider
              label="Marketing (10%)"
              name="scorecard-marketing"
              value={formData.scorecard.marketingAjuste}
              onChange={(v) => updateSection('scorecard', { marketingAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
              helpText="Canais e go-to-market"
            />
            <FormSlider
              label="Outros (10%)"
              name="scorecard-outros"
              value={formData.scorecard.outrosAjuste}
              onChange={(v) => updateSection('scorecard', { outrosAjuste: v })}
              min={-50}
              max={50}
              suffix="%"
              helpText="Investimento anterior, etc."
            />
          </div>
        </AccordionSection>
      )}

      {/* Seção Projeções */}
      <AccordionSection
        title="Projeções DCF"
        icon={TrendingUp}
        isOpen={isOpen('projecoes')}
        onToggle={() => toggle('projecoes')}
        description="Crescimento e taxas de desconto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormSlider
            label="Crescimento Anual (3 anos)"
            name="crescimento3y"
            value={formData.projecoes.crescimento3y}
            onChange={(v) => updateSection('projecoes', { crescimento3y: v })}
            min={-20}
            max={100}
            suffix="%"
            helpText="Taxa de crescimento projetada"
          />
          <FormSlider
            label="WACC (Custo de Capital)"
            name="wacc"
            value={formData.projecoes.wacc}
            onChange={(v) => updateSection('projecoes', { wacc: v })}
            min={10}
            max={35}
            suffix="%"
            helpText={`Padrão ${formData.basic.estagio}: ${estagioInfo.waccDefault}%`}
          />
          <FormSlider
            label="Taxa Perpétua"
            name="perpetuo"
            value={formData.projecoes.perpetuo}
            onChange={(v) => updateSection('projecoes', { perpetuo: v })}
            min={0}
            max={6}
            step={0.5}
            suffix="%"
            helpText="Crescimento perpétuo"
          />
        </div>
      </AccordionSection>

      {/* Seção Ajustes */}
      <AccordionSection
        title="Ajustes Adicionais"
        icon={Sliders}
        isOpen={isOpen('ajustes')}
        onToggle={() => toggle('ajustes')}
        description="Fatores de ajuste fino"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormSlider
            label="CapEx (% da Receita)"
            name="capexPct"
            value={formData.ajustes.capexPct}
            onChange={(v) => updateSection('ajustes', { capexPct: v })}
            min={0}
            max={30}
            suffix="%"
            helpText="Investimento em capital"
          />
          <FormSlider
            label="LTV/CAC Ratio"
            name="ltvCac"
            value={formData.ajustes.ltvCac}
            onChange={(v) => updateSection('ajustes', { ltvCac: v })}
            min={0}
            max={10}
            step={0.5}
            suffix="x"
            helpText="Ideal: > 3x"
          />
          <FormSlider
            label="Score da Equipe"
            name="equipeScore"
            value={formData.ajustes.equipeScore}
            onChange={(v) => updateSection('ajustes', { equipeScore: v })}
            min={0}
            max={100}
            suffix="/100"
            helpText="Fator multiplicador"
          />
        </div>
      </AccordionSection>

      {/* Botão Reset */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={resetForm}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Resetar para padrões
        </button>
      </div>
    </form>
  );
}
