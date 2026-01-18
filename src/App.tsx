// App Principal - Calculadora de Valuation Premium
// Modern Fintech Design with Glass Morphism

import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Save, Loader2, TrendingUp, DollarSign, Calculator, Star, BarChart3, Scale } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ValuationForm } from '@/components/ValuationForm';
import { Results } from '@/components/Results';
import { AuthModal } from '@/components/AuthModal';
import { PDFReportButton } from '@/components/PDFReport';
import { SavedValuations } from '@/components/SavedValuations';
import { useValuation, useDarkMode } from '@/hooks/useValuation';

function App() {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const {
    formData,
    updateSection,
    resetForm,
    results,
    valorMedio,
    valorMediano,
    valorPonderado,
    range,
    metodologiaRecomendada,
    postMoney,
    isCalculating,
    isEarlyStage,
    isLateStage,
    authState,
    handleLogin,
    handleRegister,
    handleLogout,
    handleSave,
    handleExportJSON,
    handleExportCSV,
    isSaving,
    saveError,
    savedValuations,
    isLoadingSaved,
    handleLoadSaved,
    handleLoadValuation,
  } = useValuation();

  // Salvar com feedback
  const onSave = async () => {
    if (!authState.isAuthenticated) {
      setShowAuthModal(true);
      toast.info('Faça login para salvar sua análise');
      return;
    }

    try {
      await handleSave();
      toast.success('Análise salva com sucesso!');
    } catch {
      toast.error(saveError || 'Erro ao salvar');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Background gradient effect */}
      <div className="fixed inset-0 bg-gradient-radial from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary-500/[0.03] blur-[120px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative">
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'bg-slate-800 text-white border border-white/10',
            style: {
              background: 'rgb(30 41 59)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
            },
          }}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onLogin={async (email, password) => {
            await handleLogin(email, password);
            toast.success('Login realizado!');
          }}
          onRegister={async (email, password, name) => {
            await handleRegister(email, password, name);
            toast.success('Conta criada com sucesso!');
          }}
        />

        {/* Navbar */}
        <Navbar
          isDark={isDark}
          toggleDark={toggleDark}
          authState={authState}
          onLoginClick={() => setShowAuthModal(true)}
          onLogout={() => {
            handleLogout();
            toast.info('Você saiu da sua conta');
          }}
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
              Calcule o{' '}
              <span className="text-gradient">Valuation</span>
              {' '}da sua Startup
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Análise profissional usando múltiplas metodologias.
              De <span className="text-slate-300 font-medium">Pre-seed</span> a{' '}
              <span className="text-slate-300 font-medium">empresas maduras</span>.
            </p>
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
              {['Berkus', 'Scorecard', 'DCF', 'Múltiplos'].map((method) => (
                <span
                  key={method}
                  className="text-xs font-medium px-3 py-1.5 rounded-full bg-white/[0.05] text-slate-400 border border-white/[0.08]"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
            {/* Form Column */}
            <div className="xl:col-span-5 space-y-6">
              <div className="glass-card p-6">
                <ValuationForm
                  formData={formData}
                  updateSection={updateSection}
                  resetForm={resetForm}
                  isEarlyStage={isEarlyStage}
                  isLateStage={isLateStage}
                />

                {/* Actions */}
                <div className="mt-8 pt-6 border-t border-white/[0.06]">
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Save Button */}
                    <button
                      onClick={onSave}
                      disabled={isSaving}
                      className="flex-1 btn-primary flex items-center justify-center gap-2"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Salvar Análise
                          {!authState.isAuthenticated && (
                            <span className="text-xs opacity-70">(login)</span>
                          )}
                        </>
                      )}
                    </button>

                    {/* PDF Button */}
                    <PDFReportButton
                      formData={formData}
                      results={results}
                      valorPonderado={valorPonderado}
                      valorMedio={valorMedio}
                      range={range}
                      metodologiaRecomendada={metodologiaRecomendada}
                      postMoney={postMoney}
                    />
                  </div>
                </div>
              </div>

              {/* Saved Valuations */}
              {authState.isAuthenticated && (
                <SavedValuations
                  savedValuations={savedValuations}
                  isLoading={isLoadingSaved}
                  onLoad={(valuation) => {
                    handleLoadValuation(valuation);
                    toast.success('Análise carregada!');
                  }}
                  onRefresh={handleLoadSaved}
                />
              )}
            </div>

            {/* Results Column - The Hero */}
            <div className="xl:col-span-7">
              <div className="glass-card p-6 sm:p-8 shadow-2xl">
                <Results
                  results={results}
                  valorMedio={valorMedio}
                  valorMediano={valorMediano}
                  valorPonderado={valorPonderado}
                  range={range}
                  metodologiaRecomendada={metodologiaRecomendada}
                  postMoney={postMoney}
                  isCalculating={isCalculating}
                  estagio={formData.basic.estagio}
                  investimento={formData.rodada.investimento}
                  onExportJSON={handleExportJSON}
                  onExportCSV={handleExportCSV}
                />
              </div>
            </div>
          </div>

          {/* Methods Section - Excluded from PDF */}
          <div className="mt-16" data-exclude-from-pdf="true">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-3">
                Metodologias de <span className="text-gradient">Valuation</span>
              </h2>
              <p className="text-slate-400 max-w-3xl mx-auto">
                Entenda os métodos que utilizamos para calcular o valor da sua empresa em diferentes estágios de maturidade.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Múltiplos ARR */}
              <div className="glass-card p-6 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Múltiplos ARR</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                      Método baseado em receita recorrente anual. Multiplica o ARR por um fator que varia de acordo com o setor, crescimento, churn e qualidade da equipe.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Série B+
                      </span>
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        SaaS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Múltiplos EBITDA */}
              <div className="glass-card p-6 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Múltiplos EBITDA</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                      Avaliação baseada em lucros operacionais. Multiplica o EBITDA por um múltiplo específico do setor. Ideal para empresas maduras com lucro estável.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Maduro
                      </span>
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Lucrativo
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* DCF */}
              <div className="glass-card p-6 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">DCF (Fluxo de Caixa Descontado)</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                      Projeta fluxos de caixa futuros (3 anos) e os traz a valor presente usando uma taxa de desconto ajustada por risco (WACC). Calcula valor terminal.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Série A+
                      </span>
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Previsível
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Berkus */}
              <div className="glass-card p-6 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
                    <Star className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Método Berkus</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                      Avalia 5 fatores qualitativos (Equipe, Produto, Mercado, Tração, IP) atribuindo até $500K por fator. Máximo de $2.5M. Ideal para early-stage.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Pre-seed
                      </span>
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Seed
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Scorecard */}
              <div className="glass-card p-6 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Método Scorecard</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                      Compara com valuation mediano do setor e ajusta por 6 fatores ponderados: Equipe (30%), Mercado (25%), Produto (15%), Competição (10%), Marketing (10%), Investimento (5%).
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Seed
                      </span>
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Série A
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patrimônio Líquido */}
              <div className="glass-card p-6 hover:bg-white/[0.05] transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-primary-500/10 text-primary-400">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">Patrimônio Líquido</h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                      Método contábil simples baseado em ativos menos passivos. Calcula o valor patrimonial da empresa. Mais adequado para empresas maduras com ativos tangíveis.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Maduro
                      </span>
                      <span className="px-2 py-1 rounded bg-white/[0.05] border border-white/[0.08]">
                        Conservador
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Note */}
            <div className="mt-8 glass-card p-6 border-l-4 border-primary-500">
              <div className="flex items-start gap-3">
                <div className="text-primary-400 mt-0.5">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Cálculo Ponderado por Estágio</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Nossa calculadora aplica pesos diferentes para cada método de acordo com o estágio da empresa.
                    Por exemplo, startups em <span className="text-slate-300">Pre-seed</span> têm maior peso em métodos qualitativos (Berkus e Scorecard),
                    enquanto empresas <span className="text-slate-300">maduras</span> priorizam DCF e Múltiplos EBITDA.
                    O resultado final apresenta <strong className="text-white">média, mediana e valor ponderado</strong> para dar uma visão completa.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-white/[0.06]">
            <div className="text-center text-sm text-slate-500">
              <p>Calculadora de Valuation para Startups e SaaS brasileiras.</p>
              <p className="text-slate-600 mt-1">Privacidade garantida, sem trackers.</p>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
