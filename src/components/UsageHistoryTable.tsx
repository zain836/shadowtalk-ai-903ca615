import { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreditTransaction } from "@/hooks/useShadowCredits";

interface UsageHistoryTableProps {
  transactions: CreditTransaction[];
}

const MINUTES_PER_CREDIT = 10;

export const UsageHistoryTable = ({ transactions }: UsageHistoryTableProps) => {
  const rows = useMemo(() => {
    return transactions.map(t => {
      const creditsAbs = Math.abs(t.amount);
      const timeSaved = t.transactionType === "consume" ? creditsAbs * MINUTES_PER_CREDIT : 0;
      return { ...t, creditsAbs, timeSaved };
    });
  }, [transactions]);

  if (rows.length === 0) {
    return (
      <div className="border border-border/40 rounded-lg p-6 text-center">
        <p className="text-sm font-mono text-muted-foreground">NO TRANSACTION DATA</p>
      </div>
    );
  }

  return (
    <div className="border border-border/40 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border/30">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Usage History
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow className="border-border/30 hover:bg-transparent">
            <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground h-9">
              Date
            </TableHead>
            <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground h-9">
              Mission
            </TableHead>
            <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground h-9 text-right">
              Credits
            </TableHead>
            <TableHead className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground h-9 text-right">
              Time Saved
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} className="border-border/20 hover:bg-muted/20">
              <TableCell className="text-xs font-mono text-muted-foreground py-2.5">
                {new Date(row.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </TableCell>
              <TableCell className="text-xs font-mono text-foreground py-2.5">
                {row.description || row.sessionType || row.transactionType}
              </TableCell>
              <TableCell className={`text-xs font-mono text-right py-2.5 ${row.amount < 0 ? "text-red-400" : "text-emerald-400"}`}>
                {row.amount > 0 ? "+" : ""}{row.amount}
              </TableCell>
              <TableCell className="text-xs font-mono text-right text-muted-foreground py-2.5">
                {row.timeSaved > 0 ? `${row.timeSaved}m` : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
