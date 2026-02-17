import type { ChartPoint } from "@/components/common/charts/types";

// normalize API data that might have keys like
// { date, totalRevenue } → { label, value }
export function mapToChartPoints(
  arr: any[],
  labelKey: string,
  valueKey: string,
): ChartPoint[] {
  return arr.map((item) => ({
    label: String(item[labelKey]),
    value: Number(item[valueKey]),
  }));
}

// group aggregator example if needed
export function groupAndSum(
  arr: any[],
  groupByKey: string,
  valueKey: string,
): ChartPoint[] {
  const map = new Map<string, number>();
  arr.forEach((item) => {
    const key = String(item[groupByKey]);
    const prev = map.get(key) || 0;
    map.set(key, prev + Number(item[valueKey]));
  });

  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}
