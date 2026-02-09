import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers"; // Importamos el proveedor

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "NexusAduana | Gestión Logística",
  description: "Sistema profesional de aduanas",
};

export default function RootLayout({ children }) {
  return (
    // suppressHydrationWarning evita avisos por cambios de atributos de next-themes
    <html lang="es" suppressHydrationWarning> 
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}