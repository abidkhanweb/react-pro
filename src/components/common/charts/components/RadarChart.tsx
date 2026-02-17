import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from "recharts";

type Props = {
  data: { label: string; value: number }[];
  color?: string;
};

export function RadarChartComponent({ data, color = "#8884d8" }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data}>
        <PolarGrid />
        <PolarAngleAxis dataKey="label" />
        <PolarRadiusAxis />
        <Radar
          name="Values"
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.6}
        />
        <Tooltip />
        <Legend />
      </RadarChart>
    </ResponsiveContainer>
  );
}
