import { PRODUCT_NAME } from "@dunbar/shared";
import { Builtins, Cli } from "clipanion";
import { AccountDeleteCommand } from "./commands/account.js";
import {
  LogoutCommand,
  RegisterCommand,
  WhoamiCommand,
} from "./commands/auth.js";
import { FeedCommand } from "./commands/feed.js";
import {
  FollowCommand,
  FollowersCommand,
  FollowingCommand,
  UnfollowCommand,
} from "./commands/follow.js";
import { PostCommand } from "./commands/post.js";
import { ProfileCommand, ProfileEditCommand } from "./commands/profile.js";

/** Construct the CLI with all commands registered. */
export function buildCli(): Cli {
  const cli = new Cli({
    binaryLabel: "dunbar",
    binaryName: PRODUCT_NAME,
    binaryVersion: "0.1.0",
  });

  cli.register(RegisterCommand);
  cli.register(LogoutCommand);
  cli.register(WhoamiCommand);
  cli.register(PostCommand);
  cli.register(FollowCommand);
  cli.register(UnfollowCommand);
  cli.register(FollowingCommand);
  cli.register(FollowersCommand);
  cli.register(FeedCommand);
  cli.register(ProfileCommand);
  cli.register(ProfileEditCommand);
  cli.register(AccountDeleteCommand);

  cli.register(Builtins.HelpCommand);
  cli.register(Builtins.VersionCommand);

  return cli;
}
