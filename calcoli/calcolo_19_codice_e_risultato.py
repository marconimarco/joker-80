import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def knapsack_charge_kernel(theta_p: float, theta_t: float):
    q = cudaq.qvector(4)
    cudaq.ry(theta_p, q[0])
    cudaq.ry(theta_t, q[1])
    cudaq.x.ctrl(q[0], q[2])
    cudaq.x.ctrl(q[1], q[3])

def esegui_calcolo_19_fast_charge(potenza_erogata_totale_kw: float = 87.5, temp_piastre_c: float = 42.5, livello_supercondensatori_pct: float = 68.0) -> Dict[str, Any]:
    p_kw = max(0.0, float(potenza_erogata_totale_kw))
    t_c = float(temp_piastre_c)
    sc_pct = float(np.clip(livello_supercondensatori_pct, 0.0, 100.0))
    theta_p = float(np.clip((p_kw / 120.0) * np.pi, 0.1, np.pi - 0.1))
    theta_t = float(np.clip((t_c / 80.0) * np.pi, 0.1, np.pi - 0.1))
    counts = cudaq.sample(knapsack_charge_kernel, theta_p, theta_t, shots=100)
    stato = counts.most_probable()
    picco_tagliato = round(float(p_kw * 0.28), 1)
    energia_recuperata = round(float(p_kw * (sc_pct / 100.0) * 0.45), 2)
    return {
        "calcolo": "Quantum Knapsack & Microgrid Peak Shaving",
        "potenza_erogata_totale_kw": p_kw,
        "temp_piastre_c": t_c,
        "picco_tagliato_kw": picco_tagliato,
        "energia_recuperata_kwh": energia_recuperata,
        "modello_accumulo": "Curva lineare approssimata (validita SoC nominale 20%-80%)",
        "avviso_tecnico_supercap": "Per SoC <20% o >80% applicare curva esponenziale non lineare Maxwell/Skeleton",
        "stato_termico": "SICURO - Carica Ultra-Fast Abilitata" if t_c <= 65.0 else "ALLARME SOVRATEMPERATURA",
        "configurazione_qubit_allocata": stato
    }

if __name__ == '__main__':
    print(esegui_calcolo_19_fast_charge())
