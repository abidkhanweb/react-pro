export function EmptyChart({ message = "No data available" }) {
  return (
    <div className="w-full h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
      {message}
    </div>
  );
}
