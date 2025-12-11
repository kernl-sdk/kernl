import { Metadata } from "next";

import { Header } from "@/components/header";
import { IconKernl } from "@/components/ui/icons";

import { MarketplaceSearch } from "./search";

export const metadata: Metadata = {
  title: "Marketplace | kernl",
  description:
    "A collection of tool integrations maintained by the kernl community.",
};

interface Toolkit {
  name: string;
  type: string;
  title: string;
  description: string;
  icon?: string;
  category?: string;
}

async function getToolkits(): Promise<Toolkit[]> {
  const res = await fetch("https://registry.kernl.sh/index.json", {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return [];
  return res.json();
}

export default async function MarketplacePage() {
  const toolkits = await getToolkits();

  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex flex-col items-center px-6 pt-32">
        <IconKernl size={36} className="text-steel" />
        <h1 className="mt-8 text-[1.375rem] font-semibold text-foreground">
          Marketplace
        </h1>
        <p className="mt-4 text-sm text-muted-foreground">
          A collection of tool integrations maintained by the kernl community.
        </p>
        <MarketplaceSearch toolkits={toolkits} />
      </main>
    </div>
  );
}
