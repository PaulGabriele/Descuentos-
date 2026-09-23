# Unifilar de Tableros

Editor web de esquemas unifilares para tableros eléctricos **bipolares (1×220 V)** y
**tetrapolares (3×380/220 V)**. Un solo archivo HTML, sin dependencias ni build:
abrir `index.html` en el navegador.

- Entrada con acometida y protección general; barras; salidas con subcircuitos (grupos bajo diferencial).
- **Tableros con UPS**: entrada de red → barra normal → alimentación a la UPS; retorno de la UPS como
  segunda entrada → barra UPS (carga crítica). UPS trifásica/trifásica, trifásica/monofásica o
  monofásica/monofásica; bypass de mantenimiento con enclavamiento mecánico, conmutador 1-0-2 o sin bypass.
  Calcula carga de la UPS, corrientes nominales de entrada y salida y suma el consumo (carga ÷ η) a la red.
- Luces piloto con fusible por fase (R-S-T o L), conectadas arriba o debajo de la primera térmica de la entrada.
- Aparatos: ITM, diferencial, seccionador, fusible, guardamotor, contactor, relé térmico, medidor, DPS, instrumentos.
- Cargas: IUG, TUG, TUE, motor, aire acondicionado, subtablero, carga genérica, reserva.
- Cálculo de corriente por circuito, balance de fases, factor de simultaneidad y advertencias
  (protección insuficiente, selectividad, falta de diferencial de 30 mA).
- Cuadro de cargas y rótulo en la lámina. Exporta SVG / PNG; guarda y abre proyectos en JSON.
- Autoguardado en el navegador (localStorage).

Símbolos según IEC 60617; criterios según AEA 90364. Los cálculos son orientativos y no reemplazan el
cálculo de conductores ni la verificación de un profesional matriculado.
