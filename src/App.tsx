// App Principal - Calculadora de Valuation SaaS/Startups
// Suporte completo: Rodadas, Berkus, Scorecard, DCF, Múltiplos, PDF

import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Save, Loader2, Github, Info } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ValuationForm } from '@/components/ValuationForm';
import { Results } from '@/components/Results';
import { AuthModal } from '@/components/AuthModal';
import { PDFReportButton } from '@/components/PDFReport';
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'dark:bg-gray-800 dark:text-white',
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
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Calculadora de Valuation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Estime o valor da sua startup usando múltiplas metodologias.
            Suporte completo a <strong>Pre-seed</strong> até <strong>empresas maduras</strong>.
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              Berkus
            </span>
            <span className="text-xs px-2 py-1 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300 rounded-full">
              Scorecard
            </span>
            <span className="text-xs px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 rounded-full">
              DCF
            </span>
            <span className="text-xs px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full">
              Múltiplos
            </span>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
              <ValuationForm
                formData={formData}
                updateSection={updateSection}
                resetForm={resetForm}
                isEarlyStage={isEarlyStage}
                isLateStage={isLateStage}
              />

              {/* Ações */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Botão Salvar */}
                  <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
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
                          <span className="text-xs opacity-75">(login)</span>
                        )}
                      </>
                    )}
                  </button>

                  {/* Botão PDF */}
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

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-2">Métodos por Estágio:</p>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-300 text-xs">
                    <li><strong>Pre-seed/Seed:</strong> Berkus + Scorecard (70% peso)</li>
                    <li><strong>Série A:</strong> Múltiplos ARR + DCF + Scorecard</li>
                    <li><strong>Série B+:</strong> Múltiplos + DCF (45% peso DCF)</li>
                    <li><strong>Maduro:</strong> EBITDA + DCF + Patrimônio</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Results Column */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
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

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
            <p>
              Calculadora de Valuation para Startups e SaaS brasileiras.
              <br className="md:hidden" />
              Dados sem trackers, privacidade garantida.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/harshith-eth/SaaSValuationCalculator"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Github className="w-4 h-4" />
                Referência
              </a>
              <a
                href="https://portaldovaluation.com.br/valuation/multiplo-de-ebitda-por-setor/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Portal do Valuation
              </a>
              <a
                href="https://negociosbrasil.com.br/vender-uma-empresa-saas-mrr-churn-controlado/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Negócios Brasil
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
