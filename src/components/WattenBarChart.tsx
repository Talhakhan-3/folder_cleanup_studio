import React from 'react';

interface WattenBarChartProps {
  data: { label: string; value: number }[];
  height?: number;
}

const COLORS = [
  '#ff6b6b', // coral
  '#ffd93d', // amber
  '#6bcb77', // teal
  '#a78bfa', // violet
  '#4d96ff', // blue
  '#ff9f43', // orange
  '#00d2d3', // cyan
  '#fd79a8', // pink
];

export const WattenBarChart: React.FC<WattenBarChartProps> = ({ data, height = 220 }) => {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const n = data.length;
  const barWidth = Math.min(48, Math.max(28, 600 / (n * 1.8)));
  const gap = Math.max(16, (720 - n * barWidth) / (n + 1));
  const totalWidth = n * barWidth + (n + 1) * gap;

  return (
    <div className="w-full overflow-x-auto py-2">
      <svg
        className="mx-auto block max-w-full overflow-visible"
        viewBox={`0 0 ${totalWidth} ${height + 60}`}
        height={height + 60}
      >
        {data.map((d, i) => {
          const h = Math.max(6, (d.value / maxVal) * height);
          const x = gap + i * (barWidth + gap);
          const y = height - h + 25;
          const color = COLORS[i % COLORS.length];

          return (
            <g
              key={d.label}
              className="group cursor-pointer transition-transform duration-300 origin-bottom"
            >
              {/* Bar */}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={h}
                rx={8}
                fill={color}
                fillOpacity={0.88}
                className="transition-all duration-300 group-hover:brightness-125 group-hover:opacity-100"
              />

              {/* Value label */}
              <text
                x={x + barWidth / 2}
                y={y - 8}
                textAnchor="middle"
                className="fill-[#f7f5f2] text-xs font-semibold font-serif select-none"
              >
                {d.value}
              </text>

              {/* Category label */}
              <text
                x={x + barWidth / 2}
                y={height + 45}
                textAnchor="middle"
                className="fill-[#a8a29e] text-[11px] font-sans transition-colors duration-200 group-hover:fill-[#f7f5f2] select-none"
              >
                {d.label.length > 10 ? `${d.label.slice(0, 9)}…` : d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
