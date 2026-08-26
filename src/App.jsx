import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Navbar';
import { Header } from './components/layout/Header';
import { LoginView } from './components/auth/LoginView';
import { MetasModule } from './components/modules/MetasModule';
import { KanbanModule } from './components/modules/KanbanModule';
import { ClientesModule } from './components/modules/ClientesModule';
import { DashboardModule } from './components/modules/DashboardModule';
import { OperacaoDiariaModule } from './components/modules/OperacaoDiariaModule';
import { ConfiguracoesModule } from './components/modules/ConfiguracoesModule';
import { FuncionariosModule } from './components/modules/FuncionariosModule';
import { ComissoesModule } from './components/modules/ComissoesModule';

const MainContent = () => {
  const { activeTab, isAuthenticated } = useApp();
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-6 py-6">
            {activeTab === 'dashboard' && <DashboardModule />}
            {activeTab === 'metas' && <MetasModule />}
            {activeTab === 'crm' && <KanbanModule />}
            {activeTab === 'clientes' && <ClientesModule />}
            {activeTab === 'comissoes' && <ComissoesModule />}
            {activeTab === 'operacao' && (
              <OperacaoDiariaModule
                isModalOpen={isLancamentoModalOpen}
                setIsModalOpen={setIsLancamentoModalOpen}
              />
            )}
            {activeTab === 'configuracoes' && <ConfiguracoesModule />}
            {activeTab === 'funcionarios' && <FuncionariosModule />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
