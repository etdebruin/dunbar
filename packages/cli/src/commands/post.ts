import { readFileSync } from "node:fs";
import { Option } from "clipanion";
import { ApiError } from "../lib/api-client.js";
import { BaseCommand } from "./base.js";

async function readStdin(stream: NodeJS.ReadableStream): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString("utf8");
}

export class PostCommand extends BaseCommand {
  static override paths = [["post"]];
  static override usage = BaseCommand.Usage({
    description: "Publish a text post (from an argument, --file, or stdin)",
  });

  text = Option.String({ required: false });
  file = Option.String("--file", { description: "Read post body from a file" });

  async execute(): Promise<number> {
    return this.guard(async () => {
      let body = this.text;
      if (body === undefined && this.file) {
        body = readFileSync(this.file, "utf8");
      }
      const stdin = this.context.stdin as NodeJS.ReadStream;
      if (body === undefined && !stdin.isTTY) {
        body = await readStdin(stdin);
      }
      if (body === undefined || body.trim() === "") {
        throw new ApiError(400, "nothing to post");
      }

      const post = await this.client(true).createPost(body.trim());
      if (this.json) return this.outJson(post);
      const c = this.colors();
      this.out(`${c.green("✓")} posted ${c.dim(`(${post.id.slice(0, 8)})`)}`);
    });
  }
}
