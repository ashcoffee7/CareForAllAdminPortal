import { formatCompact } from './format';

interface LineAreaChartProps {
  data: number[];
  labels: string[];
  color: string;
  width: number;
  height: number;
}

// Direct port of the old charts.js's buildSimpleLineChartSVG() SVG-string
// builder into JSX -- same padding/scale/label math, just returning real
// elements instead of concatenated markup strings.
export function LineAreaChart({ data, labels, color, width, height }: LineAreaChartProps) {
  const padTop = 20;
  const padRight = 20;
  const padBottom = 30;
  const padLeft = 44;

  const maxValRaw = Math.max(...data) * 1.15;
  const minRaw = Math.min(...data) * 0.95;
  const minVal = minRaw > 0 ? 0 : minRaw;
  const maxVal = maxValRaw === minVal ? minVal + 1 : maxValRaw;

  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;
  const n = labels.length;

  const xAt = (i: number) => padLeft + (i / (n - 1)) * plotW;
  const yAt = (v: number) => padTop + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

  const gridLines = [0, 1, 2, 3].map((g) => {
    const gv = minVal + ((maxVal - minVal) / 3) * (3 - g);
    const gy = padTop + (plotH / 3) * g;
    return { gv, gy };
  });

  const linePoints = data.map((d, j) => `${xAt(j)},${yAt(d)}`).join(' ');

  let areaD = `M${xAt(0)},${yAt(minVal)}`;
  data.forEach((d, k) => { areaD += ` L${xAt(k)},${yAt(d)}`; });
  areaD += ` L${xAt(data.length - 1)},${yAt(minVal)} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height, display: 'block' }}>
      {gridLines.map(({ gv, gy }, idx) => (
        <g key={idx}>
          <line x1={padLeft} y1={gy} x2={width - padRight} y2={gy} stroke="#e7e9ee" strokeWidth={1} />
          <text x={padLeft - 8} y={gy + 3} fontSize={9.5} fill="#6b7280" textAnchor="end" fontFamily="Manrope, sans-serif">
            {formatCompact(gv)}
          </text>
        </g>
      ))}

      {labels.map((label, i) => {
        if (n > 8 && i % 2 !== 0 && i !== n - 1) { return null; }
        return (
          <text key={i} x={xAt(i)} y={height - 8} fontSize={9.5} fill="#6b7280" textAnchor="middle" fontFamily="Manrope, sans-serif">
            {label}
          </text>
        );
      })}

      <path d={areaD} fill={color} opacity={0.1} />
      <polyline points={linePoints} fill="none" stroke={color} strokeWidth={2.75} strokeLinejoin="round" strokeLinecap="round" />
      {data.map((d, m) => (
        <circle key={m} cx={xAt(m)} cy={yAt(d)} r={4} fill={color} stroke="white" strokeWidth={2} />
      ))}
    </svg>
  );
}
