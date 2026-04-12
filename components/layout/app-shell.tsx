import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1480px] items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-[13px] font-semibold text-white shadow-[0_24px_44px_-24px_rgba(15,23,42,0.7)]">
              TF
            </div>
            <div>
              <h1 className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-900">traceforge</h1>
              <p className="mt-1 text-xs text-slate-500">trajectory review research workbench</p>
            </div>
          </div>

          <span className="rounded-full border border-white/90 bg-white/85 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.45)]">
            mock mode
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-[1480px] px-4 py-6 lg:px-6 lg:py-8">{children}</main>
    </div>
  );
}
