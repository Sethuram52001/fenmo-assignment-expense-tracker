import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  created_at: string;
}

interface SummaryViewProps {
  expenses: Expense[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const SummaryView: React.FC<SummaryViewProps> = ({ expenses }) => {
  if (expenses.length === 0) return null;

  // Aggregate expenses by category
  const dataMap: Record<string, number> = {};
  expenses.forEach(exp => {
    dataMap[exp.category] = (dataMap[exp.category] || 0) + exp.amount;
  });

  const data = Object.keys(dataMap).map((key, index) => ({
    name: key,
    value: dataMap[key] / 100, // Convert back to rupees for display
    color: COLORS[index % COLORS.length]
  })).sort((a, b) => b.value - a.value);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#1A1A1A', padding: '10px', border: '1px solid #333', borderRadius: '8px' }}>
          <p style={{ color: '#EDEDED', fontWeight: 600, margin: 0 }}>{payload[0].name}</p>
          <p style={{ color: payload[0].payload.color, margin: 0 }}>
            ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="summary-view" style={{ background: 'var(--surface-color)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', fontWeight: 500 }}>Category Breakdown</h3>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              animationBegin={0}
              animationDuration={800}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SummaryView;
