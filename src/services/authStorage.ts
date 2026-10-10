import { UserAccount, FactoryTenant } from '../types/quantum';
import { 
  TOPOLOGY_BARILLA, 
  TOPOLOGY_BARILLA_NOVARA,
  TOPOLOGY_BARILLA_FOGGIA,
  TOPOLOGY_NESTLE, 
  TOPOLOGY_NESTLE_BENEVENTO,
  TOPOLOGY_NESTLE_PERUGIA,
  TOPOLOGY_SANTANNA,
  TOPOLOGY_SANTANNA_LANZO
} from './plantAutoDiscovery';

export const INITIAL_USERS: UserAccount[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    nomeCompleto: 'Ing. Marco Vieri (Admin SM.I.LE80)',
    ruolo: 'Amministratore',
    password: 'admin',
    attivo: true,
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-resp-barilla',
    username: 'resp_barilla',
    nomeCompleto: 'Ing. Giovanni Barilla (Resp. Stabilimenti)',
    ruolo: 'Responsabile di Stabilimento',
    password: 'barilla',
    lineaAssegnata: 'Coordinamento Impianti Barilla (Pedrignano & Novara)',
    tenantId: 'barilla',
    azienda: 'Barilla G. e R. Fratelli',
    allowedTenantIds: ['barilla', 'barilla-novara', 'barilla-foggia'],
    allowedMachineIds: ['BEMA_FASCIATORE', 'FLOTTA_LGV', 'SMARTSTORE', 'BAIE_INBOUND_OUTBOUND', 'ISOLA_ROBOT', 'WOODPECKER', 'RAPTOR', 'QUALITA_TRACCIABILITA'],
    attivo: true,
    createdAt: '2026-01-10'
  },
  {
    id: 'usr-resp-nestle',
    username: 'resp_nestle',
    nomeCompleto: 'Dott.ssa Elena Conti (Resp. Stabilimenti)',
    ruolo: 'Responsabile di Stabilimento',
    password: 'nestle',
    lineaAssegnata: 'Direzione Operativa Impianti Nestlé',
    tenantId: 'nestle',
    azienda: 'Nestlé Italiana',
    allowedTenantIds: ['nestle', 'nestle-benevento', 'nestle-perugia'],
    allowedMachineIds: ['BEMA_FASCIATORE', 'FLOTTA_LGV', 'SMARTSTORE', 'BAIE_INBOUND_OUTBOUND', 'ISOLA_ROBOT', 'RAPTOR'],
    attivo: true,
    createdAt: '2026-01-15'
  },
  {
    id: 'usr-op-barilla',
    username: 'op_barilla',
    nomeCompleto: 'Luca Rossi (Op. Inbound & Magazzino)',
    ruolo: 'Operatore di Linea',
    password: 'barilla',
    lineaAssegnata: 'Linea 1 - Ricevimento Merci & SmartStore Pedrignano',
    tenantId: 'barilla',
    azienda: 'Barilla G. e R. Fratelli',
    allowedTenantIds: ['barilla', 'barilla-novara'],
    allowedMachineIds: ['SMARTSTORE', 'BAIE_INBOUND_OUTBOUND'],
    attivo: true,
    createdAt: '2026-02-01'
  },
  {
    id: 'usr-op-nestle',
    username: 'op_nestle',
    nomeCompleto: 'Matteo Ferrari (Op. Fine Linea & LGV)',
    ruolo: 'Operatore di Linea',
    password: 'nestle',
    lineaAssegnata: 'Linea 4 - Fasciatori Bema & AGV Assago',
    tenantId: 'nestle',
    azienda: 'Nestlé Italiana',
    allowedTenantIds: ['nestle'],
    allowedMachineIds: ['BEMA_FASCIATORE', 'FLOTTA_LGV'],
    attivo: true,
    createdAt: '2026-02-15'
  },
  {
    id: 'usr-op-santanna',
    username: 'op_santanna',
    nomeCompleto: 'Chiara Galli (Op. Imbottigliamento & Buffer)',
    ruolo: 'Operatore di Linea',
    password: 'santanna',
    lineaAssegnata: 'Linea 2 - Evacuazione Fardelli Vinadio',
    tenantId: 'santanna',
    azienda: 'Acqua Sant\'Anna',
    allowedTenantIds: ['santanna', 'santanna-lanzo'],
    allowedMachineIds: ['FLOTTA_LGV', 'ISOLA_ROBOT', 'RAPTOR'],
    attivo: true,
    createdAt: '2026-02-20'
  },
  {
    id: 'usr-op-01',
    username: 'operatore1',
    nomeCompleto: 'Luca Rossi (Barilla Pedrignano)',
    ruolo: 'Operatore di Linea',
    password: 'linea',
    lineaAssegnata: 'Linea 1 - Ricevimento Merci & SmartStore',
    tenantId: 'barilla',
    azienda: 'Barilla G. e R. Fratelli',
    allowedTenantIds: ['barilla'],
    allowedMachineIds: ['SMARTSTORE', 'BAIE_INBOUND_OUTBOUND'],
    attivo: true,
    createdAt: '2026-02-01'
  },
  {
    id: 'usr-op-02',
    username: 'operatore2',
    nomeCompleto: 'Matteo Ferrari (Nestlé Assago)',
    ruolo: 'Operatore di Linea',
    password: 'linea',
    lineaAssegnata: 'Linea 4 - Fasciatori Bema & Flotta AGV',
    tenantId: 'nestle',
    azienda: 'Nestlé Italiana',
    allowedTenantIds: ['nestle'],
    allowedMachineIds: ['BEMA_FASCIATORE', 'FLOTTA_LGV'],
    attivo: true,
    createdAt: '2026-02-15'
  },
  {
    id: 'usr-op-generic',
    username: 'operatore',
    nomeCompleto: 'Operatore Standard (Barilla)',
    ruolo: 'Operatore di Linea',
    password: 'operatore',
    lineaAssegnata: 'Linea 1 - Inbound & WMS',
    tenantId: 'barilla',
    azienda: 'Barilla G. e R. Fratelli',
    allowedTenantIds: ['barilla'],
    allowedMachineIds: ['SMARTSTORE', 'BAIE_INBOUND_OUTBOUND'],
    attivo: true,
    createdAt: '2026-02-01'
  }
];

