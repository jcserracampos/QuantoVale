// App Principal - Calculadora de Valuation Premium
// Modern Fintech Design with Glass Morphism

import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

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

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t border-white/[0.06]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
              <p>
                Calculadora de Valuation para Startups e SaaS brasileiras.
                <span className="hidden md:inline"> • </span>
                <br className="md:hidden" />
                <span className="text-slate-600">Privacidade garantida, sem trackers.</span>
              </p>
              <div className="flex items-center gap-6">
                <a
                  href="https://github.com/harshith-eth/SaaSValuationCalculator"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-300 transition-colors"
                >
                  GitHub
                </a>
                <a
                  href="https://portaldovaluation.com.br/valuation/multiplo-de-ebitda-por-setor/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-slate-300 transition-colors"
                >
                  Portal do Valuation
                </a>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

export default App;
