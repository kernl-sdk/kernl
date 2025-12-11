import * as runtime from "react/jsx-runtime";

interface MDXContentProps {
  code: string;
}

const useMDXComponent = (code: string) => {
  const fn = new Function(code);
  return fn({ ...runtime }).default;
};

export function MDXContent({ code }: MDXContentProps) {
  const Component = useMDXComponent(code);
  return <Component />;
}
