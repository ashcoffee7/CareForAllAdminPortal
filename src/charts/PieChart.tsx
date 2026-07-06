export interface PieSlice {
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieSlice[];
  size: number;
}

// Direct port of the old charts.js's buildPieChartSVG() SVG-string builder.
export function PieChart({ data, size }: PieChartProps) {
  const total = data.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return <div className="text-center text-muted text-[12px] py-5">No data yet</div>;
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;
  let startAngle = -90;

  const paths = data.map((slice, i) => {
    const angle = (slice.value / total) * 360;
    const endAngle = startAngle + angle;

    const startRad = (Math.PI / 180) * startAngle;
    const endRad = (Math.PI / 180) * endAngle;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const pathD = `M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z`;

    startAngle = endAngle;

    return <path key={i} d={pathD} fill={slice.color} stroke="white" strokeWidth={2} />;
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', maxWidth: size, height: 'auto', display: 'block', margin: '0 auto' }}>
      {paths}
    </svg>
  );
}
