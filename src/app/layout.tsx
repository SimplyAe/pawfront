import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/session";
import { LanguageProvider } from "@/i18n";

export const metadata: Metadata = {
  title: "pawinput",
  description: "An osu! private server",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSession();
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <Header user={user} />
          <main style={{ paddingTop: "55px", minHeight: "calc(100vh - 55px)" }}>
            {children}
          </main>
          <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
