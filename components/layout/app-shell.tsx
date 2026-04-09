import type { ReactNode } from 'react';

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
          <h1 className="text-sm font-semibold tracking-wide text-slate-800">traceforge</h1>
          <span className="ml-3 rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
            research workbench / mock mode
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
