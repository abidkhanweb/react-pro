import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from "recharts";

type Props = {
  data: { label: string; value: number }[];
  colors?: string[];
};

export function PieChartComponent({
  data,
  colors = ["#8884d8", "#82ca9d", "#ffc658"],
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Tooltip />
        <Legend />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          outerRadius={100}
          fill="#8884d8"
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={colors[index % colors.length]} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}
