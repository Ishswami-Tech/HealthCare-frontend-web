import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/app/providers/AppProvider";

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
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
