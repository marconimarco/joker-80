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
  ExternalLink
} from 'lucide-react';
import { FactoryTenant, UserAccount } from '../types/quantum';
import { AuthStorage } from '../services/authStorage';

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
  const [activeTab, setActiveTab] = useState<'tenants' | 'operators'>('tenants');
  const [users, setUsers] = useState<UserAccount[]>(() => AuthStorage.getUsers());

  // New Tenant Form State
  const [newTenantNome, setNewTenantNome] = useState('');
  const [newTenantSito, setNewTenantSito] = useState('');
  const [newTenantEndpoint, setNewTenantEndpoint] = useState('');
  const [newTenantPlcIp, setNewTenantPlcIp] = useState('');
  const [newTenantQpuTarget, setNewTenantQpuTarget] = useState('Simulatore GPU CUDA-Q (cuStateVec)');
  const [newTenantColor, setNewTenantColor] = useState('#06b6d4');
  const [newTenantSuccess, setNewTenantSuccess] = useState<string | null>(null);

  // New Operator Form State
  const [newOpUsername, setNewOpUsername] = useState('');
  const [newOpNomeCompleto, setNewOpNomeCompleto] = useState('');
  const [newOpPassword, setNewOpPassword] = useState('linea');
  const [newOpLinea, setNewOpLinea] = useState('Linea 1 - Inbound & WMS');
  const [newOpTenantId, setNewOpTenantId] = useState(activeTenant.id);
  const [newOpSuccess, setNewOpSuccess] = useState<string | null>(null);

  // Tenant Creation Handler
  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantNome.trim() || !newTenantEndpoint.trim()) return;

    const created = AuthStorage.addTenant({
      nome: newTenantNome.trim(),
      sito: newTenantSito.trim() || 'Stabilimento di Produzione',
      endpoint: newTenantEndpoint.trim(),
      plcIp: newTenantPlcIp.trim() || '192.168.1.100:502',
      qpuTarget: newTenantQpuTarget,
      logoColor: newTenantColor
    });

    const updatedTenants = AuthStorage.getTenants();
    onUpdateTenants(updatedTenants);
    onSelectTenant(created);

    setNewTenantSuccess(`Ambiente "${created.nome}" creato con successo! Ora è attivo e selezionabile in alto a sinistra.`);
    setNewTenantNome('');
    setNewTenantSito('');
    setNewTenantEndpoint('');
    setNewTenantPlcIp('');

    setTimeout(() => setNewTenantSuccess(null), 6000);
  };

  // Delete Tenant
  const handleDeleteTenant = (id: string, nome: string) => {
    if (id === 'local') return;
    if (window.confirm(`Sei sicuro di voler rimuovere l'ambiente "${nome}"?`)) {
      AuthStorage.deleteTenant(id);
      const updated = AuthStorage.getTenants();
      onUpdateTenants(updated);
      if (activeTenant.id === id) {
        onSelectTenant(updated[0]);
      }
    }
  };

  // Operator Creation Handler
  const handleCreateOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpUsername.trim() || !newOpNomeCompleto.trim()) return;

    // Check duplicate
    if (users.some(u => u.username.toLowerCase() === newOpUsername.trim().toLowerCase())) {
      alert('Un operatore o utente con questo username esiste già!');
      return;
    }

    const created = AuthStorage.addUser({
      username: newOpUsername.trim(),
      nomeCompleto: newOpNomeCompleto.trim(),
      ruolo: 'Operatore di Linea',
      password: newOpPassword.trim() || 'linea',
      lineaAssegnata: newOpLinea,
      tenantId: newOpTenantId,
      attivo: true
    });

    const updatedUsers = AuthStorage.getUsers();
    setUsers(updatedUsers);

    setNewOpSuccess(`Operatore "${created.nomeCompleto}" (${created.username}) abilitato all'accesso!`);
    setNewOpUsername('');
    setNewOpNomeCompleto('');
    setTimeout(() => setNewOpSuccess(null), 5000);
  };

  // Delete / Toggle Operator
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

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-purple-500/20 bg-gradient-to-r from-purple-950/30 via-slate-900 to-cyan-950/20 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-purple-500/20 border border-purple-500/40 text-purple-300">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-mono text-white flex items-center gap-2">
              Pannello di Controllo Amministratore
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                Super-Admin
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Gestione degli ambienti/sedi di stabilimento (in alto a sinistra) e provisioning credenziali per Operatori di Linea.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'tenants'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Ambienti & Sedi ({tenants.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('operators')}
            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'operators'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Operatori di Linea ({users.filter(u => u.ruolo === 'Operatore di Linea').length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: GESTIONE AMBIENTI E SEDI INDUSTRIALI */}
      {activeTab === 'tenants' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Inserimento Nuova Sede */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-purple-400" />
                Aggiungi Nuovo Ambiente / Sede di Fabbrica
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Inserisci i dati necessari per connettere un nuovo stabilimento reale o di test. Una volta creato, comparirà automaticamente nel menu a tendina in alto a sinistra.
              </p>
            </div>

            {newTenantSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{newTenantSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateTenant} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  Nome Stabilimento / Brand *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Ferrero (Sito di Alba), Parmalat, Granarolo..."
                  value={newTenantNome}
                  onChange={e => setNewTenantNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-purple-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  Città / Ubicazione Geografica *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Alba (CN), Bologna (BO), Reggio Emilia..."
                  value={newTenantSito}
                  onChange={e => setNewTenantSito(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1">
                  <Network className="w-3.5 h-3.5 text-emerald-400" />
                  Endpoint API Middleware CUDA-Q / FastAPI *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. https://ferrero-alba.smile80.net/api o http://192.168.10.20:8000"
                  value={newTenantEndpoint}
                  onChange={e => setNewTenantEndpoint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                    IP Gateway PLC / Scada
                  </label>
                  <input
                    type="text"
                    placeholder="192.168.1.100:502"
                    value={newTenantPlcIp}
                    onChange={e => setNewTenantPlcIp(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 flex items-center gap-1">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    Colore Badge
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newTenantColor}
                      onChange={e => setNewTenantColor(e.target.value)}
                      className="w-8 h-8 rounded-lg bg-transparent border border-slate-800 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-400">{newTenantColor}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  Target Hardware Quantistico Primario
                </label>
                <select
                  value={newTenantQpuTarget}
                  onChange={e => setNewTenantQpuTarget(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100"
                >
                  <option value="Simulatore GPU CUDA-Q (cuStateVec)">Simulatore GPU CUDA-Q (cuStateVec - H100/A100)</option>
                  <option value="Quantum Annealer D-Wave Advantage">Quantum Annealer D-Wave Advantage (Ottimizzazione Flotta)</option>
                  <option value="QPU Gate-Based Rigetti / IonQ">QPU Gate-Based Rigetti / IonQ (Superconduttori/Ioni)</option>
                  <option value="Edge AI Quantistico Silkworm">Edge AI Quantistico Silkworm (Avvolgitori Bema)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salva e Aggiungi all'Elenco Ambienti</span>
              </button>
            </form>
          </div>

          {/* Elenco Ambienti Esistenti */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-cyan-400" />
                  Ambienti e Sedi Collegate ({tenants.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tutte le sedi configurate. Clicca su "Connetti" per selezionarla immediatamente come sede attiva.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {tenants.map(t => {
                const isActive = t.id === activeTenant.id;
                return (
                  <div
                    key={t.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isActive
                        ? 'bg-cyan-500/10 border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: t.logoColor || '#06b6d4' }}
                        />
                        <span className="font-mono font-bold text-sm text-slate-100">
                          {t.nome}
                        </span>
                        {isActive && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            ATTIVO IN ALTO A SINISTRA
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-mono text-slate-400">
                        Sito: <span className="text-slate-300">{t.sito}</span>
                      </div>

                      <div className="text-[11px] font-mono text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>API: <code className="text-cyan-400">{t.endpoint}</code></span>
                        {t.plcIp && <span>PLC: <code className="text-amber-400">{t.plcIp}</code></span>}
                        {t.qpuTarget && <span>Target: <span className="text-slate-300">{t.qpuTarget}</span></span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      {!isActive ? (
                        <button
                          onClick={() => onSelectTenant(t)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 text-xs font-mono border border-slate-700 transition-colors"
                        >
                          Connetti Sede
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 px-3 py-1.5">
                          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                          <span>In Uso</span>
                        </div>
                      )}

                      {t.id !== 'local' && (
                        <button
                          onClick={() => handleDeleteTenant(t.id, t.nome)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Rimuovi ambiente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GESTIONE OPERATORI DI LINEA */}
      {activeTab === 'operators' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form Inserimento Nuovo Operatore */}
          <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-5">
            <div className="border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-cyan-400" />
                Crea Nuovo Operatore di Linea
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Genera le credenziali di accesso per il personale di turno. L'operatore potrà accedere tramite la login iniziale selezionando "Operatore di Linea".
              </p>
            </div>

            {newOpSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{newOpSuccess}</span>
              </div>
            )}

            <form onSubmit={handleCreateOperator} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Nome e Cognome Operatore *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. Marco Bellini, Sara Conti..."
                  value={newOpNomeCompleto}
                  onChange={e => setNewOpNomeCompleto(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Username di Accesso *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Es. op_bellini, operatore3..."
                  value={newOpUsername}
                  onChange={e => setNewOpUsername(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-amber-500 focus:outline-none text-slate-100 placeholder:text-slate-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1">
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
                <label className="text-slate-300 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  Linea / Area di Fabbrica Assegnata
                </label>
                <select
                  value={newOpLinea}
                  onChange={e => setNewOpLinea(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-emerald-500 focus:outline-none text-slate-100"
                >
                  <option value="Linea 1 - Inbound & Scarico Baie">Linea 1 - Inbound & Scarico Baie (MIP)</option>
                  <option value="Linea 2 - Magazzino SmartStore & Picking">Linea 2 - Magazzino SmartStore & Picking (WMS)</option>
                  <option value="Linea 3 - Outbound & Carico Camion">Linea 3 - Outbound & Carico Camion (TPT/YMS)</option>
                  <option value="Linea 4 - Fasciatori Bema & Flotta AGV">Linea 4 - Fasciatori Bema & Flotta AGV (ECS/SDM)</option>
                  <option value="Tutte le Linee (Capoturno Fabbrica)">Tutte le Linee (Capoturno Fabbrica)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-purple-400" />
                  Stabilimento di Default
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

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salva ed Abilita Operatore</span>
              </button>
            </form>
          </div>

          {/* Elenco Utenti & Operatori Configurate */}
          <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-400" />
                  Registro Account Utente & Operatori ({users.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Operatori registrati nel middleware con permessi di esecuzione calcoli.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {users.map(u => {
                const isAdmin = u.ruolo === 'Amministratore';
                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-slate-100">
                          {u.nomeCompleto}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          isAdmin
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                        }`}>
                          {u.ruolo}
                        </span>

                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                          u.attivo
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {u.attivo ? 'Attivo' : 'Disattivato'}
                        </span>
                      </div>

                      <div className="text-xs font-mono text-slate-400">
                        Username: <code className="text-cyan-300">{u.username}</code>
                        {u.password && <span> | Password: <code className="text-slate-300">{u.password}</code></span>}
                      </div>

                      {u.lineaAssegnata && (
                        <div className="text-[11px] font-mono text-slate-400">
                          Assegnazione: <span className="text-slate-300">{u.lineaAssegnata}</span>
                        </div>
                      )}
                    </div>

                    {!isAdmin && (
                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => handleToggleUserActive(u.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 transition-colors"
                        >
                          {u.attivo ? 'Disattiva' : 'Riattiva'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.username)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Elimina account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
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
