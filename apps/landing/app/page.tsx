import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { CodePanel } from "@/components/code-panel";
import { CodeSection } from "@/components/code-section";
// import { LogoMarquee } from "@/components/logo-marquee";
import { Features } from "@/components/features";
import { VideoPlaceholder } from "@/components/video-placeholder";
import { highlight } from "@/lib/highlight";

const agentCode = `// agents/jarvis.ts

/**
 * JARVIS - Just A Rather Very Intelligent System
 */
export const jarvis = new Agent({
  id: "jarvis",
  name: "J.A.R.V.I.S.",
  model: anthropic("claude-sonnet-4-5"),
  instructions: "You are JARVIS, assisting Tony Stark.",
  toolkits: [suit, tower, intel],
  memory: { enabled: true },
});`;

const appCode = `const kernl = new Kernl({
  storage: {
    db: postgres({ connstr: process.env.DATABASE_URL }),
  },
});

kernl.register(jarvis);

// thread persistence handled for you
const stream = jarvis.stream(
  "Jarvis, run a full suit diagnostic please.",
  { threadId: "thread_123" },
);`;

export default async function Home() {
  const appHtml = await highlight(appCode);
  const agentHtml = await highlight(agentCode);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="flex flex-col items-center px-6">
        <Hero />
        <section className="flex w-full max-w-md justify-center pt-8 sm:max-w-lg md:max-w-2xl lg:max-w-3xl xl:max-w-5xl min-[1624px]:max-w-6xl min-[1900px]:max-w-7xl">
          <CodeSection
            appCode={<CodePanel html={appHtml} />}
            agentCode={<CodePanel html={agentHtml} />}
          />
        </section>
        {/* <LogoMarquee /> */}
        <Features />
        <VideoPlaceholder />
      </main>
    </div>
  );
}
