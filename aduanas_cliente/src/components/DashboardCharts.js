"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-zinc-800 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export function MonthlyBarChart({ data }) {
  if (!data?.length) {
    return (
      <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm">
        Sin datos suficientes para graficar
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
        <XAxis dataKey="mes" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Bar dataKey="pedimentos" name="Pedimentos" fill="#3D6332" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CumulativeLineChart({ data }) {
  if (!data?.length) {
    return (
      <div className="h-[220px] flex items-center justify-center text-zinc-600 text-sm">
        Sin datos suficientes para graficar
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    ...d,
    acumulado: data.slice(0, i + 1).reduce((s, x) => s + x.pedimentos, 0),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
        <XAxis dataKey="mes" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="acumulado"
          name="Acumulado"
          stroke="#3D6332"
          strokeWidth={2}
          dot={{ fill: '#3D6332', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
