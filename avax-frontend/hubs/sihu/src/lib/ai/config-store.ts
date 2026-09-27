export type AIProvider = "openai" | "gemini" | "anthropic";

export interface AIConfig {
  activeProvider: AIProvider;
  models: Record<AIProvider, string>;
  keys: Partial<Record<AIProvider, string>>;
  updatedAt: string | null;
}

interface AIConfigUpdate {
  activeProvider?: AIProvider;
  models?: Partial<Record<AIProvider, string>>;
  keys?: Partial<Record<AIProvider, string>>;
  updatedAt?: string | null;
}

const defaultConfig: AIConfig = {
  activeProvider: "openai",
  models: {
    openai: "gpt-4.1-mini",
    gemini: "gemini-1.5-flash",
    anthropic: "claude-3-5-sonnet-latest",
  },
  keys: {
    openai: process.env.OPENAI_API_KEY || undefined,
    gemini: process.env.GEMINI_API_KEY || undefined,
    anthropic: process.env.ANTHROPIC_API_KEY || undefined,
  },
  updatedAt: null,
};

let memoryConfig: AIConfig = { ...defaultConfig };

function sanitizeConfig(raw: AIConfigUpdate | Partial<AIConfig> | null | undefined): AIConfig {
  return {
    activeProvider:
      raw?.activeProvider && ["openai", "gemini", "anthropic"].includes(raw.activeProvider)
        ? raw.activeProvider
        : defaultConfig.activeProvider,
    models: {
      openai: raw?.models?.openai || defaultConfig.models.openai,
      gemini: raw?.models?.gemini || defaultConfig.models.gemini,
      anthropic: raw?.models?.anthropic || defaultConfig.models.anthropic,
    },
    keys: {
      openai: raw?.keys?.openai || memoryConfig.keys.openai || defaultConfig.keys.openai,
      gemini: raw?.keys?.gemini || memoryConfig.keys.gemini || defaultConfig.keys.gemini,
      anthropic: raw?.keys?.anthropic || memoryConfig.keys.anthropic || defaultConfig.keys.anthropic,
    },
    updatedAt: raw?.updatedAt || null,
  };
}

function maskKey(provider: AIProvider, value?: string) {
  if (!value) return null;

  if (provider === "openai") return `sk-...${value.slice(-4)}`;
  if (provider === "gemini") return `AIza...${value.slice(-4)}`;
  return `sk-ant-...${value.slice(-4)}`;
}

export async function readAIConfig(): Promise<AIConfig> {
  return memoryConfig;
}

export async function writeAIConfig(update: AIConfigUpdate): Promise<AIConfig> {
  const next = sanitizeConfig({
    ...memoryConfig,
    ...update,
    models: {
      ...memoryConfig.models,
      ...update.models,
    },
    keys: {
      ...memoryConfig.keys,
      ...update.keys,
    },
    updatedAt: new Date().toISOString(),
  });

  memoryConfig = next;
  return next;
}

export async function readPublicAIConfig() {
  const config = await readAIConfig();
  return {
    activeProvider: config.activeProvider,
    models: config.models,
    configured: {
      openai: !!config.keys.openai,
      gemini: !!config.keys.gemini,
      anthropic: !!config.keys.anthropic,
    },
    maskedKeys: {
      openai: maskKey("openai", config.keys.openai),
      gemini: maskKey("gemini", config.keys.gemini),
      anthropic: maskKey("anthropic", config.keys.anthropic),
    },
    updatedAt: config.updatedAt,
    storageMode: "in-memory-env",
  };
}
