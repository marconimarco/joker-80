import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { QuantumChatTerminal } from './components/QuantumChatTerminal';
import { QuantumCatalog } from './components/QuantumCatalog';
import { NotificationsView } from './components/NotificationsView';
import { SystemSpecs } from './components/SystemSpecs';
import { CircuitVisualizerModal } from './components/CircuitVisualizerModal';
import { LoginModal } from './components/LoginModal';
import { AdminControlPanel } from './components/AdminControlPanel';
import { FactoryTenant, QuantumCalculationMeta, UserAccount } from './types/quantum';
import { AuthStorage } from './services/authStorage';
import { PlantTelemetryScanner, AutoScanSummary } from './services/plantTelemetryScanner';

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
  const [activeView, setActiveView] = useState<'chat' | 'catalog' | 'notifications' | 'telemetry' | 'admin'>('chat');

  // Automatic plant telemetry scan state
  const [scanSummary, setScanSummary] = useState<AutoScanSummary | null>(() => PlantTelemetryScanner.getStoredSummary());
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Circuit modal state
  const [selectedCircuitCalc, setSelectedCircuitCalc] = useState<QuantumCalculationMeta | null>(null);
  const [selectedCircuitState, setSelectedCircuitState] = useState<string | undefined>(undefined);

  // Function to execute the auto-upload of plant data and run all 21 quantum calculations
  const runAutoTelemetryScan = useCallback(async (tenant: FactoryTenant) => {
    setIsScanning(true);
    try {
      const result = await PlantTelemetryScanner.scanPlantAndRun21Calculations(tenant);
      setScanSummary(result);
    } catch (e) {
      console.error('Error scanning plant telemetry', e);
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Trigger automatic download and 21 calculations when user enters or activeTenant changes
  useEffect(() => {
    if (currentUser && activeTenant) {
      runAutoTelemetryScan(activeTenant);
    }
  }, [currentUser?.id, activeTenant.id, runAutoTelemetryScan]);

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
      if (match) {
        setActiveTenant(match);
        runAutoTelemetryScan(match);
      }
    } else {
      setActiveTenant(allTenants[0]);
      runAutoTelemetryScan(allTenants[0]);
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
      <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Header */}
      <Header
        tenants={tenants}
        activeTenant={activeTenant}
        onSelectTenant={(tenant) => {
          if (currentUser.ruolo === 'Amministratore') {
            setActiveTenant(tenant);
            runAutoTelemetryScan(tenant);
          }
        }}
        currentUser={currentUser}
        onLogout={handleLogout}
        allowPlcWrite={allowPlcWrite}
        onTogglePlcWrite={setAllowPlcWrite}
        activeView={activeView}
        onChangeView={setActiveView}
        anomaliesCount={scanSummary?.anomalieTrovate || 0}
        isScanning={isScanning}
      />

      {/* Main Content View */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-col overflow-hidden">
        {activeView === 'chat' && (
          <QuantumChatTerminal
            onOpenCircuit={handleOpenCircuit}
            allowPlcWrite={allowPlcWrite}
            activeTenantEndpoint={activeTenant.endpoint}
            activeTenantName={activeTenant.nome}
            userRole={currentUser.ruolo}
            activeTenant={activeTenant}
            anomaliesCount={scanSummary?.anomalieTrovate || 0}
            onNavigateToNotifications={() => setActiveView('notifications')}
          />
        )}

        {activeView === 'catalog' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <QuantumCatalog
              onOpenCircuit={handleOpenCircuit}
              allowPlcWrite={allowPlcWrite}
            />
          </div>
        )}

        {activeView === 'notifications' && (
          <NotificationsView
            summary={scanSummary}
            isScanning={isScanning}
            onRefreshScan={() => runAutoTelemetryScan(activeTenant)}
            activeTenant={activeTenant}
            onOpenCircuit={handleOpenCircuit}
          />
        )}

        {activeView === 'telemetry' && currentUser.ruolo === 'Amministratore' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <SystemSpecs
              onOpenCircuit={handleOpenCircuit}
            />
          </div>
        )}

        {activeView === 'admin' && currentUser.ruolo === 'Amministratore' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <AdminControlPanel
              tenants={tenants}
              onUpdateTenants={(updated) => setTenants(updated)}
              activeTenant={activeTenant}
              onSelectTenant={setActiveTenant}
              currentUser={currentUser}
            />
          </div>
        )}
      </main>

      {/* Modal for CUDA-Q Circuit Diagram */}
      <CircuitVisualizerModal
        calculation={selectedCircuitCalc}
        lastState={selectedCircuitState}
        onClose={handleCloseCircuit}
      />

      {/* Footer status strip */}
      <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-500 text-[11px] py-1.5 px-4 font-mono flex flex-wrap items-center justify-between gap-1.5 shrink-0 overflow-hidden">
        <div className="flex items-center gap-2.5 truncate">
          <span className="truncate">SM.I.LE80 Quantum Middleware v2026.2</span>
          <span className="text-slate-700">|</span>
          <span className="text-slate-400 hidden sm:inline">21 Moduli CUDA-Q Sincronizzati</span>
          <span className="text-slate-700 hidden sm:inline">|</span>
          <span className="text-cyan-400 font-medium truncate">{activeTenant.nome}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Stato: <strong className="text-emerald-400">ONLINE</strong></span>
        </div>
      </footer>
    </div>
  );
}
