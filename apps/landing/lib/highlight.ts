import { codeToHtml, ShikiTransformer } from "shiki";
import jotai from "@/themes/jotai.json";

const transformerLineNumbers: ShikiTransformer = {
  name: "line-numbers",
  code(node) {
    node.properties["data-line-numbers"] = "";
  },
  line(node, line) {
    node.children = [
      {
        type: "element",
        tagName: "span",
        properties: { class: "line-number", style: "color: oklch(0.325 0 90)" },
        children: [{ type: "text", value: String(line) }],
      },
      ...node.children,
    ];
  },
};

export async function highlight(code: string, lang: string = "typescript") {
  return codeToHtml(code, {
    lang,
    theme: jotai as any,
    transformers: [transformerLineNumbers],
  });
}
