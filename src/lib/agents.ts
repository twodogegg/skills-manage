import type { AgentWithStatus } from "@/types";

export const CENTRAL_AGENT_ID = "central";
export const OBSIDIAN_AGENT_ID = "obsidian";
export const PLATFORM_VISIBILITY_STORAGE_KEY = "skills-manage:visible-platform-ids";
export const PLATFORM_VISIBILITY_CHANGE_EVENT = "skills-manage:visible-platforms-change";
export const DEFAULT_VISIBLE_PLATFORM_IDS = ["codex", "claude-code"] as const;

const NON_INSTALL_TARGET_AGENT_IDS = new Set([
  CENTRAL_AGENT_ID,
  OBSIDIAN_AGENT_ID,
]);

export function isInstallTargetAgent(agent: Pick<AgentWithStatus, "id">): boolean {
  return !NON_INSTALL_TARGET_AGENT_IDS.has(agent.id);
}

export function isEnabledInstallTargetAgent(
  agent: Pick<AgentWithStatus, "id" | "is_enabled">
): boolean {
  return isInstallTargetAgent(agent) && agent.is_enabled;
}

function browserStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getVisiblePlatformIds(): string[] {
  const storage = browserStorage();
  if (!storage) return [...DEFAULT_VISIBLE_PLATFORM_IDS];

  const raw = storage.getItem(PLATFORM_VISIBILITY_STORAGE_KEY);
  if (!raw) return [...DEFAULT_VISIBLE_PLATFORM_IDS];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((value) => typeof value === "string")) {
      return parsed;
    }
  } catch {
    // Fall through to the default if the stored value is malformed.
  }

  return [...DEFAULT_VISIBLE_PLATFORM_IDS];
}

export function setVisiblePlatformIds(agentIds: string[]) {
  const storage = browserStorage();
  if (!storage) return;
  storage.setItem(PLATFORM_VISIBILITY_STORAGE_KEY, JSON.stringify([...new Set(agentIds)]));
  window.dispatchEvent(new Event(PLATFORM_VISIBILITY_CHANGE_EVENT));
}

export function isVisiblePlatformAgent(agent: Pick<AgentWithStatus, "id">): boolean {
  return getVisiblePlatformIds().includes(agent.id);
}

export function filterVisiblePlatformAgents<T extends Pick<AgentWithStatus, "id">>(
  agents: T[]
): T[] {
  const visibleIds = new Set(getVisiblePlatformIds());
  return agents.filter((agent) => visibleIds.has(agent.id));
}