export const INITIAL_TENANTS: FactoryTenant[] = [
  // 1. BARILLA
  {
    id: 'barilla',
    nome: 'Barilla - Stabilimento Pedrignano',
    azienda: 'Barilla G. e R. Fratelli',
    numeroStabilimento: 1,
    sito: 'Pedrignano, Parma (PR)',
    endpoint: 'https://barilla-pedrignano.smile80.net/cudaq',
    plcIp: '10.24.100.50:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'QPU Rigetti / GPU Cluster H100',
    logoColor: '#3b82f6',
    plantTopology: TOPOLOGY_BARILLA,
    operatoriAssegnati: ['op_barilla'],
    createdAt: '2026-01-15'
  },
  {
    id: 'barilla-novara',
    nome: 'Barilla - Stabilimento Novara',
    azienda: 'Barilla G. e R. Fratelli',
    numeroStabilimento: 2,
    sito: 'Novara, Piemonte (NO)',
    endpoint: 'https://barilla-novara.smile80.net/cudaq',
    plcIp: '10.24.110.50:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'NVIDIA Grace Hopper GH200',
    logoColor: '#2563eb',
    plantTopology: {
      ...TOPOLOGY_BARILLA_NOVARA,
      qubitCapacity: 64,
      lastSyncTimestamp: new Date().toISOString()
    },
    operatoriAssegnati: ['op_barilla'],
    createdAt: '2026-01-20'
  },
  {
    id: 'barilla-foggia',
    nome: 'Barilla - Stabilimento Foggia',
    azienda: 'Barilla G. e R. Fratelli',
    numeroStabilimento: 3,
    sito: 'Foggia, Puglia (FG)',
    endpoint: 'https://barilla-foggia.smile80.net/cudaq',
    plcIp: '10.24.120.50:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'Simulatore CUDA-Q TensorNet',
    logoColor: '#1d4ed8',
    plantTopology: {
      ...TOPOLOGY_BARILLA_FOGGIA,
      qubitCapacity: 48,
      lastSyncTimestamp: new Date().toISOString()
    },
    operatoriAssegnati: ['op_barilla'],
    createdAt: '2026-02-05'
  },

  // 2. NESTLÉ
  {
    id: 'nestle',
    nome: 'Nestlé - Stabilimento Assago',
    azienda: 'Nestlé Italiana',
    numeroStabilimento: 1,
    sito: 'Assago, Milano (MI)',
    endpoint: 'https://nestle-milan.smile80.net/cudaq',
    plcIp: '172.18.20.10:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'QPU IonQ / Edge QPU Silkworm',
    logoColor: '#ef4444',
    plantTopology: TOPOLOGY_NESTLE,
    operatoriAssegnati: ['op_nestle'],
    createdAt: '2026-02-01'
  },
  {
    id: 'nestle-benevento',
    nome: 'Nestlé - Stabilimento Benevento',
    azienda: 'Nestlé Italiana',
    numeroStabilimento: 2,
    sito: 'Benevento, Campania (BN)',
    endpoint: 'https://nestle-benevento.smile80.net/cudaq',
    plcIp: '172.18.30.10:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'CUDA-Q Hybrid Grace Hopper',
    logoColor: '#dc2626',
    plantTopology: {
      ...TOPOLOGY_NESTLE_BENEVENTO,
      qubitCapacity: 64,
      lastSyncTimestamp: new Date().toISOString()
    },
    operatoriAssegnati: ['op_nestle'],
    createdAt: '2026-02-12'
  },
  {
    id: 'nestle-perugia',
    nome: 'Nestlé - Stabilimento San Sisto (Perugia)',
    azienda: 'Nestlé Italiana',
    numeroStabilimento: 3,
    sito: 'San Sisto, Perugia (PG)',
    endpoint: 'https://nestle-perugia.smile80.net/cudaq',
    plcIp: '172.18.40.10:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'Quantum Edge QPU Perugina',
    logoColor: '#b91c1c',
    plantTopology: {
      ...TOPOLOGY_NESTLE_PERUGIA,
      qubitCapacity: 56,
      lastSyncTimestamp: new Date().toISOString()
    },
    operatoriAssegnati: ['op_nestle'],
    createdAt: '2026-02-18'
  },

  // 3. ACQUA SANT'ANNA
  {
    id: 'santanna',
    nome: 'Acqua Sant\'Anna - Stabilimento Vinadio',
    azienda: 'Acqua Sant\'Anna',
    numeroStabilimento: 1,
    sito: 'Vinadio, Cuneo (CN)',
    endpoint: 'https://santanna-vinadio.smile80.net/cudaq',
    plcIp: '192.168.50.80:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'D-Wave Annealer / Hybrid Solver',
    logoColor: '#10b981',
    plantTopology: TOPOLOGY_SANTANNA,
    operatoriAssegnati: ['op_santanna'],
    createdAt: '2026-02-10'
  },
  {
    id: 'santanna-lanzo',
    nome: 'Acqua Sant\'Anna - Stabilimento Valli di Lanzo',
    azienda: 'Acqua Sant\'Anna',
    numeroStabilimento: 2,
    sito: 'Lanzo Torinese, Torino (TO)',
    endpoint: 'https://santanna-lanzo.smile80.net/cudaq',
    plcIp: '192.168.55.80:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'QPU D-Wave Advantage 5000Q',
    logoColor: '#059669',
    plantTopology: {
      ...TOPOLOGY_SANTANNA_LANZO,
      qubitCapacity: 64,
      lastSyncTimestamp: new Date().toISOString()
    },
    operatoriAssegnati: ['op_santanna'],
    createdAt: '2026-02-22'
  },

  // 4. GRANAROLO GROUP
  {
    id: 'granarolo-bologna',
    nome: 'Granarolo - Stabilimento Cadriano (Bologna)',
    azienda: 'Granarolo Group',
    numeroStabilimento: 1,
    sito: 'Cadriano di Granarolo, Bologna (BO)',
    endpoint: 'https://granarolo-bologna.smile80.net/cudaq',
    plcIp: '10.50.10.15:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'QPU Cold-Atom / CUDA-Q MPI',
    logoColor: '#0ea5e9',
    plantTopology: {
      ...TOPOLOGY_BARILLA,
      qubitCapacity: 72,
      lastSyncTimestamp: new Date().toISOString()
    },
    operatoriAssegnati: [],
    createdAt: '2026-02-25'
  },
  {
    id: 'granarolo-pasturana',
    nome: 'Granarolo - Stabilimento Pasturana',
    azienda: 'Granarolo Group',
    numeroStabilimento: 2,
    sito: 'Pasturana, Alessandria (AL)',
    endpoint: 'https://granarolo-pasturana.smile80.net/cudaq',
    plcIp: '10.50.20.15:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'Simulatore Quantum cuStateVec',
    logoColor: '#0284c7',
    plantTopology: {
      ...TOPOLOGY_BARILLA,
      qubitCapacity: 48,
      lastSyncTimestamp: new Date().toISOString()
    },
    operatoriAssegnati: [],
    createdAt: '2026-02-28'
  },

  // 5. ELETTRIC80 / SM.I.LE80 HQ & LABS
  {
    id: 'local',
    nome: 'Hub Viano - Sede Centrale R&D',
    azienda: 'Elettric80 / SM.I.LE80',
    numeroStabilimento: 1,
    sito: 'Viano, Reggio Emilia (RE)',
    endpoint: 'http://127.0.0.1:8080/api/v1',
    plcIp: '192.168.1.100:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'Simulatore GPU CUDA-Q (cuStateVec)',
    logoColor: '#06b6d4',
    plantTopology: TOPOLOGY_BARILLA,
    operatoriAssegnati: ['op_barilla'],
    createdAt: '2026-01-01'
  },
  {
    id: 'e80-bema-dolo',
    nome: 'Hub Bema - Centro Robotica Silkworm',
    azienda: 'Elettric80 / SM.I.LE80',
    numeroStabilimento: 2,
    sito: 'Dolo, Venezia (VE)',
    endpoint: 'https://bema-dolo.smile80.net/cudaq',
    plcIp: '192.168.20.100:502',
    protocol: 'REST_HTTPS',
    connectionStatus: 'CONNESSO',
    qpuTarget: 'NVIDIA GH200 QPU Accelerator',
    logoColor: '#14b8a6',
    plantTopology: {
      ...TOPOLOGY_BARILLA,
      qubitCapacity: 96,
      lastSyncTimestamp: new Date().toISOString()
    },
    operatoriAssegnati: [],
    createdAt: '2026-01-10'
  }
];

