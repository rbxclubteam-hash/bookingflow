import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // This is a scoped portfolio demo, not an AI-agent-authored template —
  // skip generating AGENTS.md/CLAUDE.md on every dev/build run.
  agentRules: false,
};

export default nextConfig;
