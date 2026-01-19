import { source } from '@/lib/source';
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from 'fumadocs-ui/layouts/docs/page';
import { notFound } from 'next/navigation';
import { getMDXComponents } from '@/mdx-components';
import type { Metadata } from 'next';
import { createRelativeLink } from 'fumadocs-ui/mdx';
import { PageActions } from '@/components/page-actions';

// Extract title from TOC's first heading if not in frontmatter
function getTitle(page: { data: { title?: string; toc: { title: string }[] }; url: string }) {
  if (page.data.title) return page.data.title;
  // Try first TOC entry (usually the h1)
  if (page.data.toc?.[0]?.title) return page.data.toc[0].title;
  // Fallback to URL segment
  return page.url.split('/').pop() || 'Untitled';
}

export default async function Page(props: PageProps<'/[[...slug]]'>) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;
  const isOverview = !params.slug || params.slug.length === 0;
  const isReference = params.slug?.[0] === 'reference';
  const title = getTitle(page as Parameters<typeof getTitle>[0]);

  return (
    <DocsPage
      toc={page.data.toc}
      full={page.data.full}
    >
      {!isOverview && !isReference && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <DocsTitle>{title}</DocsTitle>
            <DocsDescription>{page.data.description}</DocsDescription>
          </div>
          <PageActions markdownUrl={`/llms.mdx${page.url}`} />
        </div>
      )}
      <DocsBody className={isReference ? 'relative' : undefined}>
        {isReference && (
          <div className="absolute right-0 top-0 z-10">
            <PageActions markdownUrl={`/llms.mdx${page.url}`} />
          </div>
        )}
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

  const title = getTitle(page as Parameters<typeof getTitle>[0]);
  const ogImage = page.data.image || DEFAULT_OG_IMAGE;

  return {
    title,
    description: page.data.description,
    openGraph: {
      images: ogImage,
    },
  };
}
