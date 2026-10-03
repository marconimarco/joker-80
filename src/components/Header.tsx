import React from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  AlertTriangle, 
  Building2, 
  UserCheck, 
  Terminal, 
  LayoutGrid, 
  Activity,
  Layers,
  Radio,
  Sliders,
  LogOut,
  User,
  Bell,
  UploadCloud
} from 'lucide-react';
import { FactoryTenant, UserAccount, UserRole } from '../types/quantum';

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
  onOpenCsvUpload?: () => void;
}

export const Header: React.FC<Props> = ({
  tenants,
  activeTenant,
  onSelectTenant,
  currentUser,
  onLogout,
  activeView,
  onChangeView,
  anomaliesCount = 0,
  isScanning = false,
  onOpenCompanyPlantSelector,
  onOpenCsvUpload
}) => {
  const isAdmin = currentUser.ruolo === 'Amministratore';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-lg shrink-0">
      {/* Top Banner with Title, Tenant, User/Role and Safety Toggle */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 sm:gap-2.5">
        {/* Brand & System Status */}
        <div className="flex items-center space-x-2 shrink-0">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-xs sm:text-sm font-bold font-mono tracking-tight text-white flex items-center gap-1">
                JOKER 80 <span className="text-cyan-400 font-normal text-[10px] sm:text-xs">Quantum</span>
              </h1>
              <span className="px-1 py-0.2 rounded text-[8px] sm:text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="hidden xs:inline">21 </span>CUDA-Q
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden md:block">
              Middleware Quantistico per l'Automazione Industriale SM.I.LE80
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Multi-Facility & Company Selector Button */}
          <button
            type="button"
            onClick={onOpenCompanyPlantSelector}
            className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 hover:border-cyan-400 text-[11px] font-mono shadow-sm transition-all cursor-pointer group"
            title="Clicca per aprire la selezione completa di Azienda e Stabilimenti"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="flex flex-col text-left">
              <span className="text-[8px] text-cyan-400 uppercase font-bold tracking-wider leading-none">
                {activeTenant.azienda || 'Azienda'}
              </span>
              <span className="font-bold text-white truncate max-w-[90px] xs:max-w-[130px] sm:max-w-[160px] leading-tight text-[10px] sm:text-[11px]">
                {activeTenant.nome.includes(' - ') ? activeTenant.nome.split(' - ')[1] : activeTenant.nome}
              </span>
            </div>
            <span className="text-[9px] text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 px-1.5 py-0.5 rounded font-mono hidden xs:inline">
              Cambia
            </span>
          </button>

          {/* Quick CSV Upload Button */}
          {onOpenCsvUpload && (
            <button
              type="button"
              onClick={onOpenCsvUpload}
              className="flex items-center space-x-1.5 px-2 py-1.5 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 hover:text-white text-[11px] font-mono shadow-sm transition-all cursor-pointer"
              title={`Carica file CSV per lo stabilimento attivo (${activeTenant.nome})`}
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline font-bold">Carica CSV</span>
            </button>
          )}

          {/* Current User Badge with Role indicator */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] sm:text-[11px] font-mono">
            {isAdmin ? (
              <ShieldCheck className="w-3 h-3 text-purple-400 shrink-0" />
            ) : (
              <UserCheck className="w-3 h-3 text-cyan-400 shrink-0" />
            )}
            <span className="font-bold text-slate-200 hidden sm:inline-block max-w-[65px] sm:max-w-[120px] truncate">
              {currentUser.nomeCompleto || currentUser.username}
            </span>
            <span className={`text-[8px] sm:text-[9px] px-1 py-0.2 rounded font-bold border ${
              isAdmin 
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
            }`}>
              {currentUser.ruolo === 'Amministratore' ? 'ADMIN' : 'OP'}
            </span>
          </div>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            className="p-2 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition-colors cursor-pointer min-h-[34px] min-w-[34px] flex items-center justify-center"
            title="Disconnetti e torna al Login"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-header Navigation Tabs */}
      <div className="hidden sm:flex max-w-7xl mx-auto px-2 sm:px-4 items-center justify-between border-t border-slate-800/60 bg-slate-950/60 overflow-hidden">
        <nav aria-label="Sezioni Principali" className="flex items-center gap-1.5 py-1 overflow-x-auto no-scrollbar touch-pan-x flex-nowrap w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onChangeView('chat')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 min-h-[34px] ${
              activeView === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Console Interattiva Router & Solutore Quantistico"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chat Terminal</span>
          </button>

          <button
            type="button"
            onClick={() => onChangeView('catalog')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 min-h-[34px] ${
              activeView === 'catalog'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Catalogo Fabbrica dei 21 Algoritmi CUDA-Q"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Catalogo (21 Calcoli)</span>
          </button>

          {/* Notifiche tab directly next to Catalogo */}
          <button
            type="button"
            onClick={() => onChangeView('notifications')}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 min-h-[34px] relative ${
              activeView === 'notifications'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Centro Notifiche & Problematiche Fuori Linea (Auto-Scan 21 Calcoli)"
          >
            <Bell className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-400' : anomaliesCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span>Notifiche</span>
            {anomaliesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white shadow-sm animate-pulse">
                {anomaliesCount}
              </span>
            )}
          </button>

          {/* Pulsante Selezione Azienda & Stabilimento collocato accanto agli altri pulsanti di navigazione */}
          <button
            type="button"
            onClick={onOpenCompanyPlantSelector}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-cyan-500/30 hover:border-cyan-400 min-h-[34px]"
            title="Seleziona Azienda e Stabilimento (Apri Pagina Multi-Stabilimento)"
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Stabilimenti:</span>
            <span className="text-cyan-300 font-bold">
              {activeTenant.azienda || activeTenant.nome.split(' - ')[0]}
            </span>
            <span className="text-[10px] text-slate-400">
              ({activeTenant.sito.split(',')[0]})
            </span>
          </button>

          {/* Carica CSV Stabilimento tab */}
          {onOpenCsvUpload && (
            <button
              type="button"
              onClick={onOpenCsvUpload}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 hover:border-emerald-400 min-h-[34px]"
              title="Carica manualmente file CSV per aggiornare i sensori e i nodi dello stabilimento attivo"
            >
              <UploadCloud className="w-3.5 h-3.5 text-emerald-400" />
              <span>Carica CSV</span>
            </button>
          )}

          {/* Admin Control Panel Tab */}
          {isAdmin && (
            <button
              type="button"
              onClick={() => onChangeView('admin')}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer shrink-0 min-h-[34px] ${
                activeView === 'admin'
                  ? 'bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-sm font-bold'
                  : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
              title="Pannello Amministrazione Globale Multi-Stabilimento"
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Pannello Admin</span>
            </button>
          )}
        </nav>

        {/* Live Status indicator */}
        <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400 shrink-0">
          <span className="flex items-center gap-1 text-slate-300 truncate max-w-[170px]">
            <Radio className="w-2.5 h-2.5 text-cyan-400" /> {activeTenant.sito}
          </span>
          <span className="text-slate-700">|</span>
          <span>IP: <code className="text-cyan-300">{activeTenant.endpoint}</code></span>
        </div>
      </div>
    </header>
  );
};
