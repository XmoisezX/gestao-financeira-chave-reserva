import React, { useState, useEffect } from 'react';
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
import { SuporteModule } from './components/modules/SuporteModule';

const MainContent = () => {
  const { activeTab, setActiveTab, isAuthenticated, isAdmin, isSupport } = useApp();
  const [isLancamentoModalOpen, setIsLancamentoModalOpen] = useState(false);

  // Route protection: prevent non-admin from accessing financial/admin tabs, and non-support/non-admin from accessing suporte
  useEffect(() => {
    const adminOnlyTabs = ['metas', 'operacao', 'configuracoes', 'funcionarios'];
    if (isAuthenticated) {
      if (!isAdmin && adminOnlyTabs.includes(activeTab)) {
        setActiveTab('dashboard');
      } else if (!isAdmin && !isSupport && activeTab === 'suporte') {
        setActiveTab('dashboard');
      }
    }
  }, [activeTab, isAdmin, isSupport, isAuthenticated, setActiveTab]);

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div
      className="flex h-screen font-sans transition-colors duration-200"
      style={{
        background: 'var(--bg-app)',
        color: 'var(--text-primary)',
      }}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1360px] mx-auto px-6 py-6">
            {activeTab === 'dashboard' && <DashboardModule />}
            {activeTab === 'metas' && <MetasModule />}
            {activeTab === 'crm' && <KanbanModule />}
            {activeTab === 'clientes' && <ClientesModule />}
            {activeTab === 'suporte' && <SuporteModule />}
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
