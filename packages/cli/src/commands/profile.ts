import { Option } from "clipanion";
import { ApiError } from "../lib/api-client.js";
import { formatPosts, formatUser } from "../lib/output.js";
import { BaseCommand } from "./base.js";

export class ProfileCommand extends BaseCommand {
  static override paths = [["profile"]];
  static override usage = BaseCommand.Usage({
    description: "Show a user's profile and recent posts (default: you)",
  });

  username = Option.String({ required: false });

  async execute(): Promise<number> {
    return this.guard(async () => {
      const who = this.resolveUsername(this.username);
      const client = this.client();
      const [user, posts] = await Promise.all([
        client.getUser(who),
        client.userPosts(who, { limit: 10 }),
      ]);
      if (this.json) return this.outJson({ user, posts: posts.items });
      const c = this.colors();
      this.out(formatUser(user, c));
      this.out("");
      this.out(formatPosts(posts.items, c, "no posts yet"));
    });
  }
}

export class ProfileEditCommand extends BaseCommand {
  static override paths = [["profile", "edit"]];
  static override usage = BaseCommand.Usage({
    description: "Update your display name and/or bio",
  });

  name = Option.String("--name", { description: "New display name" });
  bio = Option.String("--bio", { description: "New bio" });

  async execute(): Promise<number> {
    return this.guard(async () => {
      if (this.name === undefined && this.bio === undefined) {
        throw new ApiError(400, "pass --name and/or --bio");
      }
      const patch: { displayName?: string; bio?: string } = {};
      if (this.name !== undefined) patch.displayName = this.name;
      if (this.bio !== undefined) patch.bio = this.bio;

      const user = await this.client(true).updateProfile(patch);
      if (this.json) return this.outJson(user);
      this.out(`${this.colors().green("✓")} profile updated`);
    });
  }
}
