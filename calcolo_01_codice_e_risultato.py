import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def qbm_inbound_kernel(theta_p: float, theta_w: float, j_coupling: float):
    q = cudaq.qvector(4)
    for i in range(4):
        cudaq.h(q[i])
    cudaq.ry(theta_p, q[0])
    cudaq.ry(theta_p * 0.85, q[1])
    cudaq.ry(theta_w, q[2])
    cudaq.ry(theta_w * 0.90, q[3])
    cudaq.x.ctrl(q[0], q[2])
    cudaq.rz.ctrl(j_coupling, q[0], q[2])
    cudaq.x.ctrl(q[0], q[2])
    cudaq.x.ctrl(q[1], q[3])
    cudaq.rz.ctrl(j_coupling * 0.8, q[1], q[3])
    cudaq.x.ctrl(q[1], q[3])

def esegui_calcolo_01_qbm(camion_attesa: int = 12, minuti_ritardo: int = 45, saturazione_wms: float = 88.5) -> Dict[str, Any]:
    c = max(0, int(camion_attesa))
    r = max(0, int(minuti_ritardo))
    w = float(np.clip(saturazione_wms, 0.0, 100.0))
    congestione_norm = min(1.0, (c * 3.4 + r * 0.48 + w * 0.38) / 100.0)
    theta_p = float(np.clip(congestione_norm * np.pi, 0.05, np.pi - 0.05))
    theta_w = float(np.clip((w / 100.0) * np.pi, 0.05, np.pi - 0.05))
    j_coupling = float(congestione_norm * (w / 100.0) * 1.5)
    counts = cudaq.sample(qbm_inbound_kernel, theta_p, theta_w, j_coupling, shots=100)
    stato_dominante = counts.most_probable()
    allarme = (congestione_norm >= 0.85) or (stato_dominante in ['1111', '1110', '0111'])
    return {
        "calcolo": "Quantum Boltzmann Machines (QBM) - Inbound Scheduler",
        "congestione_percentuale": round(congestione_norm * 100.0, 1),
        "stato_qubit_rilevato": stato_dominante,
        "allarme_blocco_imminente": allarme,
        "azione_operativa": "Deviare bilici su polmone B3" if allarme else "Flusso regolare",
        "distribuzione_campionata": dict(counts)
    }

if __name__ == '__main__':
    print(esegui_calcolo_01_qbm())
