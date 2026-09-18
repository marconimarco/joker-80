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
  Radio
} from 'lucide-react';
import { FactoryTenant } from '../types/quantum';
import { CLIENT_TENANTS } from '../data/calculationsMeta';

interface Props {
  activeTenant: FactoryTenant;
  onSelectTenant: (tenant: FactoryTenant) => void;
  userRole: 'Operatore di Linea' | 'Amministratore';
  onChangeRole: (role: 'Operatore di Linea' | 'Amministratore') => void;
  allowPlcWrite: boolean;
  onTogglePlcWrite: (allowed: boolean) => void;
  activeView: 'chat' | 'catalog' | 'telemetry';
  onChangeView: (view: 'chat' | 'catalog' | 'telemetry') => void;
}

export const Header: React.FC<Props> = ({
  activeTenant,
  onSelectTenant,
  userRole,
  onChangeRole,
  allowPlcWrite,
  onTogglePlcWrite,
  activeView,
  onChangeView
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-xl">
      {/* Top Banner with Title, Tenant, Role and Safety Toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & System Status */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <Cpu className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-mono tracking-tight text-white flex items-center gap-2">
                SM.I.LE80 <span className="text-cyan-400 font-normal text-sm">Quantum Core</span>
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

        {/* Global Controls: Tenant, Role, PLC Write Security */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Tenant Selector (Barilla, Nestlé, Sant'Anna, Locale) */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={activeTenant.id}
              onChange={(e) => {
                const found = CLIENT_TENANTS.find(t => t.id === e.target.value);
                if (found) onSelectTenant(found);
              }}
              disabled={userRole !== 'Amministratore'}
              title={userRole !== 'Amministratore' ? 'Solo l\'Amministratore può cambiare tenant' : 'Seleziona stabilimento'}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {CLIENT_TENANTS.map(t => (
                <option key={t.id} value={t.id} className="bg-slate-900 text-slate-100">
                  {t.nome}
                </option>
              ))}
            </select>
          </div>

          {/* User Role Selector */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
            <UserCheck className="w-3.5 h-3.5 text-purple-400" />
            <select
              value={userRole}
              onChange={(e) => onChangeRole(e.target.value as any)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Operatore di Linea" className="bg-slate-900 text-slate-100">Operatore di Linea</option>
              <option value="Amministratore" className="bg-slate-900 text-slate-100">Amministratore</option>
            </select>
          </div>

          {/* Security Hardware Switch: Invio Correzioni a Macchine */}
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
                <span>MODALITÀ SICURA (SOLO LETTURA)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-header Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between border-t border-slate-800/60 bg-slate-950/60">
        <nav className="flex space-x-1 py-1.5">
          <button
            onClick={() => onChangeView('chat')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-colors ${
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
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-colors ${
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
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-2 transition-colors ${
              activeView === 'telemetry'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Telemetria QPU & Architettura</span>
          </button>
        </nav>

        {/* Live Status indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1 text-slate-300">
            <Radio className="w-3 h-3 text-cyan-400" /> {activeTenant.sito}
          </span>
          <span className="text-slate-600">|</span>
          <span>IP: <code className="text-cyan-300">{activeTenant.endpoint}</code></span>
        </div>
      </div>
    </header>
  );
};
