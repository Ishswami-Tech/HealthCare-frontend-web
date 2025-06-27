export default function ProfileCompleteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen items-center justify-center bg-gray-50">
      {children}
    </div>
  );
}
