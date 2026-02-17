import React from "react";

type Props = {
  title?: string;
  children: React.ReactNode;
  showLegend?: boolean;
};

export function ChartContainer({ title, children }: Props) {
  return (
    <div className="w-full rounded-lg bg-white dark:bg-gray-800 p-4 shadow-sm">
      {title && (
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          {title}
        </h3>
      )}
      <div className="w-full h-72 flex justify-center items-center">
        {children}
      </div>
    </div>
  );
}

// How to use
{/* <ChartContainer title="Revenue Over Time">
  <LineChartComponent data={revenueData} />
</ChartContainer>; */}