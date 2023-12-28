import Logger from "@golf-district/shared/src/logger";
import type pino from "pino";
import type {
  DomainConfigResponse,
  DomainResponse,
  DomainVerificationResponse,
  DomainVerificationStatusProps,
} from "./types";

/**
 * Service class for handling domain-related operations.
 */
export class DomainService {
  protected logger: pino.Logger;

  /**
   * Constructs a new `DomainService` instance.
   *
   * @constructor
   * @param {string} PROJECT_ID_VERCEL - The Vercel project ID.
   * @param {string} TEAM_ID_VERCEL - The Vercel team ID.
   * @param {string} AUTH_BEARER_TOKEN - The authentication bearer token.
   * @param {pino.Logger} [logger] - Optional logger instance. If not provided, a default logger will be created.
   */
  constructor(
    private readonly PROJECT_ID_VERCEL: string,
    private readonly TEAM_ID_VERCEL: string,
    private readonly AUTH_BEARER_TOKEN: string,
    logger?: pino.Logger
  ) {
    this.logger = logger ? logger : Logger(DomainService.name);
  }

  /**
   * Verifies the configuration and status of a domain.
   *
   * This function verifies and returns the configuration status of a given domain.
   *
   * @param {string} domain - The domain to verify.
   * @returns {Promise<{ status: DomainVerificationStatusProps; domainJson: DomainResponse }>} A promise resolving to an object containing the verification status and domain information.
   * @throws Will throw an error if there is an issue verifying the domain.
   * @example
   * // Verify the configuration status of the domain 'example.com'.
   * const verificationResult = await verify('example.com');
   * console.log(verificationResult);
   */
  verify = async (domain: string) => {
    let status: DomainVerificationStatusProps = "Valid Configuration";
    const [domainJson, configResponse] = await Promise.all([
      this.getDomainResponse(domain),
      this.getConfigResponse(domain),
    ]);
    if (domainJson?.error?.code == "not_found") {
      this.logger.debug(`Domain ${domain} not found`);
      status = "Domain Not Found";
    } else if (domainJson.error) {
      this.logger.debug(`Domain ${domain} error: ${domainJson.error.message}`);
      status = "Unknown Error";
    } else if (!domainJson.verified) {
      this.logger.debug(`Domain ${domain} not verified`);
      status = "Pending Verification";
      const verificationJson = await this.verifyDomain(domain);
      if (verificationJson && verificationJson.verified) {
        this.logger.debug(`Domain ${domain} verified`);
        status = "Valid Configuration";
      }
    } else if (configResponse.misconfigured) {
      this.logger.debug(`Domain ${domain} misconfigured`);
      status = "Invalid Configuration";
    } else {
      this.logger.debug(`Domain ${domain} valid configuration`);
      status = "Valid Configuration";
    }
    return {
      status,
      domainJson,
    };
  };

