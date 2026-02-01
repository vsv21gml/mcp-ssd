import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { FilesService } from "./files.service";

@Injectable()
export class ExpiryJob {
  private readonly logger = new Logger(ExpiryJob.name);

  constructor(private readonly files: FilesService) {}

  @Cron("0 0 * * *")
  async handleCron() {
    const affected = await this.files.markExpired();
    if (affected > 0) {
      this.logger.log(`Expired ${affected} files`);
    }
  }
}
