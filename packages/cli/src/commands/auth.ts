import { Option } from "clipanion";
import { BaseCommand } from "./base.js";

export class RegisterCommand extends BaseCommand {
  static override paths = [["auth", "register"]];
  static override usage = BaseCommand.Usage({
    description: "Create an account and store its token",
  });

  username = Option.String("--username", { required: true });
  name = Option.String("--name", { description: "Display name" });

  async execute(): Promise<number> {
    return this.guard(async () => {
      const client = this.client();
      const { token, user } = await client.register(this.username, this.name);
      this.saveConfig({
        apiUrl: this.apiUrl(),
        token,
        username: user.username,
      });
      if (this.json) return this.outJson(user);
      const c = this.colors();
      this.out(
        `${c.green("✓")} registered as ${c.bold(`@${user.username}`)} — token saved`,
      );
    });
  }
}

export class LogoutCommand extends BaseCommand {
  static override paths = [["auth", "logout"]];
  static override usage = BaseCommand.Usage({
    description: "Revoke the stored token and forget it",
  });

  async execute(): Promise<number> {
    return this.guard(async () => {
      const config = this.config();
      if (config.token) {
        await this.client(true).logout();
      }
      this.saveConfig({ apiUrl: config.apiUrl });
      this.out(`${this.colors().green("✓")} logged out`);
    });
  }
}

export class WhoamiCommand extends BaseCommand {
  static override paths = [["whoami"]];
  static override usage = BaseCommand.Usage({
    description: "Show the currently logged-in user",
  });

  async execute(): Promise<number> {
    return this.guard(async () => {
      const user = await this.client(true).whoami();
      if (this.json) return this.outJson(user);
      this.out(this.colors().bold(`@${user.username}`));
    });
  }
}
