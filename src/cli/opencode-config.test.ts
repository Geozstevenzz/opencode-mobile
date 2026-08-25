import * as fs from "fs";
import * as os from "os";
import * as path from "path";

import { afterEach, describe, expect, it, vi } from "vitest";

const { testHomeDirectory } = vi.hoisted(() => ({
  testHomeDirectory: `${process.env.TEMP ?? process.env.TMP ?? "."}\\opencode-mobile-config-${process.pid}-${Date.now()}`,
}));

vi.mock("os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("os")>();
  return { ...actual, homedir: () => testHomeDirectory };
});

fs.mkdirSync(testHomeDirectory, { recursive: true });

const {
  installPluginToGlobalOpenCodeConfig,
  removePluginFromGlobalOpenCodeConfig,
  resolveGlobalCommandPath,
} = await import("./opencode-config.js");

const configPath = path.join(testHomeDirectory, ".config", "opencode", "opencode.json");

afterEach(() => {
  fs.rmSync(path.join(testHomeDirectory, ".config"), { force: true, recursive: true });
});

function writeConfig(plugin: unknown[]): void {
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify({ plugin }, null, 2), "utf-8");
}

function readPlugins(): unknown[] {
  const config: unknown = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    throw new Error("Expected an OpenCode config object.");
  }

  const plugins = (config as Record<string, unknown>).plugin;
  if (!Array.isArray(plugins)) {
    throw new Error("Expected the config plugin property to be an array.");
  }

  return plugins;
}

describe("OpenCode plugin config updates", () => {
  const goalPlugin = ["@prevalentware/opencode-goal-plugin", { register_command: false }];

  it("uses OpenCode's singular command directory on Windows", () => {
    expect(resolveGlobalCommandPath("mobile", "win32")).toBe(
      path.join(os.homedir(), ".config", "opencode", "command", "mobile.md"),
    );
  });

  it("preserves tuple plugins when installing opencode-mobile", () => {
    writeConfig([goalPlugin, "existing-plugin@1.0.0"]);

    installPluginToGlobalOpenCodeConfig("opencode-mobile@latest");

    expect(readPlugins()).toEqual([goalPlugin, "existing-plugin@1.0.0", "opencode-mobile@latest"]);
  });

  it("preserves tuple plugins when removing opencode-mobile", () => {
    writeConfig([goalPlugin, "opencode-mobile@latest", "existing-plugin@1.0.0"]);

    removePluginFromGlobalOpenCodeConfig("opencode-mobile@latest");

    expect(readPlugins()).toEqual([goalPlugin, "existing-plugin@1.0.0"]);
  });
});
