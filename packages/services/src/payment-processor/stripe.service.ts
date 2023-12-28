// /* eslint no-use-before-define: 0 */
// import { validDomainRegex } from "@golf-district/shared";
// import Logger from "@golf-district/shared/src/logger";
// import type pino from "pino";
// import Stripe from "stripe";
// import { ProductData } from "../checkout/types";

// export class StripeService {
//   protected stripe: Stripe;
//   protected logger: pino.Logger;
//   constructor(apiKey: string, logger?: pino.Logger) {
//     this.logger = logger ? logger : Logger(StripeService.name);
//     this.stripe = new Stripe(apiKey, {
//       apiVersion: "2023-08-16",
//     });
//   }
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
//   createStandardStripeAccount = async (params: any): Promise<Stripe.Response<Stripe.Account>> =>
//     this.stripe.accounts
//       .create({
//         type: "standard",
//         country: "US",
//         email: params.email,
//         individual: {
//           first_name: params.firstName,
//           last_name: params.lastName,
//           email: params.email,
//           phone: params.phone,
//         },
//         capabilities: {
//           acss_debit_payments: {
//             requested: true,
//           },
//           card_payments: {
//             requested: true,
//           },
//           bank_transfer_payments: {
//             requested: true,
//           },
//         },
//       })
//       .catch((err) => {
//         this.logger.error(`Error creating stripe account: ${err}`);
//         throw new Error(`Error creating stripe account: ${err}`);
//       });

//   /**
//    * @notice - This function returns an account link the user is redirected to connect their account
//    * @param accountId - The id of the account to create a link for
//    * @param refreshUrl - The url the user is redirected to if they refresh the page
//    * @param returnUrl - The url the user is redirected to after they connect their account
//    * @returns - A promise that resolves to the account link
//    * @throws - Will throw an error if the account link creation fails
//    * @dev - This function is used to create an account link for a user to connect their stripe account
//    */
//   createAccountLink = async (
//     accountId: string,
//     refreshUrl: string,
//     returnUrl: string
//   ): Promise<Stripe.Response<Stripe.AccountLink>> => {
//     if (!validDomainRegex().test(refreshUrl)) {
//       this.logger.error(`Error creating stripe account link: refreshUrl ${refreshUrl} is not a valid domain`);
//       throw new Error(`Error creating stripe account link: refreshUrl ${refreshUrl} is not a valid domain`);
//     }
//     if (!validDomainRegex().test(returnUrl)) {
//       this.logger.error(`Error creating stripe account link: returnUrl ${returnUrl} is not a valid domain`);
//       throw new Error(`Error creating stripe account link: returnUrl ${returnUrl} is not a valid domain`);
//     }
//     return await this.stripe.accountLinks
//       .create({
//         account: accountId,
//         refresh_url: refreshUrl,
//         return_url: returnUrl,
//         type: "account_onboarding",
//       })
//       .catch((err) => {
//         this.logger.error(`Error creating stripe account link: ${err}`);
//         throw new Error(`Error creating stripe account link: ${err}`);
//       });
//   };

//   isAccountLinked = async (accountId: string): Promise<boolean> => {
//     const account = await this.stripe.accounts.retrieve(accountId).catch((err) => {
//       this.logger.error(`Error retrieving account: ${err}`);
//       throw new Error(`Error retrieving account: ${err}`);
//     });
//     return account.details_submitted;
//   };
// }
