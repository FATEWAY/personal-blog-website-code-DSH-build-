import { cn } from "@/lib/utils";

export function CoverArt({
  title,
  category,
  className,
  label = "fateway / notes",
}: {
  title: string;
  category?: string | null;
  className?: string;
  label?: string;
}) {
  const initial = title.trim().slice(0, 1).toUpperCase() || "F";

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center overflow-hidden bg-[#191816]",
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(115% 110% at 84% 10%, rgba(215,95,48,0.32), transparent 56%), radial-gradient(90% 90% at 6% 100%, rgba(111,143,184,0.18), transparent 62%)",
        }}
        aria-hidden="true"
      />
      <div className="dot-grid absolute inset-0 opacity-[0.09]" aria-hidden="true" />
      <div
        className="absolute inset-3 rounded-[12px] border border-white/[0.07]"
        aria-hidden="true"
      />
      {category ? (
        <span className="absolute left-5 top-5 z-10 inline-flex items-center rounded-full border border-white/15 bg-white/[0.08] px-2.5 py-1 text-[0.66rem] text-[#efe9df] backdrop-blur">
          {category}
        </span>
      ) : null}
      <span className="select-none font-mono text-[5.4rem] font-medium leading-none text-white/[0.13]">
        {initial}
      </span>
      <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-4">
        <span className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-white/40">
          {label}
        </span>
        <span className="h-px w-10 flex-none bg-accent/80" aria-hidden="true" />
      </div>
    </div>
  );
}
