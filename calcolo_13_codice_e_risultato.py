import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def qk_means_traffic_kernel(theta_c: float, theta_b: float):
    q = cudaq.qvector(4)
    cudaq.ry(theta_c, q[0])
    cudaq.ry(theta_b, q[1])
    cudaq.x.ctrl(q[0], q[2])
    cudaq.x.ctrl(q[1], q[3])

def esegui_calcolo_13_yard(camion_attesa: int = 14, saturazione_buffer: float = 0.75) -> Dict[str, Any]:
    c = max(0, int(camion_attesa))
    sat = float(np.clip(saturazione_buffer, 0.0, 1.0))
    theta_c = float(np.clip((c / 20.0) * np.pi, 0.1, np.pi - 0.1))
    theta_b = float(np.clip(sat * np.pi, 0.1, np.pi - 0.1))
    counts = cudaq.sample(qk_means_traffic_kernel, theta_c, theta_b, shots=100)
    cluster_dominante = counts.most_probable()
    tempo_medio_attesa_min = round(float(c * 3.8 * sat), 1)
    return {
        "calcolo": "Quantum K-Means Clustering - Traffico Piazzale e Buffer",
        "camion_attesa": c,
        "saturazione_buffer": sat,
        "cluster_qubit_traffico": cluster_dominante,
        "tempo_medio_attesa_min": tempo_medio_attesa_min,
        "stato_congestione": "ATTENZIONE - Regolare Flussi Banchina" if sat > 0.70 else "FLUIDO"
    }

if __name__ == '__main__':
    print(esegui_calcolo_13_yard())
