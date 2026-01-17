// App Principal - Calculadora de Valuation SaaS/Startups
// React + Vite + TypeScript + Tailwind + PocketBase

import { useState } from 'react';
import { Toaster, toast } from 'sonner';
import { Save, Loader2, Github, Info } from 'lucide-react';

import { Navbar } from '@/components/Navbar';
import { ValuationForm } from '@/components/ValuationForm';
import { Results } from '@/components/Results';
import { AuthModal } from '@/components/AuthModal';
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
    range,
    metodologiaRecomendada,
    isCalculating,
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
    } catch (err) {
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
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Calculadora de Valuation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Estime o valor da sua startup ou SaaS usando múltiplas metodologias:
            Múltiplos de ARR/EBITDA, DCF e Berkus. Dados do mercado brasileiro 2026.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Column */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
              <ValuationForm
                formData={formData}
                updateSection={updateSection}
                resetForm={resetForm}
              />

              {/* Save Button */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={onSave}
                  disabled={isSaving}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-medium rounded-lg transition-colors"
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
                        <span className="text-xs opacity-75">(requer login)</span>
                      )}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Sobre as metodologias:</p>
                  <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                    <li>
                      <strong>Múltiplos ARR:</strong> Padrão SaaS, 7-12x dependendo do setor
                    </li>
                    <li>
                      <strong>Múltiplos EBITDA:</strong> Para empresas com margem positiva
                    </li>
                    <li>
                      <strong>DCF:</strong> Fluxo de caixa descontado, projeção 3 anos
                    </li>
                    <li>
                      <strong>Berkus:</strong> Para early-stage, max USD 12.5M
                    </li>
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
              range={range}
              metodologiaRecomendada={metodologiaRecomendada}
              isCalculating={isCalculating}
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
                Fonte: Portal do Valuation
              </a>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;
