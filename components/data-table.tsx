"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { cn } from "@/lib/utils";

type Props<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  meta?: Record<string, unknown>;
  emptyMessage?: string | React.ReactNode;
  rowClassName?: (row: TData) => string;
  isPlaceholderData?: boolean;
};

export function DataTable<TData>({
  columns,
  data,
  meta,
  emptyMessage = "No results",
  rowClassName,
  isPlaceholderData,
}: Props<TData>) {
  const table = useReactTable({
    data,
    columns,
    meta: meta as never,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden transition-opacity", isPlaceholderData && "opacity-60")}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3 text-left font-medium">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody className="divide-y divide-border">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className={cn("hover:bg-muted/30 transition-colors", rowClassName?.(row.original))}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
