import React, { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Users, 
  ShieldCheck, 
  Server, 
  Activity, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Network,
  Cpu,
  Globe,
  HardDrive,
  Key,
  Sliders,
  Radio,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Copy,
  Check,
  Zap,
  Boxes,
  Truck,
  Layers,
  Wifi,
  WifiOff
} from 'lucide-react';
import { FactoryTenant, UserAccount, IndustrialProtocol } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';
import { 
  PlantAutoDiscoveryService, 
  PLANT_TEMPLATES, 
  PlantTemplatePreset, 
  AutoDiscoveryResult 
} from '../services/plantAutoDiscovery';

interface Props {
  tenants: FactoryTenant[];
  onUpdateTenants: (tenants: FactoryTenant[]) => void;
  activeTenant: FactoryTenant;
  onSelectTenant: (tenant: FactoryTenant) => void;
  currentUser: UserAccount;
}

export const AdminControlPanel: React.FC<Props> = ({
  tenants,
  onUpdateTenants,
  activeTenant,
  onSelectTenant,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'discovery' | 'topology' | 'operators'>('discovery');
  const [users, setUsers] = useState<UserAccount[]>(() => AuthStorage.getUsers());

  // Discovery / Minimal Input Form State
  const [selectedExistingTenantId, setSelectedExistingTenantId] = useState<string | null>(() => activeTenant.id || null);
  const [selectedTemplatePreset, setSelectedTemplatePreset] = useState<PlantTemplatePreset | null>(null);
  const [showAllPlants, setShowAllPlants] = useState<boolean>(false);
  const [plantNome, setPlantNome] = useState(() => activeTenant.nome || '');
  const [plantSito, setPlantSito] = useState(() => activeTenant.sito || '');
  const [plantEndpoint, setPlantEndpoint] = useState(() => activeTenant.endpoint || '');
  const [plantProtocol, setPlantProtocol] = useState<IndustrialProtocol>(() => activeTenant.protocol || 'REST_HTTPS');
  const [plantPlcIp, setPlantPlcIp] = useState(() => activeTenant.plcIp || '');
  const [plantColor, setPlantColor] = useState(() => activeTenant.logoColor || '#3b82f6');
  const [plantApiKey, setPlantApiKey] = useState(() => `E80_SEC_${(activeTenant.id || 'GW').toUpperCase()}_TOKEN_2026`);

  // Execution states
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryStep, setDiscoveryStep] = useState<string>('');
  const [discoveryResult, setDiscoveryResult] = useState<AutoDiscoveryResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<string | null>(null);

  // Manual Operator Creation State (Tab 3)
  const [newOpUsername, setNewOpUsername] = useState('');
  const [newOpNomeCompleto, setNewOpNomeCompleto] = useState('');
  const [newOpPassword, setNewOpPassword] = useState('linea2026');
  const [newOpLinea, setNewOpLinea] = useState('Linea 1 - Inbound & Scarico Baie');
  const [newOpTenantId, setNewOpTenantId] = useState(activeTenant.id);
  const [newOpSuccess, setNewOpSuccess] = useState<string | null>(null);
  const [operatorFilterTenant, setOperatorFilterTenant] = useState<string>('all');

  // Handle Selecting an Existing Saved Plant to load into Form & Test/Reconnect
  const handleSelectExistingTenant = (tenant: FactoryTenant) => {
    setSelectedExistingTenantId(tenant.id);
    setSelectedTemplatePreset(null);
    setShowAllPlants(false);
    setPlantNome(tenant.nome);
    setPlantSito(tenant.sito);
    setPlantEndpoint(tenant.endpoint);
    setPlantProtocol(tenant.protocol || 'REST_HTTPS');
    setPlantPlcIp(tenant.plcIp || '');
    setPlantColor(tenant.logoColor || '#3b82f6');
    setPlantApiKey(`E80_SEC_${tenant.id.toUpperCase()}_TOKEN_2026`);
    setDiscoveryResult(null);
  };

  // Reset form to enter a completely new plant
  const handleClearForm = () => {
    setSelectedExistingTenantId(null);
    setSelectedTemplatePreset(null);
    setShowAllPlants(false);
    setPlantNome('');
    setPlantSito('');
    setPlantEndpoint('');
    setPlantProtocol('REST_HTTPS');
    setPlantPlcIp('');
    setPlantColor('#3b82f6');
    setPlantApiKey('');
    setDiscoveryResult(null);
  };

  // Handle Quick Template Selection
  const handleSelectTemplate = (template: PlantTemplatePreset) => {
    setSelectedExistingTenantId(null);
    setSelectedTemplatePreset(template);
    setShowAllPlants(false);
    setPlantNome(template.nome);
    setPlantSito(template.sito);
    setPlantEndpoint(template.endpoint);
    setPlantProtocol(template.protocol);
    setPlantPlcIp(template.plcIp);
    setPlantColor(template.color);
    setPlantApiKey(`E80_SEC_${template.id.toUpperCase()}_TOKEN_2026`);
    setDiscoveryResult(null);
  };

  // Generate Automatic Safe Token
  const handleGenerateToken = () => {
    const raw = Math.random().toString(36).substring(2, 10).toUpperCase();
    setPlantApiKey(`E80_GW_AUTH_${raw}_2026`);
  };

  // Run Auto-Discovery / Reconnection and Automatic Operator Provisioning
  const handleStartAutoDiscovery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plantNome.trim() || !plantEndpoint.trim()) return;

    setIsDiscovering(true);
    setDiscoveryResult(null);

    const isReconnecting = !!selectedExistingTenantId;

    try {
      setDiscoveryStep(isReconnecting
        ? '1/4: Stabilimento handshake mTLS con Gateway e verifica latenza...'
        : '1/4: Stabilimento handshake di rete e verifica certificati mTLS...');
      await new Promise(r => setTimeout(r, 600));

      setDiscoveryStep(isReconnecting
        ? '2/4: Interrogazione SM.I.LE80 e controllo modifiche topologiche reparti...'
        : '2/4: Scansione topologica SM.I.LE80 (Reparti Inbound, WMS, BEMA, Outbound)...');
      await new Promise(r => setTimeout(r, 700));

      setDiscoveryStep(isReconnecting
        ? '3/4: Rilevamento telemetria live e scansione nuovi macchinari / flotta AGV...'
        : '3/4: Rilevamento telemetria macchine, tag PLC e flotta AGV...');
      await new Promise(r => setTimeout(r, 600));

      setDiscoveryStep(isReconnecting
        ? '4/4: Ricalcolo matrice QPU ed allineamento credenziali operatori...'
        : '4/4: Dimensionamento matrice QPU e generazione automatica account operatori...');
      
      const result = await PlantAutoDiscoveryService.discoverAndConnectPlant({
        nome: plantNome,
        sito: plantSito || 'Stabilimento di Produzione',
        endpoint: plantEndpoint,
        protocol: plantProtocol,
        plcIp: plantPlcIp,
        logoColor: plantColor,
        wmsApiKey: plantApiKey,
        existingTenantId: selectedExistingTenantId || undefined
      });

      // Update state in app
      const updatedTenants = AuthStorage.getTenants();
      const updatedUsers = AuthStorage.getUsers();
      onUpdateTenants(updatedTenants);
      setUsers(updatedUsers);
      onSelectTenant(result.tenant);

      setDiscoveryResult(result);
      setSelectedExistingTenantId(result.tenant.id);
      setSelectedTemplatePreset(null);
      setShowAllPlants(false);
    } catch (err: any) {
      alert(`Errore durante il collegamento: ${err.message}`);
    } finally {
      setIsDiscovering(false);
      setDiscoveryStep('');
    }
  };

  // Re-sync existing plant telemetry
  const handleResync = async (tenant: FactoryTenant) => {
    setIsSyncing(tenant.id);
    try {
      const updated = await PlantAutoDiscoveryService.resyncTenant(tenant);
      const allTenants = AuthStorage.getTenants();
      onUpdateTenants(allTenants);
      if (activeTenant.id === tenant.id) {
        onSelectTenant(updated);
      }
    } finally {
      setIsSyncing(null);
    }
  };

  // Delete Tenant
  const handleDeleteTenant = (id: string, nome: string) => {
    if (id === 'local') {
      alert('Non è possibile eliminare l\'ambiente locale di simulazione base.');
      return;
    }
    if (window.confirm(`Sei sicuro di voler rimuovere lo stabilimento "${nome}"? Gli operatori assegnati non potranno più accedere.`)) {
      AuthStorage.deleteTenant(id);
      const updated = AuthStorage.getTenants();
      onUpdateTenants(updated);
      if (activeTenant.id === id) {
        onSelectTenant(updated[0]);
      }
    }
  };

  // Copy helper
  const handleCopyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Manual Operator Creation Handler (Tab 3)
  const handleCreateManualOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpUsername.trim() || !newOpNomeCompleto.trim()) return;

    if (users.some(u => u.username.toLowerCase() === newOpUsername.trim().toLowerCase())) {
      alert('Un operatore con questo username esiste già!');
      return;
    }

    const created = AuthStorage.addUser({
      username: newOpUsername.trim(),
      nomeCompleto: newOpNomeCompleto.trim(),
      ruolo: 'Operatore di Linea',
      password: newOpPassword.trim() || 'linea2026',
      lineaAssegnata: newOpLinea,
      tenantId: newOpTenantId,
      attivo: true
    });

    const updatedUsers = AuthStorage.getUsers();
    setUsers(updatedUsers);
    setNewOpSuccess(`Operatore "${created.nomeCompleto}" (${created.username}) abilitato all'accesso per lo stabilimento selezionato!`);
    setNewOpUsername('');
    setNewOpNomeCompleto('');
    setTimeout(() => setNewOpSuccess(null), 5000);
  };

  const handleDeleteUser = (id: string, username: string) => {
    if (username === 'admin') {
      alert('Non puoi eliminare l\'amministratore principale.');
      return;
    }
    if (window.confirm(`Rimuovere l'operatore ${username}?`)) {
      AuthStorage.deleteUser(id);
      setUsers(AuthStorage.getUsers());
    }
  };

  const handleToggleUserActive = (id: string) => {
    const updated = users.map(u => {
      if (u.id === id && u.username !== 'admin') {
        return { ...u, attivo: !u.attivo };
      }
      return u;
    });
    AuthStorage.saveUsers(updated);
    setUsers(updated);
  };

  const filteredOperators = users.filter(u => {
    if (u.ruolo !== 'Operatore di Linea') return false;
    if (operatorFilterTenant === 'all') return true;
    return u.tenantId === operatorFilterTenant;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-slate-900 to-cyan-950/30 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              Pannello Amministratore Joker 80
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Super-Admin
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Connessione dinamica e Auto-Discovery SM.I.LE80: inserimento minimo, scansione automatica macchine e generazione automatica degli account dipendenti.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('discovery')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'discovery'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Connessione Rapida & Sedi ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('topology')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'topology'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Digital Twin & Macchine ({activeTenant.plantTopology?.macchinari.length || 0})</span>
          </button>

          <button
            onClick={() => setActiveTab('operators')}
            className={`px-3.5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'operators'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Operatori Generati ({users.filter(u => u.ruolo === 'Operatore di Linea').length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONNESSIONE RAPIDA, AUTO-DISCOVERY & SEDI */}
      {activeTab === 'discovery' && (
        <div className="space-y-6">
          {/* Preset & Existing Plants Test Selector */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <span className="text-xs font-mono font-bold text-slate-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Banco di Prova & Connessione Rapida SM.I.LE80
                </span>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                  Clicca su uno stabilimento esistente per caricarne i dati e testare la riconnessione, oppure prova un nuovo modello.
                </p>
              </div>

              {(selectedExistingTenantId || selectedTemplatePreset) && (
                <button
                  onClick={handleClearForm}
                  className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-mono flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuovo Stabilimento (Pulisci Modulo)</span>
                </button>
              )}
            </div>

            {/* SEZIONE 1: STABILIMENTI GIÀ SALVATI E ATTIVI */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>1. Stabilimenti Già Presenti & Salvati ({tenants.length}):</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {tenants.map(t => {
                  const isSelected = selectedExistingTenantId === t.id && !selectedTemplatePreset;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectExistingTenant(t)}
                      className={`p-2 rounded-lg text-left transition-all group cursor-pointer border ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-400 ring-1 ring-cyan-500/50 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 hover:border-cyan-500/40 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-[11px] font-bold font-mono truncate ${
                          isSelected ? 'text-cyan-300' : 'text-slate-100 group-hover:text-cyan-300'
                        }`}>
                          {t.nome}
                        </span>
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: t.logoColor || '#06b6d4' }}
                        />
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                        {t.sito}
                      </div>

                      <div className="text-[9px] font-mono text-slate-500 mt-0.5 truncate">
                        {t.id === activeTenant.id ? 'Attualmente in uso • Connesso' : 'Stabilimento salvato • Clicca per caricare'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SEZIONE 2: MODELLI / TEMPLATE SM.I.LE80 DA COLLEGARE */}
            <div className="space-y-1.5 pt-1.5 border-t border-slate-800/60">
              <div className="text-[10px] font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>2. Template Nuovi Modelli SM.I.LE80:</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {PLANT_TEMPLATES.map(tmpl => {
                  const isSelected = selectedTemplatePreset?.id === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`p-2 rounded-lg text-left transition-all group cursor-pointer border ${
                        isSelected
                          ? 'bg-purple-950/70 border-purple-400 ring-1 ring-purple-500/50 shadow-sm'
                          : 'bg-slate-950/70 border-slate-800 hover:border-purple-500/40 hover:bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={`text-[11px] font-bold font-mono truncate ${
                          isSelected ? 'text-purple-300' : 'text-slate-100 group-hover:text-purple-300'
                        }`}>
                          {tmpl.brand}
                        </span>
                        <span 
                          className="w-2 h-2 rounded-full shrink-0" 
                          style={{ backgroundColor: tmpl.color }}
                        />
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                        {tmpl.sito}
                      </div>

                      <div className="text-[9px] font-mono text-slate-500 mt-0.5 truncate">
                        {tmpl.descrizione}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Grid: Form on Left, Discovered Result / Plant List on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Minimal Data Input Form */}
            <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
              <div className="border-b border-slate-800 pb-3 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${selectedExistingTenantId ? 'text-cyan-400' : 'text-purple-400'}`} />
                    {selectedExistingTenantId 
                      ? `Riconnessione & Scansione Aggiornamenti: ${plantNome || 'Impianto'}`
                      : 'Connessione a Nuovo Stabilimento SM.I.LE80'
                    }
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 font-mono">
                    {selectedExistingTenantId
                      ? 'Dati correnti caricati dallo stabilimento salvato. Avviando la connessione verranno testati i parametri, aggiornata la telemetria e rilevati eventuali nuovi macchinari.'
                      : 'Inserisci solo il minimo indispensabile. L\'Auto-Discovery scansionerà macchinari, LGV e creerà automaticamente gli operatori.'
                    }
                  </p>
                </div>

                {selectedExistingTenantId && (
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="text-[11px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors shrink-0"
                    title="Pulisci modulo per inserire un nuovo stabilimento"
                  >
                    + Pulisci Modulo
                  </button>
                )}
              </div>

              {/* Status Banner when existing plant is selected */}
              {selectedExistingTenantId && (
                <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-[11px] font-mono text-cyan-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Stabilimento Esistente Selezionato per Test di Connessione</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-200 text-[10px] font-bold">
                    IN BANCO PROVA
                  </span>
                </div>
              )}

              <form onSubmit={handleStartAutoDiscovery} className="space-y-4 text-xs font-mono">
                {/* 1. Nome Stabilimento */}
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1 font-bold">
                    <Building2 className="w-3.5 h-3.5 text-purple-400" />
                    1. Nome Stabilimento / Brand *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. Ferrero (Stabilimento Alba), Lavazza, Campari..."
                    value={plantNome}
                    onChange={e => setPlantNome(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                {/* 2. Ubicazione */}
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1 font-bold">
                    <Globe className="w-3.5 h-3.5 text-cyan-400" />
                    2. Città / Sito Geografico
                  </label>
                  <input
                    type="text"
                    placeholder="Es. Alba (CN), Settimo Torinese (TO), Novi Ligure..."
                    value={plantSito}
                    onChange={e => setPlantSito(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                {/* 3. Endpoint Gateway SM.I.LE80 */}
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1 font-bold">
                    <Network className="w-3.5 h-3.5 text-emerald-400" />
                    3. Host Gateway o URL Middleware SM.I.LE80 *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Es. https://ferrero-alba.smile80.net/api/v1 o 192.168.10.20:8080"
                    value={plantEndpoint}
                    onChange={e => setPlantEndpoint(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 placeholder:text-slate-600 font-mono"
                  />
                </div>

                {/* 4. Protocollo & Colore */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-300 flex items-center gap-1 font-bold">
                      <Radio className="w-3.5 h-3.5 text-cyan-400" />
                      4. Protocollo Industriale
                    </label>
                    <select
                      value={plantProtocol}
                      onChange={e => setPlantProtocol(e.target.value as IndustrialProtocol)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100"
                    >
                      <option value="REST_HTTPS">REST API (HTTPS / JSON)</option>
                      <option value="OPC_UA">OPC-UA (Binary TCP:4840)</option>
                      <option value="MQTT">MQTT Broker (Telemetry E80)</option>
                      <option value="SIEMENS_S7">Siemens S7-1500 (Industrial Ethernet)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-300 flex items-center gap-1 font-bold">
                      <Sliders className="w-3.5 h-3.5 text-purple-400" />
                      Colore Badge Fabbrica
                    </label>
                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="color"
                        value={plantColor}
                        onChange={e => setPlantColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                      />
                      <span className="text-[11px] text-slate-400 font-mono">{plantColor}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Token / Chiave Gateway con generatore automatico */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 flex items-center gap-1 font-bold">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      5. Token Gateway / Password API
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateToken}
                      className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
                    >
                      <Sparkles className="w-3 h-3" /> Genera Token Automatico
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Esempio: E80_SEC_TOKEN_2026..."
                    value={plantApiKey}
                    onChange={e => setPlantApiKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder:text-slate-600 font-mono"
                  />
                </div>

                {/* Submit Action Button */}
                <button
                  type="submit"
                  disabled={isDiscovering || !plantNome.trim() || !plantEndpoint.trim()}
                  className={`w-full py-3 px-4 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 transition-all cursor-pointer text-xs ${
                    selectedExistingTenantId
                      ? 'bg-gradient-to-r from-cyan-600 via-indigo-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 shadow-cyan-600/20'
                      : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 shadow-purple-600/20'
                  }`}
                >
                  {isDiscovering ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{discoveryStep || 'Connessione e Auto-Discovery in corso...'}</span>
                    </>
                  ) : selectedExistingTenantId ? (
                    <>
                      <Zap className="w-4 h-4 text-cyan-300" />
                      <span>⚡ Riconnetti a SM.I.LE80 & Rileva Nuovi Macchinari / Aggiornamenti</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>⚡ Connetti a SM.I.LE80 & Avvia Auto-Discovery Impianto</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right: Live Discovery Result & Connected Plants */}
            <div className="lg:col-span-6 space-y-4">
              
              {/* If Discovering / Connecting: Live Step Progress Card */}
              {isDiscovering && (
                <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 shadow-xl space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin shrink-0" />
                    <div>
                      <h4 className="text-xs font-bold font-mono text-cyan-200">
                        {selectedExistingTenantId 
                          ? 'Riconnessione & Scansione Nuovi Macchinari in Corso...' 
                          : 'Connessione e Auto-Discovery SM.I.LE80 in Corso...'}
                      </h4>
                      <p className="text-[11px] font-mono text-slate-300 mt-0.5">
                        {discoveryStep || 'Verifica handshake di rete e scansione macchinari...'}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 h-1.5 rounded-full animate-pulse w-3/4" />
                  </div>
                </div>
              )}

              {/* If Discovery/Reconnection Completed: Beautiful Summary Card */}
              {discoveryResult && (
                <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between border-b border-emerald-500/30 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono text-white">
                          {discoveryResult.isReconnection 
                            ? 'Riconnessione & Auto-Discovery Completati con Successo!' 
                            : 'Auto-Discovery SM.I.LE80 Completato con Successo!'}
                        </h4>
                        <p className="text-[11px] text-emerald-300/80 font-mono">
                          Impianto: <strong className="text-white">{discoveryResult.tenant.nome}</strong> (Latenza: {discoveryResult.summary.handshakeLatencyMs}ms)
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {discoveryResult.summary.newMachinesDiscoveredCount && discoveryResult.summary.newMachinesDiscoveredCount > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          +{discoveryResult.summary.newMachinesDiscoveredCount} Nuovi Asset
                        </span>
                      ) : null}
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        ATTIVO & SINCRONIZZATO
                      </span>
                    </div>
                  </div>

                  {/* Discovered Topology Stats */}
                  <div className="grid grid-cols-4 gap-2 text-center font-mono">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Reparti</div>
                      <div className="text-sm font-bold text-cyan-400">{discoveryResult.summary.repartiCount}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Macchinari</div>
                      <div className="text-sm font-bold text-purple-400">{discoveryResult.summary.macchinariCount}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">Flotta LGV</div>
                      <div className="text-sm font-bold text-emerald-400">{discoveryResult.summary.agvCount}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
                      <div className="text-[10px] text-slate-400">QPU Qubits</div>
                      <div className="text-sm font-bold text-amber-400">{discoveryResult.summary.qubitsAllocated}</div>
                    </div>
                  </div>

                  {/* Discovered / Updated Events List */}
                  {discoveryResult.newDiscoveredItems && discoveryResult.newDiscoveredItems.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/20 space-y-1.5">
                      <div className="text-[11px] font-mono font-bold text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Dettagli Scansione e Rilevamenti Topologia:</span>
                      </div>
                      <div className="space-y-1 text-[10px] font-mono text-slate-300">
                        {discoveryResult.newDiscoveredItems.map((item, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Created/Verified Operator Credentials Table */}
                  <div className="space-y-2">
                    <div className="text-xs font-mono font-bold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-cyan-300">
                        <Users className="w-3.5 h-3.5" />
                        Account Operatori di Linea Allineati ({discoveryResult.createdOperators.length}):
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {discoveryResult.createdOperators.map(op => (
                        <div
                          key={op.id}
                          className="p-2 rounded-lg bg-slate-950/90 border border-slate-800 flex items-center justify-between text-[11px] font-mono"
                        >
                          <div>
                            <div className="text-slate-200 font-bold">{op.nomeCompleto}</div>
                            <div className="text-slate-400 flex items-center gap-2">
                              <span>User: <code className="text-cyan-400">{op.username}</code></span>
                              <span>•</span>
                              <span>Pass: <code className="text-amber-400">{op.password}</code></span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCopyText(`${op.username} / ${op.password}`, op.id)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 transition-colors"
                            title="Copia credenziali di login"
                          >
                            {copiedKey === op.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Stabilimento Connesso Card (Single Plant View by default) */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-400" />
                      {showAllPlants ? `Stabilimenti Connessi (${tenants.length})` : 'Stabilimento Connesso'}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      {showAllPlants 
                        ? 'Elenco completo degli stabilimenti registrati nel sistema.' 
                        : 'Visualizzazione dello stabilimento selezionato nel Banco di Prova SM.I.LE80.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAllPlants(!showAllPlants)}
                    className="text-[10px] font-mono text-slate-400 hover:text-cyan-300 underline transition-colors cursor-pointer shrink-0"
                  >
                    {showAllPlants ? '← Mostra solo stabilimento selezionato' : `Mostra tutti (${tenants.length})`}
                  </button>
                </div>

                {/* VISTA 1: TEMPLATE PRESET SELEZIONATO IN ATTESA DI CONNESSIONE */}
                {!showAllPlants && selectedTemplatePreset && !selectedExistingTenantId && (
                  <div className="p-4 rounded-xl border border-purple-500/40 bg-purple-950/20 shadow-sm space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: selectedTemplatePreset.color }}
                          />
                          <span className="font-mono font-bold text-xs text-white">
                            {selectedTemplatePreset.brand}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            TEMPLATE PRONTO PER CONNESSIONE
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-300">
                          Sede: <span className="text-white">{selectedTemplatePreset.sito}</span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          {selectedTemplatePreset.descrizione}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-3">
                          <span>GW Previsto: <code className="text-purple-400">{selectedTemplatePreset.endpoint}</code></span>
                          <span>Prot: <span className="text-slate-300">{selectedTemplatePreset.protocol}</span></span>
                          <span>PLC IP: <span className="text-slate-300">{selectedTemplatePreset.plcIp}</span></span>
                        </div>
                      </div>

                      <button
                        onClick={handleStartAutoDiscovery}
                        disabled={isDiscovering}
                        className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center gap-2 cursor-pointer shrink-0 transition-all disabled:opacity-40"
                      >
                        <Zap className="w-3.5 h-3.5 text-amber-300" />
                        <span>Connetti & Avvia Discovery</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* VISTA 2: STABILIMENTO SINGOLO SELEZIONATO (O ATTIVO) */}
                {!showAllPlants && (!selectedTemplatePreset || selectedExistingTenantId) && (() => {
                  const targetTenant = (selectedExistingTenantId ? tenants.find(t => t.id === selectedExistingTenantId) : null) || tenants.find(t => t.id === activeTenant.id) || tenants[0];
                  if (!targetTenant) return null;

                  const isActive = targetTenant.id === activeTenant.id;
                  const isLoadedInForm = selectedExistingTenantId === targetTenant.id;
                  const topo = targetTenant.plantTopology;

                  return (
                    <div
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isLoadedInForm
                          ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/40 shadow-sm'
                          : isActive
                          ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: targetTenant.logoColor || '#06b6d4' }}
                          />
                          <span className="font-mono font-bold text-xs text-slate-100">
                            {targetTenant.nome}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              ATTIVO
                            </span>
                          )}
                          {isLoadedInForm && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                              NEL MODULO
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-1">
                            <Wifi className="w-2.5 h-2.5" />
                            {targetTenant.connectionStatus || 'CONNESSO'}
                          </span>
                        </div>

                        <div className="text-[11px] font-mono text-slate-400">
                          Sito: <span className="text-slate-300">{targetTenant.sito}</span>
                          {topo && (
                            <span className="ml-2 text-cyan-400/80">
                              ({topo.macchinari.length} Macchine, {topo.flottaAgv.length} LGV, QPU {topo.qubitCapacity} Qubits)
                            </span>
                          )}
                        </div>

                        <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span>GW: <code className="text-cyan-400">{targetTenant.endpoint}</code></span>
                          {targetTenant.protocol && <span>Prot: <span className="text-slate-300">{targetTenant.protocol}</span></span>}
                          {targetTenant.plcIp && <span>PLC: <span className="text-slate-300">{targetTenant.plcIp}</span></span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                        {/* Load into Form & Test Button */}
                        <button
                          onClick={() => handleSelectExistingTenant(targetTenant)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                            isLoadedInForm
                              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                          }`}
                          title="Carica dati nel modulo per testare riconnessione e nuovi macchinari"
                        >
                          <Zap className="w-3 h-3 text-amber-400" />
                          <span>{isLoadedInForm ? 'Dati nel Modulo' : 'Carica Dati'}</span>
                        </button>

                        {/* Re-sync Telemetry Button */}
                        <button
                          onClick={() => handleResync(targetTenant)}
                          disabled={isSyncing === targetTenant.id}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                          title="Risincronizza telemetria da SM.I.LE80"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing === targetTenant.id ? 'animate-spin text-cyan-400' : ''}`} />
                        </button>

                        {!isActive ? (
                          <button
                            onClick={() => onSelectTenant(targetTenant)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                          >
                            Connetti
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 px-3 py-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>In Uso</span>
                          </div>
                        )}

                        {targetTenant.id !== 'local' && (
                          <button
                            onClick={() => handleDeleteTenant(targetTenant.id, targetTenant.nome)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Rimuovi ambiente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* VISTA 3: TUTTI GLI STABILIMENTI (SOLO SE L'UTENTE CLICCA 'MOSTRA TUTTI') */}
                {showAllPlants && (
                  <div className="space-y-3">
                    {tenants.map(t => {
                      const isActive = t.id === activeTenant.id;
                      const isLoadedInForm = selectedExistingTenantId === t.id;
                      const topo = t.plantTopology;
                      return (
                        <div
                          key={t.id}
                          className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                            isLoadedInForm
                              ? 'bg-cyan-950/40 border-cyan-400 ring-1 ring-cyan-500/40 shadow-sm'
                              : isActive
                              ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span 
                                className="w-3 h-3 rounded-full shrink-0" 
                                style={{ backgroundColor: t.logoColor || '#06b6d4' }}
                              />
                              <span className="font-mono font-bold text-xs text-slate-100">
                                {t.nome}
                              </span>
                              {isActive && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                                  ATTIVO
                                </span>
                              )}
                              {isLoadedInForm && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                                  NEL MODULO
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-emerald-400 border border-slate-700 flex items-center gap-1">
                                <Wifi className="w-2.5 h-2.5" />
                                {t.connectionStatus || 'CONNESSO'}
                              </span>
                            </div>

                            <div className="text-[11px] font-mono text-slate-400">
                              Sito: <span className="text-slate-300">{t.sito}</span>
                              {topo && (
                                <span className="ml-2 text-cyan-400/80">
                                  ({topo.macchinari.length} Macchine, {topo.flottaAgv.length} LGV, QPU {topo.qubitCapacity} Qubits)
                                </span>
                              )}
                            </div>

                            <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>GW: <code className="text-cyan-400">{t.endpoint}</code></span>
                              {t.protocol && <span>Prot: <span className="text-slate-300">{t.protocol}</span></span>}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center shrink-0 flex-wrap">
                            <button
                              onClick={() => handleSelectExistingTenant(t)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center gap-1 cursor-pointer ${
                                isLoadedInForm
                                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                              }`}
                              title="Carica dati nel modulo per testare riconnessione e nuovi macchinari"
                            >
                              <Zap className="w-3 h-3 text-amber-400" />
                              <span>Carica Dati</span>
                            </button>

                            <button
                              onClick={() => handleResync(t)}
                              disabled={isSyncing === t.id}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                              title="Risincronizza telemetria da SM.I.LE80"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing === t.id ? 'animate-spin text-cyan-400' : ''}`} />
                            </button>

                            {!isActive ? (
                              <button
                                onClick={() => onSelectTenant(t)}
                                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-mono border border-slate-700 transition-colors cursor-pointer"
                              >
                                Connetti
                              </button>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 px-3 py-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                                <span>In Uso</span>
                              </div>
                            )}

                            {t.id !== 'local' && (
                              <button
                                onClick={() => handleDeleteTenant(t.id, t.nome)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                title="Rimuovi ambiente"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIGITAL TWIN & MACCHINE DELLO STABILIMENTO ATTIVO */}
      {activeTab === 'topology' && (
        <div className="space-y-6">
          {/* Active Plant Topology Header */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <span 
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: activeTenant.logoColor || '#06b6d4' }}
                />
                <div>
                  <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                    Digital Twin: {activeTenant.nome}
                    <span className="px-2 py-0.5 text-[10px] rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      LIVE TELEMETRY
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Sito: {activeTenant.sito} | Gateway: <code className="text-cyan-400">{activeTenant.endpoint}</code> [{activeTenant.protocol || 'REST_HTTPS'}]
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleResync(activeTenant)}
                disabled={isSyncing === activeTenant.id}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-mono border border-slate-700 flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing === activeTenant.id ? 'animate-spin' : ''}`} />
                <span>Aggiorna Dati da SM.I.LE80</span>
              </button>
            </div>

            {/* QPU Dimensioning & Hamiltonian Matrix Spec */}
            {activeTenant.plantTopology && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> QPU Qubits Allocati:
                  </div>
                  <div className="text-base font-bold text-white mt-1">
                    {activeTenant.plantTopology.qubitCapacity} Qubit Logici
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-purple-400" /> Matrice Hamiltoniana:
                  </div>
                  <div className="text-base font-bold text-purple-300 mt-1 truncate">
                    {activeTenant.plantTopology.qpuDimensioning.hamiltonianSize}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-emerald-400" /> Backend Simulatore:
                  </div>
                  <div className="text-xs font-bold text-emerald-300 mt-1 truncate">
                    {activeTenant.plantTopology.qpuDimensioning.simulatorBackend}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section: Machinery & Sensors */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-cyan-400" />
              Macchinari di Fabbrica & Tag PLC Rilevati ({activeTenant.plantTopology?.macchinari.length || 0})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeTenant.plantTopology?.macchinari.map(mac => (
                <div
                  key={mac.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-100 truncate">{mac.nome}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {mac.stato}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Reparto: <span className="text-slate-300">{mac.reparto}</span>
                  </div>

                  <div className="text-[10px] text-amber-300/90 flex items-center gap-1">
                    <span>PLC Tag:</span> <code className="bg-slate-900 px-1 py-0.5 rounded">{mac.plcTag}</code>
                  </div>

                  {mac.telemetria && (
                    <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex flex-wrap gap-x-2 gap-y-1">
                      {Object.entries(mac.telemetria).map(([k, v]) => (
                        <span key={k} className="bg-slate-900/80 px-1.5 py-0.5 rounded text-cyan-300">
                          {k}: <strong>{String(v)}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section: AGV / LGV Fleet */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400" />
              Flotta Veicoli a Guida Laser LGV / AGV E80 ({activeTenant.plantTopology?.flottaAgv.length || 0})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {activeTenant.plantTopology?.flottaAgv.map(agv => (
                <div
                  key={agv.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{agv.id}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      agv.stato === 'MISSIONE'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : agv.stato === 'IN_CARICA'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {agv.stato}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate">{agv.modello}</div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Batteria SoC:</span>
                    <span className={`font-bold ${agv.batteriaSoC > 50 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {agv.batteriaSoC}% ({agv.temperatura}°C)
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-500 truncate">
                    Pos: <span className="text-slate-300">{agv.posizione}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section: Loading / Unloading Bays */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <h4 className="text-xs font-bold font-mono text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-400" />
              Baie di Carico e Scarico Inbound / Outbound ({activeTenant.plantTopology?.baie.length || 0})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
              {activeTenant.plantTopology?.baie.map(baia => (
                <div
                  key={baia.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">{baia.nome}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                      baia.stato === 'LIBERA'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : baia.stato === 'OCCUPATA'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    }`}>
                      {baia.stato}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    Tipo: <span className="text-cyan-300 font-bold">{baia.tipo}</span>
                  </div>

                  {baia.camionAssegnato && (
                    <div className="text-[10px] text-amber-300/90 truncate">
                      Veicolo: {baia.camionAssegnato}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GESTIONE OPERATORI & PERSONALE */}
      {activeTab === 'operators' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Manual Operator Form (optional addition) */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Aggiungi Singolo Operatore Manuale
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-mono">
                Gli account operatore per gli stabilimenti vengono normalmente generati in automatico durante l'Auto-Discovery. Qui puoi crearne di addizionali se necessario.
              </p>
            </div>

            {newOpSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{newOpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateManualOperator} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  Stabilimento Assegnato *
                </label>
                <select
                  value={newOpTenantId}
                  onChange={e => setNewOpTenantId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-slate-100"
                >
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Nome e Cognome Operatore *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Mario Rossi, Laura Bianchi..."
                  value={newOpNomeCompleto}
                  onChange={e => setNewOpNomeCompleto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Username di Accesso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. op_rossi, op_ferrero_3..."
                  value={newOpUsername}
                  onChange={e => setNewOpUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Key className="w-3.5 h-3.5 text-purple-400" />
                  Password Assegnata *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Password di login..."
                  value={newOpPassword}
                  onChange={e => setNewOpPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1 font-bold">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Linea di Produzione Assegnata
                </label>
                <input
                  type="text"
                  value={newOpLinea}
                  onChange={e => setNewOpLinea(e.target.value)}
                  placeholder="Es. Linea 1 - Inbound, Linea 3 - Bema Silkworm..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salva Operatore</span>
              </button>
            </form>
          </div>

          {/* Right: Existing Operators List with Tenant Badges */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  Personale & Operatori Abilitati ({filteredOperators.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Accesso ristretto e vincolato rigorosamente al rispettivo stabilimento.
                </p>
              </div>

              {/* Filter by Tenant */}
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-slate-400">Filtra:</span>
                <select
                  value={operatorFilterTenant}
                  onChange={e => setOperatorFilterTenant(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none"
                >
                  <option value="all">Tutti gli Stabilimenti</option>
                  {tenants.map(t => (
                    <option key={t.id} value={t.id}>{t.nome}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredOperators.map(op => {
                const assignedTenant = tenants.find(t => t.id === op.tenantId);
                return (
                  <div
                    key={op.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      op.attivo
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-slate-950/30 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="space-y-1 font-mono">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-xs text-slate-100">
                          {op.nomeCompleto}
                        </span>
                        {assignedTenant && (
                          <span 
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-white"
                            style={{ backgroundColor: `${assignedTenant.logoColor || '#3b82f6'}33`, border: `1px solid ${assignedTenant.logoColor || '#3b82f6'}88` }}
                          >
                            {assignedTenant.nome.split('(')[0].trim()}
                          </span>
                        )}
                        {!op.attivo && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            DISABILITATO
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400">
                        Linea: <span className="text-slate-300">{op.lineaAssegnata}</span>
                      </div>

                      <div className="text-[10px] text-slate-500 flex items-center gap-3">
                        <span>Username: <code className="text-cyan-400">{op.username}</code></span>
                        <span>Password: <code className="text-amber-400">{op.password}</code></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => handleCopyText(`${op.username} / ${op.password}`, op.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Copia credenziali"
                      >
                        {copiedKey === op.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleToggleUserActive(op.id)}
                        className={`px-2 py-1 rounded text-[10px] font-mono border transition-colors ${
                          op.attivo
                            ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        }`}
                      >
                        {op.attivo ? 'Sospendi' : 'Riattiva'}
                      </button>

                      <button
                        onClick={() => handleDeleteUser(op.id, op.username)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Rimuovi account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
