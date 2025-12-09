import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { useMDXComponents } from '../../mdx-components'
import { PageActions } from '../../components/page-actions'

export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: PageProps) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  return metadata
}

type PageProps = {
  params: Promise<{ mdxPath?: string[] }>
}

export default async function Page(props: PageProps) {
  const params = await props.params
  const { default: MDXContent, toc, metadata, sourceCode } = await importPage(params.mdxPath)
  const Wrapper = useMDXComponents().wrapper

  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <PageActions />
      <MDXContent />
    </Wrapper>
  )
}
