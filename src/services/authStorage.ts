import { UserAccount, FactoryTenant } from '../types/quantum';

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
    id: 'usr-op-barilla',
    username: 'op_barilla',
    nomeCompleto: 'Luca Rossi (Op. Inbound & Magazzino)',
    ruolo: 'Operatore di Linea',
    password: 'barilla',
    lineaAssegnata: 'Linea 1 - Ricevimento Merci & SmartStore Pedrignano',
    tenantId: 'barilla',
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
    attivo: true,
    createdAt: '2026-02-01'
  }
];

export const INITIAL_TENANTS: FactoryTenant[] = [
  {
    id: 'local',
    nome: 'Hub Viano - Simulazione Globale',
    sito: 'Viano, Reggio Emilia (RE)',
    endpoint: 'http://127.0.0.1:8080/api/v1',
    plcIp: '192.168.1.100:502',
    qpuTarget: 'Simulatore GPU CUDA-Q (cuStateVec)',
    logoColor: '#06b6d4',
    createdAt: '2026-01-01'
  },
  {
    id: 'barilla',
    nome: 'Barilla (Stabilimento di Pedrignano)',
    sito: 'Pedrignano, Parma (PR)',
    endpoint: 'https://barilla-pedrignano.smile80.net/cudaq',
    plcIp: '10.24.100.50:502',
    qpuTarget: 'QPU Rigetti / GPU Cluster H100',
    logoColor: '#3b82f6',
    createdAt: '2026-01-15'
  },
  {
    id: 'nestle',
    nome: 'Nestlé (Stabilimento di Assago)',
    sito: 'Assago, Milano (MI)',
    endpoint: 'https://nestle-milan.smile80.net/cudaq',
    plcIp: '172.18.20.10:502',
    qpuTarget: 'QPU IonQ / Edge QPU Silkworm',
    logoColor: '#ef4444',
    createdAt: '2026-02-01'
  },
  {
    id: 'santanna',
    nome: 'Acqua Sant\'Anna (Stabilimento di Vinadio)',
    sito: 'Vinadio, Cuneo (CN)',
    endpoint: 'https://santanna-vinadio.smile80.net/cudaq',
    plcIp: '192.168.50.80:502',
    qpuTarget: 'D-Wave Annealer / Hybrid Solver',
    logoColor: '#10b981',
    createdAt: '2026-02-10'
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

  addUser: (user: Omit<UserAccount, 'id' | 'createdAt'>): UserAccount => {
    const users = AuthStorage.getUsers();
    const newUser: UserAccount = {
      ...user,
      id: 'usr-' + Date.now(),
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
      if (saved) return JSON.parse(saved);
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
