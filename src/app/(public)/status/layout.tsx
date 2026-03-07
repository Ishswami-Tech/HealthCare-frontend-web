import { ReactNode } from 'react';

export default function StatusLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Simple layout without Navigation to avoid auth dependencies
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
