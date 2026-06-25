import { Command, Option } from "clipanion";
import {
  type DunbarConfig,
  readConfig,
  resolveApiUrl,
  writeConfig,
} from "../lib/config.js";
import {
  ApiError,
  createClient,
  type DunbarClient,
} from "../lib/api-client.js";
import { makeColors, type Colors } from "../lib/output.js";

/** Shared options + helpers for every dunbar command. */
export abstract class BaseCommand extends Command {
  json = Option.Boolean("--json", false, {
    description: "Output raw JSON for scripting",
  });
  apiFlag = Option.String("--api", { description: "API base URL override" });
  noColor = Option.Boolean("--no-color", false, {
    description: "Disable colored output",
  });

  protected config(): DunbarConfig {
    return readConfig();
  }

  protected saveConfig(config: DunbarConfig): void {
    writeConfig(config);
  }

  protected apiUrl(config = this.config()): string {
    return resolveApiUrl({ flag: this.apiFlag, config });
  }

  /** Build an API client. With `auth: true`, requires a stored token. */
  protected client(auth = false): DunbarClient {
    const config = this.config();
    if (auth && !config.token) {
      throw new ApiError(
        401,
        "not logged in — run `dunbar auth register` first",
      );
    }
    return createClient({ apiUrl: this.apiUrl(config), token: config.token });
  }

  /** A username argument, or the logged-in user when omitted. */
  protected resolveUsername(arg?: string): string {
    const who = arg ?? this.config().username;
    if (!who) {
      throw new ApiError(400, "no username given and not logged in");
    }
    return who;
  }

  protected colors(): Colors {
    const enabled = !this.noColor && !process.env.NO_COLOR;
    return makeColors(enabled);
  }

  protected out(text: string): void {
    this.context.stdout.write(`${text}\n`);
  }

  protected outJson(data: unknown): void {
    this.context.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
  }

  protected err(text: string): void {
    this.context.stderr.write(`${text}\n`);
  }

  /** Run the body, turning ApiError into a clean stderr message + exit code. */
  protected async guard(body: () => Promise<void>): Promise<number> {
    try {
      await body();
      return 0;
    } catch (e) {
      if (e instanceof ApiError) {
        this.err(this.colors().red(`error: ${e.message}`));
        return 1;
      }
      throw e;
    }
  }
}
