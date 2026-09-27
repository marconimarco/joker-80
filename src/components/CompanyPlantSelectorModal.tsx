import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Cpu, 
  CheckCircle2, 
  Radio, 
  ArrowLeft, 
  X, 
  ChevronRight, 
  Search, 
  ShieldCheck, 
  Layers,
  Factory,
  Check
} from 'lucide-react';
import { FactoryTenant } from '../types/quantum';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  tenants: FactoryTenant[];
  activeTenant: FactoryTenant;
  onSelectTenant: (tenant: FactoryTenant) => void;
}

interface CompanyGroup {
  name: string;
  logoColor: string;
  description: string;
  sector: string;
  plants: FactoryTenant[];
}

export const CompanyPlantSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  tenants,
  activeTenant,
  onSelectTenant
}) => {
  const [selectedCompanyName, setSelectedCompanyName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Group tenants by company
  const companyGroups = useMemo<CompanyGroup[]>(() => {
    const map = new Map<string, FactoryTenant[]>();
    
    tenants.forEach(t => {
      const comp = t.azienda || (t.nome.includes(' - ') ? t.nome.split(' - ')[0] : 'Altre Fabbriche');
      if (!map.has(comp)) {
        map.set(comp, []);
      }
      map.get(comp)!.push(t);
    });

    const groups: CompanyGroup[] = [];
    map.forEach((plants, name) => {
      let sector = 'Automazione Industriale';
      let description = 'Stabilimenti integrati con middleware quantistico SM.I.LE80';
      let logoColor = plants[0]?.logoColor || '#06b6d4';

      if (name.includes('Barilla')) {
        sector = 'Food & Pasta Production';
        description = 'Linee confezionamento pasta, SmartStore intensivo e logistica integrata';
        logoColor = '#3b82f6';
      } else if (name.includes('Nestlé')) {
        sector = 'Food & Beverage';
        description = 'Fasciatori Bema ad alta velocità, robotica di pallettizzazione e flotta AGV';
        logoColor = '#ef4444';
      } else if (name.includes('Sant\'Anna')) {
        sector = 'Beverage & Mineral Water';
        description = 'Imbottigliamento ultra-rapido, evacuazione fardelli e carrelli LGV laser';
        logoColor = '#10b981';
      } else if (name.includes('Granarolo')) {
        sector = 'Dairy & Cold Chain Logistics';
        description = 'Tracciabilità isotermica, controllo qualità e stoccaggio refrigerato';
        logoColor = '#0ea5e9';
      } else if (name.includes('Elettric80')) {
        sector = 'Headquarters & Quantum R&D';
        description = 'Laboratori di sperimentazione quantistica CUDA-Q e gateway collaudo SM.I.LE80';
        logoColor = '#14b8a6';
      }

      groups.push({
        name,
        logoColor,
        description,
        sector,
        plants
      });
    });

    return groups;
  }, [tenants]);

  if (!isOpen) return null;

  // Selected company object
  const activeCompany = selectedCompanyName 
    ? companyGroups.find(c => c.name === selectedCompanyName) || null 
    : null;

  // Filter companies or plants based on search query
  const filteredCompanies = companyGroups.filter(c => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchCompany = c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q);
    const matchPlant = c.plants.some(p => p.nome.toLowerCase().includes(q) || p.sito.toLowerCase().includes(q));
    return matchCompany || matchPlant;
  });

  const handleSelectPlant = (plant: FactoryTenant) => {
    onSelectTenant(plant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold font-mono tracking-tight text-white">
                  Seleziona Azienda & Stabilimento
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 hidden xs:inline">
                  SM.I.LE80 Gateway
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Seleziona la società e lo stabilimento per caricare telemetria, notifiche e calcoli dedicati
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Chiudi finestra"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Plant Strip */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/40 border-b border-slate-800 flex items-center justify-between text-xs font-mono shrink-0 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Stabilimento Attivo:</span>
            <span 
              className="w-2.5 h-2.5 rounded-full" 
              style={{ backgroundColor: activeTenant.logoColor || '#06b6d4' }} 
            />
            <strong className="text-cyan-300">{activeTenant.nome}</strong>
            <span className="text-slate-500 hidden sm:inline">({activeTenant.sito})</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>QPU: <strong className="text-slate-200">{activeTenant.plantTopology?.qubitCapacity || 64}Q</strong></span>
          </div>
        </div>

        {/* Search Bar & Breadcrumb Navigation */}
        <div className="px-4 sm:px-6 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0 flex-wrap">
          {/* Breadcrumb / Step Switcher */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              type="button"
              onClick={() => setSelectedCompanyName(null)}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                !selectedCompanyName 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              1. Tutte le Aziende ({companyGroups.length})
            </button>
            {activeCompany && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5">
                  <span 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: activeCompany.logoColor }}
                  />
                  2. {activeCompany.name} ({activeCompany.plants.length} stabilimenti)
                </span>
              </>
            )}
          </div>

          {/* Quick Search Filter */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca azienda o città..."
              className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* STEP 1: Aziende Selection List (Shown if no company is selected) */}
          {!selectedCompanyName ? (
            <div className="space-y-3">
              <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold">
                Seleziona un'azienda per visualizzare i suoi stabilimenti di produzione:
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                {filteredCompanies.map((group) => {
                  const hasActive = group.plants.some(p => p.id === activeTenant.id);

                  return (
                    <div
                      key={group.name}
                      onClick={() => setSelectedCompanyName(group.name)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group relative ${
                        hasActive
                          ? 'bg-slate-950/80 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-950/50 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-950/80'
                      }`}
                    >
                      {hasActive && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                          <Check className="w-3 h-3" /> In Uso
                        </span>
                      )}

                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold font-mono text-white text-base shadow-md shrink-0"
                            style={{ backgroundColor: group.logoColor }}
                          >
                            {group.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 pr-12">
                            <h3 className="font-bold text-base text-white group-hover:text-cyan-300 transition-colors truncate font-mono">
                              {group.name}
                            </h3>
                            <span className="text-[11px] font-mono text-cyan-400/90 font-medium">
                              {group.sector}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {group.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <Factory className="w-3.5 h-3.5 text-cyan-400" />
                          <strong className="text-white">{group.plants.length}</strong> stabilimenti attivi
                        </span>
                        <span className="text-cyan-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform font-semibold">
                          Esplora stabilimenti <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* STEP 2: Stabilimenti for the chosen company */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyName(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Torna alla lista delle aziende
                </button>

                <div className="text-xs font-mono text-slate-400">
                  Stabilimenti di: <strong className="text-white">{activeCompany?.name}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3.5">
                {activeCompany?.plants.map((plant) => {
                  const isCurrent = plant.id === activeTenant.id;
                  const topo = plant.plantTopology;
                  const macchinariCount = topo?.macchinari.length || 6;
                  const agvCount = topo?.flottaAgv.length || 4;
                  const baieCount = topo?.baie.length || 6;

                  return (
                    <div
                      key={plant.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        isCurrent
                          ? 'bg-gradient-to-r from-cyan-950/40 to-slate-950 border-cyan-500 shadow-xl shadow-cyan-500/10'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950/80'
                      }`}
                    >
                      {/* Left: Plant details */}
                      <div className="space-y-2.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: plant.logoColor }}
                          />
                          <h4 className="text-base font-bold font-mono text-white">
                            {plant.nome}
                          </h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500 text-slate-950 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> ATTIVO ORA
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            ONLINE NIS2
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono text-slate-400">
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                            {plant.sito}
                          </span>
                          <span className="text-slate-600">|</span>
                          <span>Gateway: <code className="text-cyan-300">{plant.endpoint}</code></span>
                          <span className="text-slate-600">|</span>
                          <span>PLC IP: <code className="text-slate-300">{plant.plcIp || '10.0.0.1:502'}</code></span>
                        </div>

                        {/* Plant Asset Specs */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {macchinariCount} Macchinari Elettric80
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {agvCount} Navette LGV/AGV
                          </span>
                          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                            {baieCount} Baie di Carico
                          </span>
                          <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                            QPU {topo?.qubitCapacity || 64} Qubit
                          </span>
                        </div>
                      </div>

                      {/* Right: Action button */}
                      <div className="sm:self-center shrink-0">
                        {isCurrent ? (
                          <div className="px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-bold flex items-center gap-2">
                            <Check className="w-4 h-4" />
                            <span>Stabilimento Connesso</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSelectPlant(plant)}
                            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs shadow-md shadow-cyan-600/30 transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02]"
                          >
                            <Factory className="w-4 h-4" />
                            <span>Carica Questo Stabilimento</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between text-xs font-mono text-slate-500 shrink-0">
          <span>Infrastruttura Multi-Tenant SM.I.LE80</span>
          <span>Sincronizzazione Automatica dei 21 Calcoli</span>
        </div>
      </div>
    </div>
  );
};
