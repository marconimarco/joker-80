import cudaq
import numpy as np
from typing import Dict, Any

@cudaq.kernel
def qsvm_film_kernel(theta_t: float, theta_p: float):
    q = cudaq.qvector(4)
    cudaq.ry(theta_t, q[0])
    cudaq.ry(theta_p, q[1])
    cudaq.x.ctrl(q[0], q[2])
    cudaq.x.ctrl(q[1], q[3])

def compute_stress_mpa(tension_n: float = 148.5, thickness_um: float = 23.0, width_mm: float = 1000.0) -> float:
    area_mm2 = width_mm * (thickness_um / 1000.0)
    return round(float(tension_n / area_mm2), 2)

def esegui_calcolo_15_qsvm_film(tensione_newton: float = 148.5, pre_stiro_pct: float = 250.0, spessore_film_micron: float = 23.0) -> Dict[str, Any]:
    t_n = max(1.0, float(tensione_newton))
    prestiro = float(np.clip(pre_stiro_pct, 100.0, 350.0))
    spess_um = max(1.0, float(spessore_film_micron))
    sforzo_mpa = compute_stress_mpa(t_n, spess_um, width_mm=1000.0)
    theta_t = float(np.clip((t_n / 300.0) * np.pi, 0.1, np.pi - 0.1))
    theta_p = float(np.clip((prestiro / 350.0) * np.pi, 0.1, np.pi - 0.1))
    counts = cudaq.sample(qsvm_film_kernel, theta_t, theta_p, shots=100)
    stato = counts.most_probable()
    return {
        "calcolo": "Quantum Support Vector Machines (QSVM) - Tensione Film Bema",
        "tensione_newton": t_n,
        "pre_stiro_pct": prestiro,
        "spessore_film_micron": spess_um,
        "sforzo_unitario_mpa": sforzo_mpa,
        "stato_fasciatura": "ALLARME ROTTURA FILM" if sforzo_mpa > 18.0 else "REGOLARE"
    }

if __name__ == '__main__':
    print(esegui_calcolo_15_qsvm_film())
