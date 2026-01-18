import { Layout, Navbar } from "nextra-theme-docs";
import { Head } from "nextra/components";
import { getPageMap } from "nextra/page-map";
import { Analytics } from "@vercel/analytics/next";
import "nextra-theme-docs/style.css";
import "./globals.css";
import { HeaderLogo } from "../components/header-logo";
import { NavbarRight } from "../components/navbar-right";

export const metadata = {
  title: {
    default: "kernl",
    template: "%s | kernl",
  },
  description: "TypeScript framework for building AI agents with memory",
  icons: {
    icon: "/kernl-logo.png",
  },
  openGraph: {
    title: "kernl",
    description: "TypeScript framework for building AI agents with memory",
    url: "https://docs.kernl.sh",
    siteName: "kernl",
    images: [
      {
        url: "https://docs.kernl.sh/og-kernl.png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "kernl",
    description: "TypeScript framework for building AI agents with memory",
    images: ["https://docs.kernl.sh/og-kernl.png"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pageMap = await getPageMap();

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={
            <>
              <Navbar logo={<span className="logo-text">kernl</span>}>
                <NavbarRight />
              </Navbar>
              <HeaderLogo />
            </>
          }
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/kernl-sdk/kernl/tree/main/docs"
          nextThemes={{
            defaultTheme: "dark",
            forcedTheme: "dark",
          }}
        >
          {children}
        </Layout>
        <Analytics />
      </body>
    </html>
  );
}
