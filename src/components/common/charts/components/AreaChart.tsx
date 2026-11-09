import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

type Props = {
  data: { label: string; value: number }[];
  color?: string;
  name?: string;
  valueFormatter?: (value: number) => string;
};

export function AreaChartComponent({ data, color = "#82ca9d", name = "Value", valueFormatter }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" />
        <YAxis />
        <Tooltip formatter={valueFormatter ? (value) => valueFormatter(Number(value)) : undefined} />
        <Legend />
        <Area type="monotone" dataKey="value" name={name} stroke={color} fill={color} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
