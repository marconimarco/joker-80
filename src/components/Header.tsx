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
  User
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
  activeView: 'chat' | 'catalog' | 'telemetry' | 'admin';
  onChangeView: (view: 'chat' | 'catalog' | 'telemetry' | 'admin') => void;
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
  onChangeView
}) => {
  const isAdmin = currentUser.ruolo === 'Amministratore';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Banner with Title, Tenant, User/Role and Safety Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & System Status */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
                JOKER 80 <span className="text-cyan-400 font-normal text-sm">Quantum Core</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                17 CUDA-Q ONLINE
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono hidden sm:block">
              Nucleo Computazionale Quantistico Integrato per l'Automazione Industriale
            </p>
          </div>
        </div>

        {/* Global Controls: Multi-Environment Selector (Admin only) vs Fixed Company Badge (Operator) */}
        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin ? (
            /* Multi-Facility Switcher: ONLY VISIBLE & ACCESSIBLE BY AMMINISTRATORE */
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-purple-500/30 text-xs font-mono shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
              <span className="text-[10px] uppercase font-bold text-purple-400 hidden lg:inline">Ambiente:</span>
              <select
                value={activeTenant.id}
                onChange={(e) => {
                  const found = tenants.find(t => t.id === e.target.value);
                  if (found) onSelectTenant(found);
                }}
                title="Seleziona stabilimento (Accesso Amministratore)"
                className="bg-transparent text-slate-200 focus:outline-none cursor-pointer max-w-[175px] truncate font-semibold"
              >
                {tenants.map(t => (
                  <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                    {t.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            /* Fixed Company Badge: OPERATORE CANNOT SEE OR ACCESS ANY OTHER COMPANY */
            <div 
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 text-xs font-mono shadow-sm"
              title={`Accesso ristretto esclusivamente alla tua società: ${activeTenant.nome}`}
            >
              <Building2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] text-cyan-400 uppercase font-bold tracking-wider leading-none">Azienda di Appartenenza</span>
                <span className="font-bold text-white truncate max-w-[185px] leading-tight mt-0.5">
                  {activeTenant.nome}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 hidden xl:inline truncate max-w-[120px]">
                {activeTenant.sito}
              </span>
            </div>
          )}

          {/* Current User Badge with Role indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            {isAdmin ? (
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            ) : (
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-200 max-w-[110px] truncate">
                {currentUser.nomeCompleto || currentUser.username}
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                isAdmin 
                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                  : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
              }`}>
                {currentUser.ruolo === 'Amministratore' ? 'ADMIN' : 'OPERATORE'}
              </span>
            </div>
          </div>

          {/* Hardware Safety Switch */}
          <button
            onClick={() => onTogglePlcWrite(!allowPlcWrite)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
              allowPlcWrite
                ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            }`}
            title="Sicurezza Hardware Industriale"
          >
            {allowPlcWrite ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>SCRITTURA PLC: ATTIVA</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>SOLO LETTURA</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="p-2 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-800 hover:border-rose-500/30 transition-colors"
            title="Disconnetti e torna al Login"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sub-header Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between border-t border-slate-800/60 bg-slate-950/60">
        <nav className="flex space-x-1 py-1.5 overflow-x-auto">
          <button
            onClick={() => onChangeView('chat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeView === 'chat'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Chat Terminal (Router & Solutore)</span>
          </button>

          <button
            onClick={() => onChangeView('catalog')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeView === 'catalog'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
            <span>Catalogo Fabbrica (17 Calcoli)</span>
          </button>

          <button
            onClick={() => onChangeView('telemetry')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
              activeView === 'telemetry'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetria QPU & Architettura</span>
          </button>

          {/* Admin Control Panel Tab (Only accessible if logged in as Amministratore) */}
          {isAdmin && (
            <button
              onClick={() => onChangeView('admin')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-colors whitespace-nowrap ${
                activeView === 'admin'
                  ? 'bg-purple-500/25 text-purple-200 border border-purple-500/50 shadow-sm'
                  : 'text-purple-400/80 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Pannello di Controllo Admin</span>
            </button>
          )}
        </nav>

        {/* Live Status indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1 text-slate-300 truncate max-w-[200px]">
            <Radio className="w-3 h-3 text-cyan-400" /> {activeTenant.sito}
          </span>
          <span className="text-slate-600">|</span>
          <span>IP: <code className="text-cyan-300">{activeTenant.endpoint}</code></span>
        </div>
      </div>
    </header>
  );
};
