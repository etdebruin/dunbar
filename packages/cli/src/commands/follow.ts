import { Option } from "clipanion";
import { formatUserList } from "../lib/output.js";
import { BaseCommand } from "./base.js";

export class FollowCommand extends BaseCommand {
  static override paths = [["follow"]];
  static override usage = BaseCommand.Usage({ description: "Follow a user" });

  username = Option.String({ required: true });

  async execute(): Promise<number> {
    return this.guard(async () => {
      await this.client(true).follow(this.username);
      if (this.json) return this.outJson({ following: this.username });
      const c = this.colors();
      this.out(`${c.green("✓")} now following ${c.bold(`@${this.username}`)}`);
    });
  }
}

export class UnfollowCommand extends BaseCommand {
  static override paths = [["unfollow"]];
  static override usage = BaseCommand.Usage({ description: "Unfollow a user" });

  username = Option.String({ required: true });

  async execute(): Promise<number> {
    return this.guard(async () => {
      await this.client(true).unfollow(this.username);
      if (this.json) return this.outJson({ following: false });
      this.out(`unfollowed ${this.colors().bold(`@${this.username}`)}`);
    });
  }
}

export class FollowingCommand extends BaseCommand {
  static override paths = [["following"]];
  static override usage = BaseCommand.Usage({
    description: "List who a user follows (default: you)",
  });

  username = Option.String({ required: false });

  async execute(): Promise<number> {
    return this.guard(async () => {
      const who = this.resolveUsername(this.username);
      const users = await this.client().following(who);
      if (this.json) return this.outJson(users);
      this.out(formatUserList(users, this.colors(), `@${who} follows no one`));
    });
  }
}

export class FollowersCommand extends BaseCommand {
  static override paths = [["followers"]];
  static override usage = BaseCommand.Usage({
    description: "List a user's followers (default: you)",
  });

  username = Option.String({ required: false });

  async execute(): Promise<number> {
    return this.guard(async () => {
      const who = this.resolveUsername(this.username);
      const users = await this.client().followers(who);
      if (this.json) return this.outJson(users);
      this.out(formatUserList(users, this.colors(), `@${who} has no followers`));
    });
  }
}
