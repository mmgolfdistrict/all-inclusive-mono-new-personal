import { eq, sql, type Db } from "@golf-district/database";
import { users } from "@golf-district/database/schema/users";
import Logger from "@golf-district/shared/src/logger";
import { Receiver } from "@upstash/qstash";
import type { NotificationService } from "../notification/notification.service";

export class UpdateWithdrawableBalance {
  private readonly logger = Logger(UpdateWithdrawableBalance.name);
  private readonly qStashReiver: Receiver;
  constructor(
    private readonly database: Db,
    private readonly notificationService: NotificationService,
    qStashCurrentSigningKey: string,
    qStashNextSigningKey: string
  ) {
    this.qStashReiver = new Receiver({
      currentSigningKey: qStashCurrentSigningKey,
      nextSigningKey: qStashNextSigningKey,
    });
  }
  processWebhook = async (webhook: { userId: string; amount: number }) => {
    console.log("webhook", webhook);
    // const isValid = await this.qStashReiver.verify(webhook).catch((err) => {
    //   this.logger.error(`Error verifying webhook: ${err}`);
    //   return false;
    // });
    // if (!isValid) {
    //   this.logger.error(`Error verifying webhook: ${webhook}`);
    //   return;
    // }
    //update user ballance and send email to user informing them of the update
    const { userId, amount } = webhook;
    await this.database
      .update(users)
      .set({
        balance: sql`${users.balance} + ${amount}`,
      })
      .where(eq(users.id, userId));
    // await this.notificationService.createNotification(
    //     userId,
    //     subject: "Your balance has been updated",
    //     body: `Your balance has been updated by ${amount}`,
    //     courseId: null,
    //     );
    this.logger.debug(`User ${userId} balance updated by ${amount}`);
  };
}
