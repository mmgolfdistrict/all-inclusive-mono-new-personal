import { type IconCodeType } from "@golf-district/shared";

export type DomainVerificationStatusProps =
  | "Valid Configuration"
  | "Invalid Configuration"
  | "Pending Verification"
  | "Domain Not Found"
  | "Unknown Error";

// From https://vercel.com/docs/rest-api/endpoints#get-a-project-domain
export interface DomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: (307 | 301 | 302 | 308) | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  /** `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed. */
  verified: boolean;
  /** A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain. Possible challenges: - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`. */
  verification: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

// From https://vercel.com/docs/rest-api/endpoints#get-a-domain-s-configuration
export interface DomainConfigResponse {
  /** How we see the domain's configuration. - `CNAME`: Domain has a CNAME pointing to Vercel. - `A`: Domain's A record is resolving to Vercel. - `http`: Domain is resolving to Vercel but may be behind a Proxy. - `null`: Domain is not resolving to Vercel. */
  configuredBy?: ("CNAME" | "A" | "http") | null;
  /** Which challenge types the domain can use for issuing certs. */
  acceptedChallenges?: ("dns-01" | "http-01")[];
  /** Whether or not the domain is configured AND we can automatically generate a TLS certificate. */
  misconfigured: boolean;
}

// From https://vercel.com/docs/rest-api/endpoints#verify-project-domain
export interface DomainVerificationResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: (307 | 301 | 302 | 308) | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  /** `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed. */
  verified: boolean;
  /** A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain. Possible challenges: - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`. */
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

export type SearchObject = {
  soldById: string;
  soldByName: string;
  soldByImage: string;
  availableSlots: number;
  pricePerGolfer: number;
  teeTimeId: string;
  date: string; //day of tee time
  time: number; //military time
  includesCart: boolean;
  firstHandPurchasePrice?: number;
  firstOrSecondHandTeeTime: "FIRST_HAND" | "SECOND_HAND" | "UNLISTED";
  isListed: boolean; //false of the booking is unlisted
  bookingId?: string;
  weather: {
    name: string;
    shortForecast: string;
    temperature: number;
    iconCode: IconCodeType;
  };
  userWatchListed: boolean;
  minimumOfferPrice?: number;
  bookingIds?: string[];
  listingId?: string;
};

export type InviteFriend = {
  id: string;
  handle: string;
  name: string;
  email: string;
  slotId: string;
  bookingId: string;
  currentlyEditing: boolean;
};

export type SensibleDataToMountCompType = {
  partner_id: string;
  product_id: string;
  coverageStartDate: string;
  coverageEndDate: string;
  currency: string;
  langLocale: string;
  exposureName: string;
  exposureLatitude: number;
  exposureLongitude: number;
  exposureTotalCoverageAmount: number;
};
