import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def ewl_game_kernel(gamma_j: float, theta_driver: float, theta_plant: float):
    q = cudaq.qvector(4)
    for i in range(2):
        cudaq.h(q[i])
    cudaq.x.ctrl(q[0], q[1])
    cudaq.rz.ctrl(gamma_j, q[0], q[1])
    cudaq.x.ctrl(q[0], q[1])
    cudaq.ry(theta_driver, q[0])
    cudaq.ry(theta_plant, q[1])
    cudaq.x.ctrl(q[0], q[1])
    cudaq.rz.ctrl(-gamma_j, q[0], q[1])
    cudaq.x.ctrl(q[0], q[1])

def esegui_calcolo_12_game_theory(camion_in_coda: int = 14, baie_disponibili: int = 2, costo_orario_attesa_eur: float = 65.0) -> Dict[str, Any]:
    c_coda = max(1, int(camion_in_coda))
    b_disp = max(1, int(baie_disponibili))
    costo_h = max(10.0, float(costo_orario_attesa_eur))
    theta_d = float(np.clip((c_coda / 20.0) * np.pi, 0.1, np.pi - 0.1))
    theta_p = float(np.clip((b_disp / 6.0) * np.pi, 0.1, np.pi - 0.1))
    counts = cudaq.sample(ewl_game_kernel, 0.785, theta_d, theta_p, shots=100)
    stato = counts.most_probable()
    risparmio_eur = round(float((c_coda * costo_h * 0.45) * (b_disp / 4.0)), 2)
    return {
        "calcolo": "Quantum Game Theory (EWL) - Dock & Slot Scheduler",
        "camion_in_coda": c_coda,
        "baie_disponibili": b_disp,
        "risparmio_costi_sosta_eur": risparmio_eur,
        "stato_equilibrio_nash_qubit": stato,
        "esito_cooperativo": "PARETO-OTTIMALE" if stato in ["0011", "0000"] else "SUB-OTTIMALE"
    }

if __name__ == '__main__':
    print(esegui_calcolo_12_game_theory())
