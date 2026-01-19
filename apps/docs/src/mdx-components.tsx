import defaultMdxComponents from 'fumadocs-ui/mdx';
import { Step, Steps } from 'fumadocs-ui/components/steps';
import { TypeTable } from 'fumadocs-ui/components/type-table';
import { CodeBlock, Pre } from 'fumadocs-ui/components/codeblock';
import type { MDXComponents } from 'mdx/types';
import type { ComponentPropsWithoutRef } from 'react';

function KernlIcon({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size * 0.764}
      height={size}
      viewBox="0 0 41.98 54.9"
      fill="currentColor"
      className="text-[var(--color-steel)]"
    >
      <path d="M13.88,17.99c2.49,0,4.51-1.97,4.51-4.41s-2.02-4.41-4.51-4.41-4.51,1.97-4.51,4.41,2.02,4.41,4.51,4.41Z" />
      <path d="M14.43,0c5.01,1.01,13.36,3.97,13.36,13.34.08,1.78-.21,3.56-.84,5.24-.63,1.67-1.6,3.21-2.84,4.52-1.24,1.31-2.74,2.37-4.4,3.11-1.66.74-3.46,1.16-5.28,1.22C7.84,27.42.15,31.96,0,40.71c-.02,1.86.34,3.71,1.06,5.43.72,1.72,1.78,3.29,3.12,4.61,1.34,1.32,2.94,2.37,4.7,3.08,1.76.71,3.65,1.08,5.55,1.07,7.62-.08,27.7-6.51,27.55-27.48C41.83,6.46,20.51,0,14.43,0ZM13.88,45.69c-2.49,0-4.51-1.97-4.51-4.41s2.02-4.41,4.51-4.41,4.51,1.97,4.51,4.41-2.02,4.41-4.51,4.41Z" />
    </svg>
  );
}

function OverviewHero({ description }: { description?: string }) {
  return (
    <div className="overview-hero flex flex-col items-center text-center mb-8">
      <KernlIcon size={36} />
      <h1
        className="mt-6 mb-2"
        style={{
          fontFamily: "'SF Mono', Menlo, monospace",
          fontWeight: 300,
          fontSize: '1.25rem',
          color: 'var(--color-brand-neon)'
        }}
      >
        kernl
      </h1>
      {description && <p className="text-[#7a7a7a] text-sm max-w-lg">{description}</p>}
    </div>
  );
}

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    Step,
    Steps,
    TypeTable,
    KernlIcon,
    OverviewHero,
    pre: (props: ComponentPropsWithoutRef<'pre'>) => (
      <CodeBlock keepBackground {...props}>
        <Pre>{props.children}</Pre>
      </CodeBlock>
    ),
    ...components,
  };
}