const STORAGE_KEY_USERS = 'joker80_users';
const STORAGE_KEY_TENANTS = 'joker80_tenants';
const STORAGE_KEY_CURRENT_USER = 'joker80_current_user';

export const AuthStorage = {
  getUsers: (): UserAccount[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      if (saved) {
        const parsed: UserAccount[] = JSON.parse(saved);
        // Ensure new predefined accounts exist in the list
        const existingUsernames = new Set(parsed.map(u => u.username.toLowerCase()));
        let hasChanges = false;
        for (const initUser of INITIAL_USERS) {
          if (!existingUsernames.has(initUser.username.toLowerCase())) {
            parsed.push(initUser);
            hasChanges = true;
          }
        }

        // Merge azienda and allowedMachineIds if missing
        for (const user of parsed) {
          const matchInit = INITIAL_USERS.find(iu => iu.username.toLowerCase() === user.username.toLowerCase());
          if (matchInit) {
            if (!user.azienda && matchInit.azienda) {
              user.azienda = matchInit.azienda;
              hasChanges = true;
            }
            if (!user.allowedMachineIds && matchInit.allowedMachineIds) {
              user.allowedMachineIds = matchInit.allowedMachineIds;
              hasChanges = true;
            }
            if (!user.allowedTenantIds && matchInit.allowedTenantIds) {
              user.allowedTenantIds = matchInit.allowedTenantIds;
              hasChanges = true;
            }
          }
        }

        // Sanitize and ensure 100% unique IDs across all users
        const seenIds = new Set<string>();
        for (let i = 0; i < parsed.length; i++) {
          if (!parsed[i].id || seenIds.has(parsed[i].id)) {
            parsed[i].id = `usr-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`;
            hasChanges = true;
          }
          seenIds.add(parsed[i].id);
        }

        if (hasChanges) {
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(parsed));
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS;
  },

  saveUsers: (users: UserAccount[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  },

  updateUser: (user: UserAccount): UserAccount => {
    const users = AuthStorage.getUsers();
    const updated = users.map(u => u.id === user.id ? user : u);
    AuthStorage.saveUsers(updated);
    // If current logged-in user is updated, update currentUser in storage too
    const current = AuthStorage.getCurrentUser();
    if (current && current.id === user.id) {
      AuthStorage.setCurrentUser(user);
    }
    return user;
  },

  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const users = AuthStorage.getUsers();
    const uniqueSuffix = Math.random().toString(36).substring(2, 8) + Math.random().toString(36).substring(2, 6);
    const newUser: UserAccount = {
      ...user,
      id: `usr-${Date.now()}-${uniqueSuffix}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [...users, newUser];
    AuthStorage.saveUsers(updated);
    return newUser;
  },

  deleteUser: (id: string) => {
    const users = AuthStorage.getUsers();
    const updated = users.filter(u => u.id !== id);
    AuthStorage.saveUsers(updated);
  },

  getTenants: (): FactoryTenant[] => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TENANTS);
      if (saved) {
        const parsed: FactoryTenant[] = JSON.parse(saved);
        const existingIds = new Set(parsed.map(t => t.id));
        let modified = false;

        for (const initTenant of INITIAL_TENANTS) {
          if (!existingIds.has(initTenant.id)) {
            parsed.push(initTenant);
            modified = true;
          }
        }

        // Ensure all stored tenants have topologies, azienda and connectionStatus
        const enriched = parsed.map(t => {
          const matchInit = INITIAL_TENANTS.find(it => it.id === t.id);
          let item = { ...t };
          if (matchInit) {
            if (!item.azienda && matchInit.azienda) {
              item.azienda = matchInit.azienda;
              modified = true;
            }
            if (!item.numeroStabilimento && matchInit.numeroStabilimento) {
              item.numeroStabilimento = matchInit.numeroStabilimento;
              modified = true;
            }
          }
          if (!item.plantTopology) {
            modified = true;
            if (item.id.includes('barilla')) item = { ...item, protocol: 'REST_HTTPS' as const, connectionStatus: 'CONNESSO' as const, plantTopology: TOPOLOGY_BARILLA };
            else if (item.id.includes('nestle')) item = { ...item, protocol: 'REST_HTTPS' as const, connectionStatus: 'CONNESSO' as const, plantTopology: TOPOLOGY_NESTLE };
            else if (item.id.includes('santanna')) item = { ...item, protocol: 'REST_HTTPS' as const, connectionStatus: 'CONNESSO' as const, plantTopology: TOPOLOGY_SANTANNA };
            else item = { ...item, protocol: 'REST_HTTPS' as const, connectionStatus: 'CONNESSO' as const, plantTopology: TOPOLOGY_BARILLA };
          }
          return item;
        });

        if (modified) {
          localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(enriched));
        }
        return enriched;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TENANTS;
  },

  saveTenants: (tenants: FactoryTenant[]) => {
    try {
      localStorage.setItem(STORAGE_KEY_TENANTS, JSON.stringify(tenants));
    } catch (e) {
      console.error(e);
    }
  },

  updateTenant: (tenant: FactoryTenant): FactoryTenant => {
    const tenants = AuthStorage.getTenants();
    const updated = tenants.map(t => t.id === tenant.id ? tenant : t);
    AuthStorage.saveTenants(updated);
    return tenant;
  },

  addTenant: (tenant: Omit<FactoryTenant, 'id' | 'createdAt'>): FactoryTenant => {
    const tenants = AuthStorage.getTenants();
    const slug = tenant.nome
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 20);
    const newTenant: FactoryTenant = {
      ...tenant,
      id: `${slug}-${Date.now().toString().slice(-4)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    const updated = [...tenants, newTenant];
    AuthStorage.saveTenants(updated);
    return newTenant;
  },

  deleteTenant: (id: string) => {
    const tenants = AuthStorage.getTenants();
    // Do not delete the local simulation hub
    if (id === 'local') return;
    const updated = tenants.filter(t => t.id !== id);
    AuthStorage.saveTenants(updated);
  },

  getCurrentUser: (): UserAccount | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  },

  setCurrentUser: (user: UserAccount | null) => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch (e) {
      console.error(e);
    }
  },

  logout: () => {
    try {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    } catch (e) {
      console.error(e);
    }
  }
};