  /**
   * Adds a domain to the Vercel project.
   *
   * This function adds a new domain to the associated Vercel project.
   *
   * @param {string} domain - The domain to add.
   * @returns {Promise<any>} A promise resolving to the response from the Vercel API.
   * @throws Will throw an error if there is an issue adding the domain.
   * @example
   * // Add the domain 'example.com' to the Vercel project.
   * const result = await addDomainToVercel('example.com');
   * console.log(result);
   */
  addDomainToVercel = async (domain: string) => {
    this.logger.info(`addDomainToVercel called with domain: ${domain}`);
    return await fetch(
      `https://api.vercel.com/v9/projects/${this.PROJECT_ID_VERCEL}/domains?teamId=${this.TEAM_ID_VERCEL}`,
      {
        body: `{\n  "name": "${domain}"\n}`,
        headers: {
          Authorization: `Bearer ${this.AUTH_BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
        method: "POST",
      }
    ).then((res) => res.json());
  };

  /**
   * Removes a domain from the Vercel project.
   *
   * This function removes an existing domain from the associated Vercel project.
   *
   * @param {string} domain - The domain to remove.
   * @returns {Promise<any>} A promise resolving to the response from the Vercel API.
   * @throws Will throw an error if there is an issue removing the domain from the project.
   * @example
   * // Remove the domain 'example.com' from the Vercel project.
   * const result = await removeDomainFromVercelProject('example.com');
   * console.log(result);
   */
  removeDomainFromVercelProject = async (domain: string) => {
    this.logger.info(`removeDomainFromVercelProject called with domain: ${domain}`);
    return await fetch(
      `https://api.vercel.com/v9/projects/${this.PROJECT_ID_VERCEL}/domains/${domain}?teamId=${this.TEAM_ID_VERCEL}`,
      {
        headers: {
          Authorization: `Bearer ${this.AUTH_BEARER_TOKEN}`,
        },
        method: "DELETE",
      }
    ).then((res) => res.json());
  };

  /**
   * Removes a domain from the Vercel team.
   *
   * This function removes an existing domain from the associated Vercel team.
   *
   * @param {string} domain - The domain to remove.
   * @returns {Promise<any>} A promise resolving to the response from the Vercel API.
   * @throws Will throw an error if there is an issue removing the domain from the team.
   * @example
   * // Remove the domain 'example.com' from the Vercel team.
   * const result = await removeDomainFromVercelTeam('example.com');
   * console.log(result);
   */
  removeDomainFromVercelTeam = async (domain: string) => {
    this.logger.info(`removeDomainFromVercelTeam called with domain: ${domain}`);
    return await fetch(`https://api.vercel.com/v6/domains/${domain}?teamId=${this.TEAM_ID_VERCEL}`, {
      headers: {
        Authorization: `Bearer ${this.AUTH_BEARER_TOKEN}`,
      },
      method: "DELETE",
    }).then((res) => res.json());
  };

  /**
   * Fetches and returns information about a specific domain.
   *
   * @private
   * @param {string} domain - The domain to retrieve information for.
   * @returns {Promise<DomainResponse & { error: { code: string; message: string } }>} A promise resolving to domain information or an error.
   * @throws Will throw an error if there is an issue fetching domain information.
   * @example
   * // Get information for the domain 'example.com'.
   * const domainInfo = await getDomainResponse('example.com');
   * console.log(domainInfo);
   */
  private getDomainResponse = async (
    domain: string
  ): Promise<DomainResponse & { error: { code: string; message: string } }> => {
    this.logger.info(`getDomainResponse called with domain: ${domain}`);
    return await fetch(
      `https://api.vercel.com/v9/projects/${this.PROJECT_ID_VERCEL}/domains/${domain}?teamId=${this.TEAM_ID_VERCEL}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.AUTH_BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    ).then((res) => {
      return res.json();
    });
  };

  /**
   * Fetches and returns the configuration response for a specific domain.
   *
   * @private
   * @param {string} domain - The domain to retrieve configuration for.
   * @returns {Promise<DomainConfigResponse>} A promise resolving to the configuration response for the domain.
   * @throws Will throw an error if there is an issue fetching domain configuration.
   * @example
   * // Get configuration response for the domain 'example.com'.
   * const configResponse = await getConfigResponse('example.com');
   * console.log(configResponse);
   */
  getConfigResponse = async (domain: string): Promise<DomainConfigResponse> => {
    this.logger.info(`getConfigResponse called with domain: ${domain}`);
    return await fetch(`https://api.vercel.com/v6/domains/${domain}/config?teamId=${this.TEAM_ID_VERCEL}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.AUTH_BEARER_TOKEN}`,
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
  };

  /**
   * Verifies the configuration status of a specific domain.
   *
   * @private
   * @param {string} domain - The domain to verify.
   * @returns {Promise<DomainVerificationResponse>} A promise resolving to the verification response for the domain.
   * @throws Will throw an error if there is an issue verifying the domain.
   * @example
   * // Verify the configuration status of the domain 'example.com'.
   * const verificationResult = await verifyDomain('example.com');
   * console.log(verificationResult);
   */
  private verifyDomain = async (domain: string): Promise<DomainVerificationResponse> => {
    this.logger.info(`verifyDomain called with domain: ${domain}`);
    return await fetch(
      `https://api.vercel.com/v9/projects/${this.PROJECT_ID_VERCEL}/domains/${domain}/verify?teamId=${this.TEAM_ID_VERCEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.AUTH_BEARER_TOKEN}`,
          "Content-Type": "application/json",
        },
      }
    ).then((res) => res.json());
  };
}
