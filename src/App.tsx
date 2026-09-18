import React, { useState } from 'react';
import { Header } from './components/Header';
import { QuantumChatTerminal } from './components/QuantumChatTerminal';
import { QuantumCatalog } from './components/QuantumCatalog';
import { SystemSpecs } from './components/SystemSpecs';
import { CircuitVisualizerModal } from './components/CircuitVisualizerModal';
import { FactoryTenant, QuantumCalculationMeta } from './types/quantum';
import { CLIENT_TENANTS } from './data/calculationsMeta';

export default function App() {
  const [activeTenant, setActiveTenant] = useState<FactoryTenant>(CLIENT_TENANTS[0]);
  const [userRole, setUserRole] = useState<'Operatore di Linea' | 'Amministratore'>('Amministratore');
  const [allowPlcWrite, setAllowPlcWrite] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'chat' | 'catalog' | 'telemetry'>('chat');

  // Circuit modal state
  const [selectedCircuitCalc, setSelectedCircuitCalc] = useState<QuantumCalculationMeta | null>(null);
  const [selectedCircuitState, setSelectedCircuitState] = useState<string | undefined>(undefined);

  const handleOpenCircuit = (calc: QuantumCalculationMeta, state?: string) => {
    setSelectedCircuitCalc(calc);
    setSelectedCircuitState(state);
  };

  const handleCloseCircuit = () => {
    setSelectedCircuitCalc(null);
    setSelectedCircuitState(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Header */}
      <Header
        activeTenant={activeTenant}
        onSelectTenant={setActiveTenant}
        userRole={userRole}
        onChangeRole={setUserRole}
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
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Stato: <strong className="text-emerald-400">ONLINE</strong> (Porta 3000 Ingress / Reverse Proxy)</span>
        </div>
      </footer>
    </div>
  );
}
