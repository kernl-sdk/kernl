import { highlight } from "@/lib/highlight";

interface CodePanelProps {
  code: string;
  lang?: string;
}

export async function CodePanel({ code, lang = "typescript" }: CodePanelProps) {
  const html = await highlight(code, lang);

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
      <div
        className="p-4 font-mono text-[12px] leading-6 [&_pre]:!bg-transparent [&_code]:!bg-transparent [&_.line-number]:mr-4 [&_.line-number]:inline-block [&_.line-number]:w-4 [&_.line-number]:select-none [&_.line-number]:text-right [&_.line-number]:font-mono"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
