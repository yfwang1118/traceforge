import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'traceforge',
  description: 'Agent trajectory review and annotation research workbench',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
