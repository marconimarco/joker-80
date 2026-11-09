import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def qmc_risk_kernel(theta_ritardo: float, theta_baie: float):
    q = cudaq.qvector(4)
    cudaq.ry(theta_ritardo, q[0])
    cudaq.ry(theta_baie, q[1])
    cudaq.x.ctrl(q[0], q[2])
    cudaq.x.ctrl(q[1], q[3])
    cudaq.x.ctrl(q[2], q[3])
    cudaq.rz.ctrl(theta_ritardo * 0.75, q[2], q[3])
    cudaq.x.ctrl(q[2], q[3])

def esegui_calcolo_02_qmc(ritardo_stimato_minuti: int = 75, baie_libere: int = 1) -> Dict[str, Any]:
    r = max(0, int(ritardo_stimato_minuti))
    b = max(0, int(baie_libere))
    prob_ritardo_norm = float(np.clip(r / 120.0, 0.05, 0.95))
    fattore_baie_norm = float(np.clip((4 - b) / 4.0, 0.05, 0.95))
    theta_r = float(2.0 * np.arcsin(np.sqrt(prob_ritardo_norm)))
    theta_b = float(2.0 * np.arcsin(np.sqrt(fattore_baie_norm)))
    counts = cudaq.sample(qmc_risk_kernel, theta_r, theta_b, shots=100)
    stato_dominante = counts.most_probable()
    sovrapprezzo = max(0, 1 - b) * 0.25
    costo_var_95_eur = round((r / 75.0) * 5850.0 * (1.0 + sovrapprezzo), 2)
    rischio_critico = (costo_var_95_eur >= 5000.0) or (stato_dominante in ['1111', '1110', '0111'])
    return {
        "calcolo": "Quantum Monte Carlo Risk Analysis - Inbound Scheduler",
        "metodo": "Euristica Industriale con Campionamento Quantistico di Stato (Non-QAE)",
        "ritardo_stimato_minuti": r,
        "baie_libere": b,
        "probabilita_fermo_linea_pct": round(prob_ritardo_norm * 100.0, 1),
        "costo_var_95_eur": costo_var_95_eur,
        "stato_rischio_qubit": stato_dominante,
        "classificazione_rischio": "CRITICO - Attivare Buffer Polmone" if rischio_critico else "MODERATO - Monitoraggio",
        "distribuzione_campionata": dict(counts)
    }

if __name__ == '__main__':
    print(esegui_calcolo_02_qmc())
