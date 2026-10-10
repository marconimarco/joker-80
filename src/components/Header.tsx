import React from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Building2, 
  UserCheck, 
  Terminal, 
  LayoutGrid, 
  Radio, 
  Sliders, 
  LogOut, 
  Bell,
  MapPin,
  ChevronRight
} from 'lucide-react';
import { FactoryTenant, UserAccount } from '../types/quantum';

interface Props {
  tenants: FactoryTenant[];
  activeTenant: FactoryTenant;
  onSelectTenant: (tenant: FactoryTenant) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  activeView: 'chat' | 'catalog' | 'notifications' | 'admin';
  onChangeView: (view: 'chat' | 'catalog' | 'notifications' | 'admin') => void;
  anomaliesCount?: number;
  isScanning?: boolean;
  onOpenCompanyPlantSelector: () => void;
}

export const Header: React.FC<Props> = ({
  tenants,
  activeTenant,
  currentUser,
  onLogout,
  activeView,
  onChangeView,
  anomaliesCount = 0,
  isScanning = false,
  onOpenCompanyPlantSelector
}) => {
  const isAdmin = currentUser.ruolo === 'Amministratore';
  const isResponsabile = currentUser.ruolo === 'Responsabile di Stabilimento';

  // Number of accessible plants for this user within their company
  const accessiblePlantsCount = React.useMemo(() => {
    if (isAdmin) return tenants.length;
    const userAzienda = (currentUser.azienda || activeTenant.azienda || '').toLowerCase().trim();
    const sameCompanyPlants = tenants.filter(t => (t.azienda || '').toLowerCase().trim() === userAzienda);
    if (currentUser.allowedTenantIds && currentUser.allowedTenantIds.length > 0) {
      return sameCompanyPlants.filter(t => currentUser.allowedTenantIds!.includes(t.id)).length;
    }
    return currentUser.tenantId ? 1 : sameCompanyPlants.length;
  }, [isAdmin, tenants, currentUser, activeTenant]);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl shrink-0">
      {/* ========================================================================= */}
      {/* RIGA 1: Header Superiore - Brand, Stabilimento Connesso, Profilo & Logout */}
      {/* ========================================================================= */}
      <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
        {/* Brand & Architettura Quantistica */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/25 flex items-center justify-center shrink-0 ring-1 ring-cyan-400/40">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
                JOKER 80 <span className="text-cyan-400 font-medium text-xs sm:text-sm">Quantum</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>21 CUDA-Q</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
              Middleware Quantistico SM.I.LE80 • Controllo Impianti Industriali
            </p>
          </div>
        </div>

        {/* Blocco Stabilimento Attivo & Controlli Utente */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-between md:justify-end">
          {/* Card & Pulsante Stabilimento Connesso */}
          <button
            type="button"
            onClick={onOpenCompanyPlantSelector}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-cyan-500/40 hover:border-cyan-400 text-left font-mono transition-all cursor-pointer shadow-sm group"
            title="Clicca per aprire la selezione di Azienda e Stabilimenti"
          >
            <div 
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-white/10 shadow-xs"
              style={{ backgroundColor: activeTenant.logoColor || '#06b6d4' }}
            >
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider truncate max-w-[120px] sm:max-w-[150px]">
                  {activeTenant.azienda || 'Azienda'}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold hidden xs:inline">
                  #{activeTenant.numeroStabilimento || 1}
                </span>
              </div>
              <span className="font-bold text-white text-[11px] sm:text-xs truncate max-w-[140px] xs:max-w-[180px] sm:max-w-[220px]">
                {activeTenant.nome.includes(' - ') ? activeTenant.nome.split(' - ')[1] : activeTenant.nome}
              </span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate max-w-[160px] xs:max-w-[200px] sm:max-w-[240px]">
                <MapPin className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                <span className="truncate">{activeTenant.sito.split(',')[0]}</span>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-400 font-mono truncate">{activeTenant.endpoint.replace('https://', '').replace('/api/v1', '')}</span>
              </div>
            </div>
            <div className="pl-1 border-l border-slate-800 text-[10px] text-cyan-400 font-bold hidden sm:flex items-center gap-0.5 group-hover:text-cyan-300">
              <span>
                {isAdmin 
                  ? 'Cambia' 
                  : accessiblePlantsCount > 1 
                  ? `Altri Stabilimenti (${accessiblePlantsCount})` 
                  : 'Impianto Assegnato'}
              </span>
              <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>

          {/* User Badge & Logout */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
              {isAdmin ? (
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              ) : currentUser.ruolo === 'Responsabile di Stabilimento' ? (
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              ) : (
                <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              )}
              <span className="font-bold text-slate-200 hidden sm:inline-block max-w-[110px] truncate">
                {currentUser.nomeCompleto || currentUser.username}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                isAdmin 
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                  : currentUser.ruolo === 'Responsabile di Stabilimento'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
              }`}>
                {currentUser.ruolo === 'Amministratore' 
                  ? 'ADMIN' 
                  : currentUser.ruolo === 'Responsabile di Stabilimento'
                  ? 'RESPONSABILE'
                  : 'OPERATORE'}
              </span>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
              title="Disconnetti e torna alla schermata di Login"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGA 2: Barra di Navigazione Principale & Sezioni Operative                 */}
      {/* ========================================================================= */}
      <div className="border-t border-slate-800/80 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-3 overflow-x-auto scrollbar-thin">
          <nav aria-label="Sezioni Principali" className="flex items-center gap-2 sm:gap-2.5 flex-nowrap shrink-0">
            {/* 1. Chat Terminal (Solo per Amministratori; gli operatori non hanno bisogno di vedere la Chat Terminal) */}
            {isAdmin && (
              <button
                type="button"
                onClick={() => onChangeView('chat')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
                  activeView === 'chat'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
                title="Console Interattiva Router & Solutore Quantistico"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Chat Terminal</span>
              </button>
            )}

            {/* 2. Catalogo (21 Calcoli) */}
            <button
              type="button"
              onClick={() => onChangeView('catalog')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
                activeView === 'catalog'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
              title="Catalogo Fabbrica dei 21 Algoritmi CUDA-Q con calcoli dello stabilimento"
            >
              <LayoutGrid className="w-4 h-4 text-cyan-400" />
              <span>Catalogo (21 Calcoli)</span>
            </button>

            {/* 3. Notifiche */}
            <button
              type="button"
              onClick={() => onChangeView('notifications')}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] relative ${
                activeView === 'notifications'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-md shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
              }`}
              title="Centro Notifiche & Problematiche Fuori Linea"
            >
              <Bell className={`w-4 h-4 ${isScanning ? 'animate-spin text-amber-400' : anomaliesCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
              <span>Notifiche</span>
              {anomaliesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white shadow-sm animate-pulse">
                  {anomaliesCount}
                </span>
              )}
            </button>

            {/* 4. Pannello Admin / Gestione Operatori (se Amministratore o Responsabile) */}
            {(isAdmin || isResponsabile) && (
              <button
                type="button"
                onClick={() => onChangeView('admin')}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer shrink-0 min-h-[38px] ${
                  activeView === 'admin'
                    ? isResponsabile
                      ? 'bg-amber-500/25 text-amber-200 border border-amber-500/50 shadow-md shadow-amber-500/10'
                      : 'bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-md shadow-purple-500/10'
                    : isResponsabile
                    ? 'text-amber-400/80 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent'
                    : 'text-purple-400/80 hover:text-purple-200 hover:bg-purple-500/10 border border-transparent'
                }`}
                title={isResponsabile ? "Gestione Operatori & Permessi Nodi della tua Azienda" : "Pannello Amministrazione Multi-Stabilimento & Configurazione Flotte"}
              >
                <Sliders className={`w-4 h-4 ${isResponsabile ? 'text-amber-400' : 'text-purple-400'}`} />
                <span>{isResponsabile ? 'Gestione Operatori' : 'Pannello Admin'}</span>
              </button>
            )}
          </nav>

          {/* Dettaglio di Rete e Sicurezza a destra della Riga 2 */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-mono text-slate-400 shrink-0">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span>mTLS TLS 1.3 Attivo</span>
            </span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">
              Impianto: <strong className="text-cyan-300">{activeTenant.nome.split(' - ')[0]}</strong>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
