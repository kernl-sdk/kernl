import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AppLayout } from "@/app/layout";
import HomePage from "@/app/page";
import AgentsPage from "@/app/agents/page";
import AgentChatPage from "@/app/agents/[agentId]/page";
import ThreadPage from "@/app/agents/[agentId]/c/[threadId]/page";
import ToolkitsPage from "@/app/toolkits/page";
import ToolkitPage from "@/app/toolkits/[toolkitId]/page";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/agents/:agentId" element={<AgentChatPage />} />
          <Route path="/agents/:agentId/c/:threadId" element={<ThreadPage />} />
          <Route path="/toolkits" element={<ToolkitsPage />} />
          <Route path="/toolkits/:toolkitId" element={<ToolkitPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
