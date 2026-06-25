import { Option } from "clipanion";
import { formatPosts } from "../lib/output.js";
import { BaseCommand } from "./base.js";

export class FeedCommand extends BaseCommand {
  static override paths = [["feed"]];
  static override usage = BaseCommand.Usage({
    description: "Show posts from people you follow",
  });

  limit = Option.String("--limit", { description: "Max posts to show" });
  before = Option.String("--before", { description: "Pagination cursor" });

  async execute(): Promise<number> {
    return this.guard(async () => {
      const page = await this.client(true).feed({
        limit: this.limit ? Number(this.limit) : undefined,
        before: this.before,
      });
      if (this.json) return this.outJson(page);
      const c = this.colors();
      this.out(
        formatPosts(page.items, c, "your feed is quiet — follow some people"),
      );
      if (page.nextCursor) {
        this.out(c.dim(`\nmore: dunbar feed --before ${page.nextCursor}`));
      }
    });
  }
}
