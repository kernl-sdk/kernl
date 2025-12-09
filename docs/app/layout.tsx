import { Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'
import './globals.css'
import { HeaderLogo } from '../components/header-logo'
import { NavbarRight } from '../components/navbar-right'

export const metadata = {
  title: {
    default: 'kernl',
    template: '%s | kernl',
  },
  description: 'TypeScript framework for building AI agents with memory',
  icons: {
    icon: '/kernl-logo.png',
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const pageMap = await getPageMap()

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={
            <>
              <Navbar
                logo={<span className="logo-text">kernl</span>}
              >
                <NavbarRight />
              </Navbar>
              <HeaderLogo />
            </>
          }
          pageMap={pageMap}
          docsRepositoryBase="https://github.com/kernl-sdk/kernl/tree/main/docs"
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
