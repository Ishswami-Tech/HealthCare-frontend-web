import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import QueryProvider from "./providers/QueryProvider";
import "./globals.css";
import { LoadingOverlayProvider } from "@/app/providers/LoadingOverlayContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Healthcare App",
  description: "A modern healthcare platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          src="https://accounts.google.com/gsi/client"
          async
          defer
        ></script>
      </head>
      <body className={inter.className}>
        <LoadingOverlayProvider>
          <QueryProvider>
            {children}
            <Toaster richColors />
          </QueryProvider>
        </LoadingOverlayProvider>
      </body>
    </html>
  );
}
