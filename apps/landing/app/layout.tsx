import type { Metadata } from "next";
import Script from "next/script";
import { Geist_Mono } from "next/font/google";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Scrollbar } from "@/components/scrollbar";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "kernl",
  description: "The runtime for software 3.0",
  icons: {
    icon: "/kernl-logo.png",
  },
  openGraph: {
    title: "kernl",
    description: "The runtime for software 3.0",
    url: "https://www.kernl.sh",
    siteName: "kernl",
    images: [
      {
        url: "https://www.kernl.sh/kernl-logo.png",
        width: 512,
        height: 512,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "kernl",
    description: "The runtime for software 3.0",
    images: ["https://www.kernl.sh/kernl-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistMono.variable} h-screen antialiased`}>
        <ScrollArea className="h-screen" scrollHideDelay={0}>
          {children}
        </ScrollArea>
        <Scrollbar />
        <Script
          id="reb2b"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(key) {
                if (window.reb2b) return;
                window.reb2b = {loaded: true};
                var s = document.createElement("script");
                s.async = true;
                s.src = "https://ddwl4m2hdecbv.cloudfront.net/b/" + key + "/" + key + ".js.gz";
                document.getElementsByTagName("script")[0].parentNode.insertBefore(s, document.getElementsByTagName("script")[0]);
              }("Z6PVLHQP7Z6R");
            `,
          }}
        />
      </body>
    </html>
  );
}
