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
  Bell
} from 'lucide-react';
import { FactoryTenant, UserAccount, UserRole } from '../types/quantum';

interface Props {
  tenants: FactoryTenant[];
  activeTenant: FactoryTenant;
  onSelectTenant: (tenant: FactoryTenant) => void;
  currentUser: UserAccount;
  onLogout: () => void;
  allowPlcWrite: boolean;
  onTogglePlcWrite: (allowed: boolean) => void;
  activeView: 'chat' | 'catalog' | 'notifications' | 'telemetry' | 'admin';
  onChangeView: (view: 'chat' | 'catalog' | 'notifications' | 'telemetry' | 'admin') => void;
  anomaliesCount?: number;
  isScanning?: boolean;
}

export const Header: React.FC<Props> = ({
  tenants,
  activeTenant,
  onSelectTenant,
  currentUser,
  onLogout,
  allowPlcWrite,
  onTogglePlcWrite,
  activeView,
  onChangeView,
  anomaliesCount = 0,
  isScanning = false
}) => {
  const isAdmin = currentUser.ruolo === 'Amministratore';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-lg shrink-0">
      {/* Top Banner with Title, Tenant, User/Role and Safety Toggle */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand & System Status */}
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 flex items-center justify-center shrink-0">
            <Cpu className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold font-mono tracking-tight text-white flex items-center gap-1.5">
                JOKER 80 <span className="text-cyan-400 font-normal text-xs">Quantum Core</span>
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                17 CUDA-Q ONLINE
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden md:block">
              Middleware Quantistico per l'Automazione Industriale SM.I.LE80
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {isAdmin ? (
            /* Multi-Facility Switcher: ONLY VISIBLE & ACCESSIBLE BY AMMINISTRATORE */
            <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-purple-500/30 text-[11px] font-mono shadow-sm">
              <Building2 className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-[9px] uppercase font-bold text-purple-400 hidden lg:inline">Sito:</span>
              <select
                value={activeTenant.id}
                onChange={(e) => {
                  const found = tenants.find(t => t.id === e.target.value);
                  if (found) onSelectTenant(found);
                }}
                title="Seleziona stabilimento (Accesso Amministratore)"
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[140px] sm:max-w-[170px] truncate font-semibold"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Fixed Company Badge: OPERATORE */
            <div 
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/30 text-[11px] font-mono shadow-sm"
              title={`Accesso ristretto esclusivamente alla tua società: ${activeTenant.nome}`}
            >
              <Building2 className="w-3 h-3 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[8px] text-cyan-400 uppercase font-bold tracking-wider leading-none">Azienda</span>
                <span className="font-bold text-white truncate max-w-[150px] leading-tight text-[11px]">
                  {activeTenant.nome}
                </span>
              </div>
            </div>
          )}

          {/* Current User Badge with Role indicator */}
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono">
            {isAdmin ? (
              <ShieldCheck className="w-3 h-3 text-purple-400 shrink-0" />
            ) : (
              <UserCheck className="w-3 h-3 text-cyan-400 shrink-0" />
            )}
            <span className="font-bold text-slate-200 max-w-[90px] sm:max-w-[120px] truncate">
              {currentUser.nomeCompleto || currentUser.username}
            </span>
            <span className={`text-[9px] px-1 py-0.2 rounded font-bold border ${
              isAdmin 
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
            }`}>
              {currentUser.ruolo === 'Amministratore' ? 'ADMIN' : 'OPERATORE'}
            </span>
          </div>

          {/* Hardware Safety Switch */}
          <button
            onClick={() => onTogglePlcWrite(!allowPlcWrite)}
            className={`px-2 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
              allowPlcWrite
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
            title="Sicurezza Hardware Industriale"
          >
            {allowPlcWrite ? (
              <>
                <AlertTriangle className="w-3 h-3 text-amber-400 animate-pulse" />
                <span className="hidden sm:inline">SCRITTURA PLC: ATTIVA</span>
                <span className="sm:hidden">SCRITTURA ON</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span className="hidden sm:inline">SOLO LETTURA</span>
                <span className="sm:hidden">LETTURA</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Disconnetti e torna al Login"
          >
            <LogOut className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Sub-header Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 flex items-center justify-between border-t border-slate-800/60 bg-slate-950/60 overflow-hidden">
        <nav className="flex items-center gap-1 py-1 overflow-x-hidden flex-wrap sm:flex-nowrap">
          <button
            onClick={() => onChangeView('chat')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Console Interattiva Router & Solutore Quantistico"
          >
            <Terminal className="w-3 h-3 text-cyan-400" />
            <span>Chat Terminal</span>
          </button>

          <button
            onClick={() => onChangeView('catalog')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeView === 'catalog'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Catalogo Fabbrica dei 17 Algoritmi CUDA-Q"
          >
            <LayoutGrid className="w-3 h-3 text-cyan-400" />
            <span>Catalogo (17 Calcoli)</span>
          </button>

          {/* Notifiche tab directly next to Catalogo */}
          <button
            onClick={() => onChangeView('notifications')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer relative ${
              activeView === 'notifications'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
            title="Centro Notifiche & Problematiche Fuori Linea (Auto-Scan 17 Calcoli)"
          >
            <Bell className={`w-3 h-3 ${isScanning ? 'animate-spin text-amber-400' : anomaliesCount > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span>Notifiche</span>
            {anomaliesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-rose-500 text-white shadow-sm animate-pulse">
                {anomaliesCount}
              </span>
            )}
          </button>

          {/* Telemetria QPU (riservata alla diagnostica hardware per Amministratore, nascosta per operatore standard) */}
          {isAdmin && (
            <button
              onClick={() => onChangeView('telemetry')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'telemetry'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
              title="Telemetria QPU & Architettura del Sistema (Admin)"
            >
              <Activity className="w-3 h-3 text-cyan-400" />
              <span>Telemetria QPU</span>
            </button>
          )}

          {/* Admin Control Panel Tab */}
          {isAdmin && (
            <button
              onClick={() => onChangeView('admin')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-sm font-bold'
                  : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
              title="Pannello Amministrazione Globale Multi-Stabilimento"
            >
              <Sliders className="w-3 h-3 text-purple-400" />
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
