import { randomUUID } from "crypto";
import type { Db } from "@golf-district/database";
import { eq } from "@golf-district/database";
import { users } from "@golf-district/database/schema/users";
import { withdrawals } from "@golf-district/database/schema/withdrawals";
import Logger from "@golf-district/shared/src/logger";
import { NotificationService } from "../notification/notification.service";
import type { StripeService } from "../payment-processor/stripe.service";

export class CashOutService {
  private readonly logger = Logger(CashOutService.name);
  constructor(
    private readonly database: Db,
    private readonly stripeService: StripeService,
    private readonly notificationService: NotificationService
  ) {}

  //create stripe account returns hosted account link url
  createStripeAccountLink = async (userId: string, accountSettingsHref: string) => {
    // const refreshUrl = `${courseDomain}/reAuth`;
    this.logger.info;
    const [user] = await this.database
      .select({
        stripeAccountId: users.stripeConnectAccountId,
        email: users.email,
        stripeConnectAccountStatus: users.stripeConnectAccountStatus,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute();
    if (!user) {
      this.logger.error(`Error creating stripe account: user ${userId} does not exist`);
      throw new Error(`Error creating stripe account: user ${userId} does not exist`);
    }
    if (user.stripeConnectAccountStatus === "CONNECTED") {
      this.logger.warn(
        `Error creating stripe account: user ${userId} already has a connected stripe account`
      );
      throw new Error(`Error creating stripe account: user ${userId} already has a connected stripe account`);
    }
    if (user.stripeAccountId) {
      this.logger.warn(`Stripe account already exists for user ${userId} returning new account link`);
      //@TODO: create a refresh url and return url string template
      const res = await this.stripeService.createAccountLink(
        user.stripeAccountId,
        accountSettingsHref, //refreshUrl
        accountSettingsHref //returnUrl
      );
      console.log(res);
      return res;
    }
    if (!user.email) {
      this.logger.error(`Error creating stripe account: user ${userId} does not have an email`);
      throw new Error(`Error creating stripe account: user ${userId} does not have an email`);
    }
    //create stripe account
    const account = await this.stripeService.createStandardStripeAccount(user.email);
    const accountId = account.id;
    //save stripe account id to user
    await this.database
      .update(users)
      .set({
        stripeConnectAccountId: accountId,
      })
      .where(eq(users.id, userId))
      .execute();

    const res = await this.stripeService.createAccountLink(
      accountId,
      accountSettingsHref, //refreshUrl
      accountSettingsHref //returnUrl
    );
    console.log(res);
    return res;
  };

  //cash out the users entire balance
  requestCashOut = async (userId: string) => {
    //check if user has stripe account
    const [user] = await this.database
      .select({
        stripeAccountId: users.stripeConnectAccountId,
        stripeConnectAccountStatus: users.stripeConnectAccountStatus,
        balance: users.balance,
      })
      .from(users)
      .where(eq(users.id, userId))
      .execute();
    //check if user has a non pending balance
    if (!user) {
      this.logger.error(`Error requesting cashout: user ${userId} does not exist`);
      throw new Error(`Error requesting cashout: user does not exist`);
    }
    if (user.stripeConnectAccountStatus !== "CONNECTED" || !user.stripeAccountId) {
      this.logger.error(`Error requesting cashout: user ${userId} does not have a connected stripe account`);
      throw new Error(`Error requesting cashout: user does not have a connected stripe account`);
    }
    //@TODO: create a minimum balance constant
    if (user.balance < 10) {
      this.logger.error(`Error requesting cashout: user ${userId} does not have enough balance`);
      throw new Error(`Error requesting cashout: user ${userId} does not have enough balance`);
    }
    //create stripe payout
    await this.stripeService.createPayout(user.stripeAccountId, user.balance, "usd").catch((err) => {
      this.logger.error(`Error creating stripe payout: ${err}`);
      throw new Error(
        `Error creating stripe payout funds have not been withdrawn if this error persists please contact support`
      );
    });
    //update user balance
    await this.database
      .update(users)
      .set({
        balance: 0,
      })
      .where(eq(users.id, userId))
      .execute();
    //create cashout record
    await this.database
      .insert(withdrawals)
      .values({
        id: randomUUID(),
        userId: userId,
        amount: user.balance,
      })
      .execute();
    await this.notificationService.createNotification(
      userId,
      "Cashout Initiated",
      "Your funds have been withdrawn to your bank account"
    );
  };
}
