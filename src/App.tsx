import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { QuantumChatTerminal } from './components/QuantumChatTerminal';
import { QuantumCatalog } from './components/QuantumCatalog';
import { NotificationsView } from './components/NotificationsView';
import { CompanyPlantSelectorModal } from './components/CompanyPlantSelectorModal';
import { CircuitVisualizerModal } from './components/CircuitVisualizerModal';
import { LoginModal } from './components/LoginModal';
import { AdminControlPanel } from './components/AdminControlPanel';
import { PlantCsvUploadModal } from './components/PlantCsvUploadModal';
import { FactoryTenant, QuantumCalculationMeta, UserAccount } from './types/quantum';
import { AuthStorage } from './services/authStorage';
import { PlantTelemetryScanner, AutoScanSummary } from './services/plantTelemetryScanner';
import { Terminal, LayoutGrid, Bell, Sliders } from 'lucide-react';

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

  const [activeView, setActiveView] = useState<'chat' | 'catalog' | 'notifications' | 'admin'>('chat');
  const [isCompanyPlantSelectorOpen, setIsCompanyPlantSelectorOpen] = useState<boolean>(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState<boolean>(false);
  const [importedCsvInputs, setImportedCsvInputs] = useState<Record<string, any>>({});

  // Automatic plant telemetry scan state
  const [scanSummary, setScanSummary] = useState<AutoScanSummary | null>(() => {
    const all = AuthStorage.getTenants();
    const firstTenant = all[0];
    return PlantTelemetryScanner.getStoredSummary(firstTenant?.id);
  });
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Circuit modal state
  const [selectedCircuitCalc, setSelectedCircuitCalc] = useState<QuantumCalculationMeta | null>(null);
  const [selectedCircuitState, setSelectedCircuitState] = useState<string | undefined>(undefined);

  const [voiceQueryToExecute, setVoiceQueryToExecute] = useState<string | null>(null);
  const [targetInspectCalcId, setTargetInspectCalcId] = useState<number | null>(null);
  const [openScenariTrigger, setOpenScenariTrigger] = useState<number>(0);

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

  // Safe handler to select tenant, clear obsolete summaries immediately and trigger scan
  const handleSelectTenant = useCallback((tenant: FactoryTenant) => {
    setActiveTenant(tenant);
    setIsCompanyPlantSelectorOpen(false);
    const cached = PlantTelemetryScanner.getStoredSummary(tenant.id);
    if (cached && cached.stabilimentoId === tenant.id) {
      setScanSummary(cached);
    } else {
      setScanSummary(null);
    }
    runAutoTelemetryScan(tenant);
  }, [runAutoTelemetryScan]);

  // Trigger automatic download and 21 calculations when activeTenant changes
  useEffect(() => {
    // Immediately load cached summary for this specific tenant if available
    const cached = PlantTelemetryScanner.getStoredSummary(activeTenant.id);
    if (cached && cached.stabilimentoId === activeTenant.id) {
      setScanSummary(cached);
    } else {
      setScanSummary(null);
    }
    runAutoTelemetryScan(activeTenant);
  }, [activeTenant.id, runAutoTelemetryScan]);

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

  const handleCloseAllModals = () => {
    setSelectedCircuitCalc(null);
    setSelectedCircuitState(undefined);
    setIsCompanyPlantSelectorOpen(false);
    setTargetInspectCalcId(null);
  };

  // If not logged in, enforce authentication via LoginModal
  if (!currentUser) {
    return (
      <div className="h-[100dvh] min-h-[100dvh] w-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-3 sm:p-4 overflow-y-auto selection:bg-cyan-500/30 selection:text-cyan-200">
        <LoginModal onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  const isAdmin = currentUser.ruolo === 'Amministratore';

  return (
    <div className="h-full min-h-full w-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Application Header */}
      <Header
        tenants={tenants}
        activeTenant={activeTenant}
        onSelectTenant={handleSelectTenant}
        currentUser={currentUser}
        onLogout={handleLogout}
        activeView={activeView}
        onChangeView={setActiveView}
        anomaliesCount={scanSummary && scanSummary.stabilimentoId === activeTenant.id ? scanSummary.anomalieTrovate : 0}
        isScanning={isScanning}
        onOpenCompanyPlantSelector={() => setIsCompanyPlantSelectorOpen(true)}
        onOpenCsvUpload={() => setIsCsvModalOpen(true)}
      />

      {/* Main Content View */}
      <main className="flex-1 min-h-0 w-full max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2 flex flex-col overflow-hidden">
        {activeView === 'chat' && (
          <QuantumChatTerminal
            onOpenCircuit={handleOpenCircuit}
            allowPlcWrite={false}
            activeTenantEndpoint={activeTenant.endpoint}
            activeTenantName={activeTenant.nome}
            userRole={currentUser.ruolo}
            activeTenant={activeTenant}
            anomaliesCount={scanSummary && scanSummary.stabilimentoId === activeTenant.id ? scanSummary.anomalieTrovate : 0}
            onNavigateToNotifications={() => setActiveView('notifications')}
            voiceQueryToExecute={voiceQueryToExecute}
            onVoiceQueryHandled={() => setVoiceQueryToExecute(null)}
            openScenariTrigger={openScenariTrigger}
          />
        )}

        {activeView === 'catalog' && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <QuantumCatalog
              onOpenCircuit={handleOpenCircuit}
              allowPlcWrite={false}
              targetInspectCalcId={targetInspectCalcId}
              onClearInspectTarget={() => setTargetInspectCalcId(null)}
              activeTenant={activeTenant}
              onOpenCsvUpload={() => setIsCsvModalOpen(true)}
              importedInputs={importedCsvInputs}
            />
          </div>
        )}

        {activeView === 'notifications' && (
          <NotificationsView
            summary={scanSummary && scanSummary.stabilimentoId === activeTenant.id ? scanSummary : null}
            isScanning={isScanning}
            onRefreshScan={() => runAutoTelemetryScan(activeTenant)}
            activeTenant={activeTenant}
            onOpenCircuit={handleOpenCircuit}
          />
        )}

        {activeView === 'admin' && isAdmin && (
          <div className="flex-1 min-h-0 overflow-y-auto pr-1">
            <AdminControlPanel
              tenants={tenants}
              onUpdateTenants={(updated) => setTenants(updated)}
              activeTenant={activeTenant}
              onSelectTenant={handleSelectTenant}
              currentUser={currentUser}
              onOpenCsvModalForPlant={(t) => {
                setActiveTenant(t);
                setIsCsvModalOpen(true);
              }}
            />
          </div>
        )}
      </main>

      {/* Dedicated Company & Multi-Plant Selector Modal */}
      <CompanyPlantSelectorModal
        isOpen={isCompanyPlantSelectorOpen}
        onClose={() => setIsCompanyPlantSelectorOpen(false)}
        tenants={tenants}
        activeTenant={activeTenant}
        onSelectTenant={handleSelectTenant}
      />

      {/* Manual CSV Plant Telemetry Upload Modal */}
      <PlantCsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        activeTenant={activeTenant}
        onTenantUpdated={(updated) => {
          setActiveTenant(updated);
          setTenants(AuthStorage.getTenants());
        }}
        onApplyInputsToCatalog={(inputsMap) => {
          setImportedCsvInputs(inputsMap);
          try {
            localStorage.setItem(`joker_custom_telemetry_${activeTenant.id}`, JSON.stringify(inputsMap));
          } catch {}
          runAutoTelemetryScan(activeTenant);
        }}
      />

      {/* Mobile Bottom Navigation Bar (Visible only on smartphones < 640px) */}
      <nav aria-label="Navigazione Mobile" className="sm:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-md px-1 py-1 flex items-center justify-around shrink-0 pb-safe z-30 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveView('chat')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer min-h-[44px] ${
            activeView === 'chat'
              ? 'text-cyan-400 font-bold bg-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="w-4 h-4 mb-0.5" />
          <span>Chat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('catalog')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer min-h-[44px] ${
            activeView === 'catalog'
              ? 'text-cyan-400 font-bold bg-cyan-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutGrid className="w-4 h-4 mb-0.5" />
          <span>Catalogo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('notifications')}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer min-h-[44px] relative ${
            activeView === 'notifications'
              ? 'text-amber-400 font-bold bg-amber-500/10'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <div className="relative">
            <Bell className={`w-4 h-4 mb-0.5 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
            {(scanSummary?.anomalieTrovate || 0) > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full text-[8px] font-bold bg-rose-500 text-white animate-pulse">
                {scanSummary?.anomalieTrovate}
              </span>
            )}
          </div>
          <span>Notifiche</span>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer min-h-[44px] ${
              activeView === 'admin'
                ? 'text-purple-300 font-bold bg-purple-500/15'
                : 'text-purple-400/80 hover:text-purple-300'
            }`}
          >
            <Sliders className="w-4 h-4 mb-0.5" />
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* Modal for CUDA-Q Circuit Diagram */}
      <CircuitVisualizerModal
        calculation={selectedCircuitCalc}
        lastState={selectedCircuitState}
        onClose={handleCloseCircuit}
      />

      {/* Desktop Footer status strip */}
      <footer className="hidden sm:flex border-t border-slate-800/80 bg-slate-950 text-slate-500 text-[11px] py-1.5 px-4 font-mono flex-wrap items-center justify-between gap-1.5 shrink-0 overflow-hidden">
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
