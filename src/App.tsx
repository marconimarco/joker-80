import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { QuantumChatTerminal } from './components/QuantumChatTerminal';
import { QuantumCatalog } from './components/QuantumCatalog';
import { SystemSpecs } from './components/SystemSpecs';
import { CircuitVisualizerModal } from './components/CircuitVisualizerModal';
import { LoginModal } from './components/LoginModal';
import { AdminControlPanel } from './components/AdminControlPanel';
import { FactoryTenant, QuantumCalculationMeta, UserAccount } from './types/quantum';
import { AuthStorage } from './services/authStorage';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => AuthStorage.getCurrentUser());
  const [tenants, setTenants] = useState<FactoryTenant[]>(() => AuthStorage.getTenants());
  const [activeTenant, setActiveTenant] = useState<FactoryTenant>(() => {
    const all = AuthStorage.getTenants();
    const storedUser = AuthStorage.getCurrentUser();
    if (storedUser?.tenantId) {
      const found = all.find(t => t.id === storedUser.tenantId);
      if (found) return found;
    }
    return all[0];
  });

  const [allowPlcWrite, setAllowPlcWrite] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'chat' | 'catalog' | 'telemetry' | 'admin'>('chat');

  // Circuit modal state
  const [selectedCircuitCalc, setSelectedCircuitCalc] = useState<QuantumCalculationMeta | null>(null);
  const [selectedCircuitState, setSelectedCircuitState] = useState<string | undefined>(undefined);

  // Sync active tenant if user changes or tenants list updates
  useEffect(() => {
    const currentTenants = AuthStorage.getTenants();
    setTenants(currentTenants);
    if (currentUser?.tenantId) {
      const match = currentTenants.find(t => t.id === currentUser.tenantId);
      if (match) setActiveTenant(match);
    }
  }, [currentUser]);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    const allTenants = AuthStorage.getTenants();
    setTenants(allTenants);

    if (user.tenantId) {
      const match = allTenants.find(t => t.id === user.tenantId);
      if (match) setActiveTenant(match);
    } else {
      setActiveTenant(allTenants[0]);
    }
    setActiveView('chat');
  };

  const handleLogout = () => {
    AuthStorage.logout();
    setCurrentUser(null);
    setActiveView('chat');
  };

  const handleOpenCircuit = (calc: QuantumCalculationMeta, state?: string) => {
    setSelectedCircuitCalc(calc);
    setSelectedCircuitState(state);
  };

  const handleCloseCircuit = () => {
    setSelectedCircuitCalc(null);
    setSelectedCircuitState(undefined);
  };

  // If not logged in, enforce authentication via LoginModal
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500/30 selection:text-cyan-200">
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Header */}
      <Header
        tenants={tenants}
        activeTenant={activeTenant}
        onSelectTenant={(tenant) => {
          if (currentUser.ruolo === 'Amministratore') {
            setActiveTenant(tenant);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        allowPlcWrite={allowPlcWrite}
        onTogglePlcWrite={setAllowPlcWrite}
        activeView={activeView}
        onChangeView={setActiveView}
      />

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeView === 'chat' && (
          <QuantumChatTerminal
            onOpenCircuit={handleOpenCircuit}
            allowPlcWrite={allowPlcWrite}
            activeTenantEndpoint={activeTenant.endpoint}
            activeTenantName={activeTenant.nome}
            userRole={currentUser.ruolo}
          />
        )}

        {activeView === 'catalog' && (
          <QuantumCatalog
            onOpenCircuit={handleOpenCircuit}
            allowPlcWrite={allowPlcWrite}
          />
        )}

        {activeView === 'telemetry' && (
          <SystemSpecs
            onOpenCircuit={handleOpenCircuit}
          />
        )}

        {activeView === 'admin' && currentUser.ruolo === 'Amministratore' && (
          <AdminControlPanel
            tenants={tenants}
            onUpdateTenants={(updated) => setTenants(updated)}
            activeTenant={activeTenant}
            onSelectTenant={setActiveTenant}
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Modal for CUDA-Q Circuit Diagram */}
      <CircuitVisualizerModal
        calculation={selectedCircuitCalc}
        lastState={selectedCircuitState}
        onClose={handleCloseCircuit}
      />

      {/* Footer status strip */}
      <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-500 text-xs py-3 px-6 font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>SM.I.LE80 Quantum Middleware Connector v2026.2</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400">17 Moduli CUDA-Q Sincronizzati</span>
          <span className="text-slate-700">|</span>
          <span className="text-cyan-400">Ambiente Attivo: {activeTenant.nome}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Stato: <strong className="text-emerald-400">ONLINE</strong> (Porta 3000 Ingress / Reverse Proxy)</span>
        </div>
      </footer>
    </div>
  );
}
