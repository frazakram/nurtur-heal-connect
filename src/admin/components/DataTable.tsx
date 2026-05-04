import { useMemo, useState, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  empty?: string;
  rowKey?: (row: T, i: number) => string;
}

export function DataTable<T extends Record<string, any>>({ columns, data, pageSize = 10, empty = "No records found.", rowKey }: Props<T>) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const slice = useMemo(() => data.slice((safePage - 1) * pageSize, safePage * pageSize), [data, safePage, pageSize]);

  return (
    <div className="rounded-2xl bg-background border border-border shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-foreground/70">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-left font-semibold px-4 py-3 ${c.className ?? ""}`}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-10 text-center text-muted-foreground">{empty}</td></tr>
            ) : slice.map((row, i) => (
              <tr key={rowKey ? rowKey(row, i) : (row.id ?? i)} className="border-t border-border hover:bg-secondary/30 transition-colors">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border text-sm">
          <div className="text-muted-foreground">Page {safePage} of {totalPages} • {data.length} records</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}