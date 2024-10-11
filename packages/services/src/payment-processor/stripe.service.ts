import Logger from "@golf-district/shared/src/logger";
import type pino from "pino";
import Stripe from "stripe";
import { loggerService } from "../webhooks/logging.service";

export class StripeService {
  protected stripe: Stripe;
  protected logger: pino.Logger;
  constructor(apiKey: string, logger?: pino.Logger) {
    this.logger = logger ? logger : Logger(StripeService.name);
    this.stripe = new Stripe(apiKey, {
      apiVersion: "2023-08-16",
    });
  }
  //   getTaxRate = async (cart: ProductData[]): Promise<Stripe.Response<Stripe.Tax.Calculation>> => {
  //     const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = cart.map((product) => {
  //       return {
  //         name: product.name,
  //         amount: product.price,
  //         currency: product.currency,
  //         quantity: 1,
  //         description: `Product ID: ${product.id} - Type: ${product.product_data.metadata.type}`,
  //       };
  //     });
  //     return this.stripe.tax.calculations.create({
  //       currency: "usd",
  //       line_items: lineItems,
  //       customer_details: {
  //         address: {
  //           line1: "920 5th Ave",
  //           city: "Seattle",
  //           state: "WA",
  //           postal_code: "98104",
  //           country: "US",
  //         },
  //       },
  //     });
  //   };
  createStandardStripeAccount = async (userEmail: string): Promise<Stripe.Response<Stripe.Account>> =>
    this.stripe.accounts
      .create({
        type: "standard",
        country: "US",
        email: userEmail,
        capabilities: {
          transfers: {
            requested: true,
          },
        },
        //we can add this back any data to auto fill however email is the only required user field
        // individual: {
        //   first_name: params.firstName,
        //   last_name: params.lastName,
        //   email: params.email,
        //   phone: params.phone,
        // },
        // capabilities: {
        //   acss_debit_payments: {
        //     requested: true,
        //   },
        //   card_payments: {
        //     requested: true,
        //   },
        //   bank_transfer_payments: {
        //     requested: true,
        //   },
        // },
      })
      .catch((err) => {
        this.logger.error(`Error creating stripe account: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/StripeService/createStandardStripeAccount",
          userAgent: "",
          message: "ERROR_CREATING_STRIPE_ACCOUNT",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            userEmail
          })
        })
        throw new Error(`Error creating stripe account: ${err}`);
      });

  /**
   * @notice - This function returns an account link the user is redirected to connect their account
   * @param accountId - The id of the account to create a link for
   * @param refreshUrl - The url the user is redirected to if they refresh the page
   * @param returnUrl - The url the user is redirected to after they connect their account
   * @returns - A promise that resolves to the account link
   * @throws - Will throw an error if the account link creation fails
   * @dev - This function is used to create an account link for a user to connect their stripe account
   */
  createAccountLink = async (
    accountId: string,
    refreshUrl: string,
    returnUrl: string
  ): Promise<Stripe.Response<Stripe.AccountLink>> => {
    // if (!validDomainRegex().test(refreshUrl)) {
    //   this.logger.error(`Error creating stripe account link: refreshUrl ${refreshUrl} is not a valid domain`);
    //   throw new Error(`Error creating stripe account link: refreshUrl ${refreshUrl} is not a valid domain`);
    // }
    // if (!validDomainRegex().test(returnUrl)) {
    //   this.logger.error(`Error creating stripe account link: returnUrl ${returnUrl} is not a valid domain`);
    //   throw new Error(`Error creating stripe account link: returnUrl ${returnUrl} is not a valid domain`);
    // }
    return await this.stripe.accountLinks
      .create({
        account: accountId,
        refresh_url: refreshUrl,
        return_url: returnUrl,
        type: "account_onboarding",
        collect: "eventually_due",
      })
      .catch((err) => {
        this.logger.error(`Error creating stripe account link: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/StripeService/createAccountLink",
          userAgent: "",
          message: "ERROR_CREATING_STRIPE_ACCOUNT_LINK",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            accountId,
            refreshUrl,
            returnUrl
          })
        })
        throw new Error(`Error creating stripe account link: ${err}`);
      });
  };

  createPayout = async (
    accountId: string,
    amount: number,
    currency: string
  ): Promise<Stripe.Response<Stripe.Payout>> => {
    return this.stripe.payouts
      .create({
        amount: 10,
        currency: currency,
        destination: accountId,
        source_type: "bank_account",
      })
      .catch((err) => {
        this.logger.error(`Error creating stripe payout: ${err}`);
        loggerService.errorLog({
          userId: "",
          url: "/StripeService/createPayout",
          userAgent: "",
          message: "ERROR_CREATING_STRIPE_PAYOUT",
          stackTrace: `${err.stack}`,
          additionalDetailsJSON: JSON.stringify({
            accountId,
            currency
          })
        })
        throw new Error(`Error creating stripe payout: ${err}`);
      });
  };

  isAccountLinked = async (accountId: string): Promise<boolean> => {
    const account = await this.stripe.accounts.retrieve(accountId).catch((err) => {
      this.logger.error(`Error retrieving account: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/StripeService/isAccountLinked",
        userAgent: "",
        message: "ERROR_RETRIEVING_STRIPE_ACCOUNT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          accountId
        })
      })
      throw new Error(`Error retrieving account: ${err}`);
    });
    return account.details_submitted;
  };

  constructEvent = (request: string, sig: string, endpointSecret: string): Stripe.Event => {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(request, sig, endpointSecret);
    } catch (err: any) {
      this.logger.error(`Error constructing event: ${err}`);
      loggerService.errorLog({
        userId: "",
        url: "/StripeService/constructEvent",
        userAgent: "",
        message: "ERROR_CONSTRUCTING_STRIPE_EVENT",
        stackTrace: `${err.stack}`,
        additionalDetailsJSON: JSON.stringify({
          request,
          sig
        })
      })
      throw new Error(`Error constructing event: ${err}`);
    }
    return event;
  };
}
