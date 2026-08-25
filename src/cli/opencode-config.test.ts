import * as os from "os";
import * as path from "path";

import { describe, expect, it } from "vitest";

import { resolveGlobalCommandPath } from "./opencode-config.js";

describe("resolveGlobalCommandPath", () => {
  it("uses OpenCode's singular command directory on Windows", () => {
    expect(resolveGlobalCommandPath("mobile", "win32")).toBe(
      path.join(os.homedir(), ".config", "opencode", "command", "mobile.md"),
    );
  });
});
