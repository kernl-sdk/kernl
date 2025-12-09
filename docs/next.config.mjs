import nextra from 'nextra'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const jotai = require('./themes/jotai.json')

const withNextra = nextra({
  defaultShowCopyCode: true,
  mdxOptions: {
    rehypePrettyCodeOptions: {
      theme: {
        dark: jotai,
        light: 'min-light'
      }
    }
  }
})

export default withNextra({
  experimental: {
    viewTransition: true
  }
})
