import { cn } from "@/lib/utils";

type DiffChangesProps = {
  additions: number;
  deletions: number;
  className?: string;
};

export function DiffChanges({ additions, deletions, className }: DiffChangesProps) {
  if (additions === 0 && deletions === 0) {
    return null;
  }

  return (
    <div className={cn("flex items-center gap-2 text-xs font-mono", className)}>
      {additions > 0 && (
        <span className="text-green-600 dark:text-green-400">+{additions}</span>
      )}
      {deletions > 0 && (
        <span className="text-red-600 dark:text-red-400">-{deletions}</span>
      )}
    </div>
  );
}
