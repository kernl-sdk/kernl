import { source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { PageActions } from '@/components/page-actions';

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const isOverview = !params.slug || params.slug.length === 0;

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
    >
      {!isOverview && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <DocsTitle>{page.data.title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
          </div>
          <PageActions markdownUrl={`/llms.mdx${page.url}`} />
        </div>
      )}
      <DocsBody>
        <MDX
          components={getMDXComponents({
            // this allows you to link to other pages with relative file paths
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

const DEFAULT_OG_IMAGE = '/og/kernl.png';

export async function generateMetadata(props: PageProps<'/[[...slug]]'>): Promise<Metadata> {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  // Use per-page image if specified, otherwise default
  const ogImage = page.data.image || DEFAULT_OG_IMAGE;

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: ogImage,
    },
  };
}
