import type { Db } from "@golf-district/database";
import { eq } from "@golf-district/database";
import { users } from "@golf-district/database/schema/users";
import Logger from "@golf-district/shared/src/logger";
import type { NotificationService } from "../notification/notification.service";
import type { StripeService } from "../payment-processor/stripe.service";

export class StripeConnectWebhookService {
  private readonly logger = Logger(StripeConnectWebhookService.name);
  constructor(
    private readonly database: Db,
    private readonly notificationService: NotificationService,
    private readonly stripeService: StripeService,
    private readonly stripeWebhookEndpointSecret: string
  ) {}

  processWebhook = async (request: string, sig: string) => {
    const event = this.stripeService.constructEvent(request, sig, this.stripeWebhookEndpointSecret);
    switch (event.type) {
      case "account.updated":
        await this.processAccountUpdateWebhook(event.data.object);
        break;
      default:
        this.logger.warn(`Unhandled webhook event type: ${event.type}`);
        break;
    }
  };

  processAccountUpdateWebhook = async (req: any) => {
    const accountId = req.id as string;
    this.logger.debug(`Stripe webhook connect received: ${accountId}`);
    const isAccountLinked = await this.stripeService.isAccountLinked(accountId);
    const [user] = await this.database
      .select({
        id: users.id,
      })
      .from(users)
      .where(eq(users.stripeConnectAccountId, accountId))
      .limit(1);
    if (!user) throw new Error(`User not found for account id: ${accountId}`);

    if (isAccountLinked) {
      this.logger.debug(`Stripe webhook connect account linked for account id: ${accountId}`);
      await this.database
        .update(users)
        .set({
          stripeConnectAccountStatus: "CONNECTED",
        })
        .where(eq(users.stripeConnectAccountId, accountId));
    } else {
      this.logger.debug(`Stripe webhook connect account not linked for account id: ${accountId}`);
      await this.database
        .update(users)
        .set({
          stripeConnectAccountStatus: "DISCONNECTED",
        })
        .where(eq(users.stripeConnectAccountId, accountId));
    }

    await this.notificationService.createNotification(
      user.id,
      "Stripe Connect Account Status Updated",
      `Stripe Connect Account Status Updated for your account take action immediately if you did not initiate this change.`
    );
  };
}
