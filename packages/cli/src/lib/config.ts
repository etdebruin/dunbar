import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export interface DunbarConfig {
  apiUrl?: string;
  token?: string;
  username?: string;
}

export const DEFAULT_API_URL = "http://127.0.0.1:3000";

/** Location of the config file. `DUNBAR_CONFIG` (full path) or `DUNBAR_HOME`
 *  (home dir) override the default `~/.dunbar/config`. */
export function configPath(): string {
  if (process.env.DUNBAR_CONFIG) return process.env.DUNBAR_CONFIG;
  const home = process.env.DUNBAR_HOME ?? homedir();
  return join(home, ".dunbar", "config");
}

export function readConfig(path = configPath()): DunbarConfig {
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, "utf8")) as DunbarConfig;
  } catch {
    return {};
  }
}

export function writeConfig(config: DunbarConfig, path = configPath()): void {
  mkdirSync(dirname(path), { recursive: true, mode: 0o700 });
  writeFileSync(path, `${JSON.stringify(config, null, 2)}\n`, { mode: 0o600 });
  chmodSync(path, 0o600); // ensure perms even if the file pre-existed
}

/** Resolve the API base URL: flag > config > $DUNBAR_API > default. */
export function resolveApiUrl(opts: {
  flag?: string | undefined;
  config?: DunbarConfig | undefined;
}): string {
  return (
    opts.flag ??
    opts.config?.apiUrl ??
    process.env.DUNBAR_API ??
    DEFAULT_API_URL
  );
}
