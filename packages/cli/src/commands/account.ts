import { Option } from "clipanion";
import { ApiError } from "../lib/api-client.js";
import { BaseCommand } from "./base.js";

export class AccountDeleteCommand extends BaseCommand {
  static override paths = [["account", "delete"]];
  static override usage = BaseCommand.Usage({
    description: "Permanently delete your account (posts, follows, tokens)",
  });

  yes = Option.Boolean("--yes", false, {
    description: "Skip the confirmation prompt",
  });

  async execute(): Promise<number> {
    return this.guard(async () => {
      if (!this.yes) {
        throw new ApiError(
          400,
          "this permanently deletes your account and all your posts. re-run with --yes to confirm",
        );
      }
      const me = this.config().username;
      await this.client(true).deleteAccount();
      // drop the now-invalid token, keep the server URL
      this.saveConfig({ apiUrl: this.config().apiUrl });
      const c = this.colors();
      this.out(
        `${c.green("✓")} account ${me ? c.bold(`@${me}`) : ""} deleted. so long.`,
      );
    });
  }
}
