import { randomUUID } from "crypto";
import Logger from "@golf-district/shared/src/logger";
import type { BookingDetails, BookingResponse, BuyerData, CustomerCreationData, GetCustomerResponse, NameChangeCustomerDetails, ProviderAPI, SalesDataOptions, TeeTimeData, TeeTimeResponse } from "./types/interface";
import { BaseProvider } from "./types/interface";
import type { LightSpeedBookingResponse, LightSpeedReservationRequestResponse, LightspeedBookingCreationData, LightspeedBookingNameChangeOptions, LightspeedCustomerCreationData, LightspeedCustomerCreationResponse, LightspeedGetCustomerResponse, LightspeedSaleDataOptions, LightspeedTeeTimeDataResponse, LightspeedTeeTimeResponse } from "./types/lightspeed.type";
import dayjs from "dayjs";
import { CacheService } from "../../infura/cache.service";
import { db, desc, eq } from "@golf-district/database";
import { providers } from "@golf-district/database/schema/providers";
import { providerAuthTokens } from "@golf-district/database/schema/providerAuthTokens";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import { courses } from "@golf-district/database/schema/courses";
import isEqual from "lodash.isequal";
import { loggerService } from "../../webhooks/logging.service";

// const cacheService = new CacheService(process.env.REDIS_URL!, process.env.REDIS_TOKEN!, Logger("Lightspeed"));

export class Lightspeed extends BaseProvider {
    providerId = "light-speed";
    public providerConfiguration: string;
    logger = Logger(Lightspeed.name);
    cacheService: CacheService | undefined;

    constructor(providerConfiguration: string, cacheService: CacheService) {
        super(
            undefined,
            providerConfiguration,
            cacheService
        );
        this.providerConfiguration = providerConfiguration;
        if (!cacheService) {
            this.cacheService = new CacheService(process.env.REDIS_URL!, process.env.REDIS_TOKEN!, Logger(Lightspeed.name));
        }
        this.cacheService = cacheService;
    }

    async getTeeTimes(
        token: string,
        courseId: string,
        _teesheetId: string | null,
        _startTime: string,
        _endTime: string,
        date: string,
    ): Promise<LightspeedTeeTimeResponse[]> {
        let teeTimes = [] as LightspeedTeeTimeResponse[], fetch = true, page = 1;

        while (fetch) {
            const teeTimesResponse = await this.fetchTeeTimes(courseId, date, this.providerConfiguration, page);
            const filteredTeeTimes = teeTimesResponse.data.filter(teeTime => teeTime.attributes.rates.length > 0);
            teeTimes = [...teeTimes, ...filteredTeeTimes];

            if (teeTimesResponse.meta.page < teeTimesResponse.meta.total_pages) {
                page++;
            } else {
                fetch = false;
            }
        }

        return teeTimes;
    }

    fetchTeeTimes = async (courseId: string, date: string, providerConfiguration: any, page: number) => {
        try {
            const { BASE_ENDPOINT, CONTENT_TYPE, ORGANIZATION_ID } = JSON.parse(providerConfiguration ?? "{}");

            const token = await this.getToken();

            if (!token) {
                throw new Error(`Error fetching tee times fail to get token: ${token}`);
            }

            const url = `${BASE_ENDPOINT}/partner_api/v2/organizations/${ORGANIZATION_ID}/teetimes?custom_params[player_count]=4&custom_params[holes]=18&custom_params[with_pricing]=true&filter[course]=${courseId}&page[size]=100&page[number]=${page}&filter[date]=${date}`;
            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': CONTENT_TYPE,
                'Accept': 'application/vnd.api+json',
            };
            const response = await fetch(url, {
                method: 'GET',
                headers: headers,
            });
            if (!response.ok) {
                if (response.status === 401) {
                    await this.cacheService?.invalidateCache(`provider-${this.providerId}-token`);
                    await this.getToken();
                }
                if (response.status === 403) {
                    this.logger.error(`Error fetching tee time: ${response.statusText}`);
                    loggerService.errorLog({
                        userId: "",
                        url: "/Lightspeed/getTeeTimes",
                        userAgent: "",
                        message: "ERROR_FETCHING_TEE_TIMES",
                        stackTrace: ``,
                        additionalDetailsJSON: JSON.stringify({
                            message: response.statusText,
                            courseId,
                            date
                        })
                    })
                }
                throw new Error(`Error fetching tee times: ${response.statusText}`);
            }
            const teetimesResponse = await response.json() as LightspeedTeeTimeDataResponse;
            return teetimesResponse;
        } catch (error) {
            throw new Error(`Error fetching tee times: ${error}`);
        }
    }

    // ----* starting here we are creating new booking for tee time *-----
    async createBooking(
        token: string,
        _coureId: string,
        _teesheetId: string,
        data: LightspeedBookingCreationData
    ): Promise<LightSpeedBookingResponse> {
        const { BASE_ENDPOINT, CONTENT_TYPE, ORGANIZATION_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        if (!token) {
            token = await this.getToken() ?? "";
            if (!token) {
                throw new Error(`Error creating booking fail to get token: ${token}`);
            }
        }
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': CONTENT_TYPE,
            'Accept': 'application/vnd.api+json',
        };
        console.log("LIGHTSPEED DATA", data);
        const payload = {
            data: {
                type: "reservation_request",
                attributes: {
                    note: data.note,
                    holes: data.holes,
                    cart_count: data.carts
                },
                relationships: {
                    teetime: {
                        data: {
                            type: "teetime",
                            id: data.providerTeeTimeId
                        }
                    }
                }
            }
        }
        // create reservation request
        const reservationRequestUrl = `${BASE_ENDPOINT}/partner_api/v2/organizations/${ORGANIZATION_ID}/reservation_requests`
        const reservationRequestResponse = await fetch(reservationRequestUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!reservationRequestResponse.ok) {
            if (reservationRequestResponse.status === 403) {
                this.logger.error(`Error creating booking: ${reservationRequestResponse.statusText}`);
            }
            console.log("ERROR", await reservationRequestResponse.json());
            loggerService.errorLog({
                userId: "",
                url: "/Lightspeed/createBooking",
                userAgent: "",
                message: "ERROR_CREATING_BOOKING",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    data
                })
            })
            throw new Error(`Error creating booking: ${JSON.stringify(reservationRequestResponse)}`);
        }

        const reservationRequest = (await reservationRequestResponse.json()) as LightSpeedReservationRequestResponse;

        // create round requests based on player count
        for (let i = 0; i < data.playerCount; i++) {
            const roundRequestUrl = `${BASE_ENDPOINT}/partner_api/v2/organizations/${ORGANIZATION_ID}/round_requests`
            const payload: any = {
                data: {
                    type: "round_request",
                    attributes: {
                        green_fee: data.greenFee,
                        cart_fee: data.cartFee,
                    },
                    relationships: {
                        reservation_request: {
                            data: {
                                type: "reservation_request",
                                id: reservationRequest.data.id
                            }
                        },
                    }
                }
            }

            if (i === 0) {
                payload.data.relationships = {
                    ...payload.data.relationships,
                    customer: {
                        data: {
                            type: "customer",
                            id: data.customerId
                        }
                    }
                }
            } else {
                payload.data.attributes = {
                    ...payload.data.attributes,
                    guest: {
                        first_name: "Guest"
                    }
                };
            }

            debugger;
            const roundRequestResponse = await fetch(roundRequestUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(payload),
            });
            if (!roundRequestResponse.ok) {
                if (roundRequestResponse.status === 403) {
                    this.logger.error(`Error creating booking: ${roundRequestResponse.statusText}`);
                }
                console.log("ERROR", await roundRequestResponse.json());
                loggerService.errorLog({
                    userId: "",
                    url: "/Lightspeed/createBooking",
                    userAgent: "",
                    message: "ERROR_CREATING_BOOKING",
                    stackTrace: ``,
                    additionalDetailsJSON: JSON.stringify({
                        data
                    })
                })
                throw new Error(`Error creating booking: ${JSON.stringify(roundRequestResponse)}`);
            }
        }
        // create reservation
        const reservationUrl = `${BASE_ENDPOINT}/partner_api/v2/organizations/${ORGANIZATION_ID}/reservations`

        const reservationResponse = await fetch(reservationUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                data: {
                    type: "reservation",
                    attributes: {},
                    relationships: {
                        reservation_request: {
                            data: {
                                type: "reservation_request",
                                id: reservationRequest.data.id
                            }
                        }
                    }
                }
            }),
        });
        if (!reservationResponse.ok) {
            if (reservationResponse.status === 403) {
                this.logger.error(`Error creating booking: ${reservationResponse.statusText}`);
            }
            console.log("ERROR", await reservationResponse.json());
            loggerService.errorLog({
                userId: "",
                url: "/Lightspeed/createBooking",
                userAgent: "",
                message: "ERROR_CREATING_BOOKING",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    data
                })
            })
            throw new Error(`Error creating booking: ${JSON.stringify(reservationResponse)}`);
        }

        const bookingResponse = (await reservationResponse.json()) as LightSpeedBookingResponse;
        const bookingAmount = data.playerCount * (data.greenFee + data.cartFee);
        // await this.addSalesData(token, bookingResponse.data.relationships.rounds.data, bookingAmount);

        return bookingResponse;
    }

    async getToken(): Promise<string | undefined> {
        try {
            let token = await this.cacheService?.getCache(`provider-${this.providerId}-token`);

            if (!token) {
                const [provider] = await db
                    .select()
                    .from(providers)
                    .where(eq(providers.internalId, this.providerId))
                    .execute();
                if (!provider) {
                    throw new Error("No provider found");
                }
                const { BASE_ENDPOINT, CLIENT_ID, CLIENT_SECRET, CONTENT_TYPE } = JSON.parse(this.providerConfiguration ?? "{}");

                let refreshToken = await this.cacheService?.getCache(`provider-${this.providerId}-refresh-token`);
                if (!refreshToken) {
                    const [providerAuthToken] = await db
                        .select({
                            accessToken: providerAuthTokens.accessToken,
                            refreshToken: providerAuthTokens.refreshToken,
                        })
                        .from(providerAuthTokens)
                        .where(eq(providerAuthTokens.providerId, provider.id))
                        .orderBy(desc(providerAuthTokens.createdDateTime))
                        .limit(1)
                        .execute()

                    if (!providerAuthToken) {
                        throw new Error("No refresh token found");
                    }
                    refreshToken = providerAuthToken.refreshToken;
                }

                const url = `${BASE_ENDPOINT}/oauth/token?client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&refresh_token=${refreshToken}&grant_type=refresh_token&redirect_uri=urn:ietf:wg:oauth:2.0:oob`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': `${CONTENT_TYPE}`,
                    }
                });
                const authResponse = await response.json();
                console.log("TOKEN RESPONSE:", authResponse);
                if (!response.ok) {
                    throw new Error(`Error fetching token: ${response.statusText}`);
                }

                token = authResponse.access_token;
                await db
                    .insert(providerAuthTokens)
                    .values({
                        id: randomUUID(),
                        providerId: provider.id,
                        accessToken: authResponse.access_token,
                        refreshToken: authResponse.refresh_token,
                    })
                    .execute();

                await this.cacheService?.setCache(`provider-${this.providerId}-refresh-token`, authResponse.refresh_token, 86400);
                await this.cacheService?.setCache(`provider-${this.providerId}-token`, authResponse.access_token, 7200);
            }

            return token as string;
        } catch (error) {
            console.error(error);
        }
    }

    private getHeaders(token: string) {
        const { CONTENT_TYPE, CLIENT_ID, CLIENT_SECRET, X_Component_Id, X_Module_Id } = JSON.parse(
            this.providerConfiguration ?? "{}"
        );
        return {
            "Content-Type": CONTENT_TYPE,
            Authorization: `bearer ${token}`,
            "client-secret": CLIENT_SECRET,
            "client-id": CLIENT_ID,
            "X-componentid": X_Component_Id,
            "x-moduleId": X_Module_Id
        };
    }

    private getBasePoint(): string {
        const { BASE_ENDPOINT } = JSON.parse(this.providerConfiguration ?? "{}");

        switch (process.env.NODE_ENV) {
            case "development":
                return BASE_ENDPOINT;
            case "production":
                return BASE_ENDPOINT;
            default:
                return BASE_ENDPOINT;
        }
    }

    async deleteBooking(
        token: string,
        _courseId: string,
        _teesheetId: string,
        bookingId: string
    ): Promise<void> {
        const { BASE_ENDPOINT, CONTENT_TYPE } = JSON.parse(this.providerConfiguration ?? "{}");
        if (!token) {
            token = await this.getToken() ?? "";
            if (!token) {
                throw new Error(`Error creating booking fail to get token: ${token}`);
            }
        }
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': CONTENT_TYPE,
            'Accept': 'application/vnd.api+json',
        };
        const url = `${BASE_ENDPOINT}/partner_api/v2/reservations/${bookingId}`;

        console.log(`deleteBooking - ${url}`);

        const response = await fetch(url, {
            method: "DELETE",
            headers: headers,
        });

        if (!response.ok) {
            this.logger.error(`Error deleting booking: ${response.statusText}`);
            this.logger.error(`Error response from light-speed: ${JSON.stringify(await response.json())}`);
            if (response.status === 403) {
                await this.getToken();
            }
            loggerService.errorLog({
                userId: "",
                url: "/Lightspeed/deleteBooking",
                userAgent: "",
                message: "ERROR_DELETING_BOOKING",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    bookingId,
                })
            })
            throw new Error(`Error deleting booking: ${response.statusText}`);
        }
        this.logger.info(`Booking deleted successfully: ${bookingId}`);
    }

    async createCustomer(
        token: string,
        _courseId: string,
        customerData: CustomerCreationData
    ): Promise<LightspeedCustomerCreationResponse> {
        customerData = customerData as LightspeedCustomerCreationData;
        //Create Customer
        const { BASE_ENDPOINT, CONTENT_TYPE, ORGANIZATION_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        if (!token) {
            token = await this.getToken() ?? "";
            if (!token) {
                throw new Error(`Error creating booking fail to get token: ${token}`);
            }
        }
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': CONTENT_TYPE,
            'Accept': 'application/vnd.api+json',
        };

        const url = `${BASE_ENDPOINT}/partner_api/v2/organizations/${ORGANIZATION_ID}/customers`;

        console.log(`createCustomer - ${url}`, customerData);

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                data: {
                    type: "customer",
                    attributes: {
                        first_name: customerData.firstName ? customerData.firstName : "Guest",
                        last_name: customerData.lastName ? customerData.lastName : "N/A",
                        email: customerData.email,
                        phone: customerData.phone,
                    },
                }
            }),
        });

        if (!response.ok) {
            this.logger.error(`Error creating customer: ${response.statusText}`);
            if (response.status === 403) {
                this.logger.error(`Error response from foreup: ${JSON.stringify(await response.json())}`);
            }
            loggerService.errorLog({
                userId: "",
                url: "/Lightspeed/createCustomer",
                userAgent: "",
                message: "ERROR_CREATING_CUSTOMER",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    customerData
                })
            })
            throw new Error(`Error creating customer: ${response.statusText}`);
        }

        const data = (await response.json()) as LightspeedCustomerCreationResponse;
        return data;
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async getSlotIdsForBooking(
        bookingId: string,
        slots: number,
        customerId: string,
        providerBookingId: string | string[],
        _providerId: string,
        _courseId: string,
        providerSlotIds?: string[],
    ) {
        const bookingSlots: {
            id: string;
            bookingId: string;
            slotnumber: string;
            name: string;
            customerId: string;
            isActive: boolean;
            slotPosition: number;
            lastUpdatedDateTime: string | null;
            createdDateTime: string | null;
        }[] = [];

        for (let i = 0; i < slots; i++) {
            bookingSlots.push({
                id: randomUUID(),
                bookingId: bookingId,
                slotnumber: providerSlotIds ? providerSlotIds[i] ?? "" : providerBookingId + "-" + (i + 1),
                name: i === 0 ? "" : "Guest",
                customerId: i === 0 ? customerId : "",
                isActive: true,
                slotPosition: i + 1,
                lastUpdatedDateTime: null,
                createdDateTime: null,
            });
        }
        return bookingSlots;
    }

    addSalesData = async (
        options: SalesDataOptions
    ): Promise<void> => {
        options = options as LightspeedSaleDataOptions;
        let { token } = options;
        const { roundIds, amount } = options;
        try {
            if (roundIds.length <= 0) {
                return;
            }
            const { BASE_ENDPOINT, CONTENT_TYPE, ORGANIZATION_ID } = JSON.parse(this.providerConfiguration ?? "{}");
            if (!token) {
                token = await this.getToken() ?? "";
                if (!token) {
                    throw new Error(`Error creating booking fail to get token: ${token}`);
                }
            }
            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': CONTENT_TYPE,
                'Accept': 'application/vnd.api+json',
            };
            const payload = {
                data: {
                    type: "payment_confirmation",
                    attributes: {
                        amount: amount
                    },
                    relationships: {
                        rounds: {
                            data: roundIds
                        }
                    }
                }
            }
            const url = `${BASE_ENDPOINT}/partner_api/v2/organizations/${ORGANIZATION_ID}/payment_confirmations`;

            const response = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                this.logger.error(`Error adding sales data: ${response.statusText}`);
                if (response.status === 403) {
                    this.logger.error(`Error response from foreup: ${JSON.stringify(await response.json())}`);
                }
                loggerService.errorLog({
                    userId: "",
                    url: "/Lightspeed/addSalesData",
                    userAgent: "",
                    message: "ERROR_ADDING_SALES_DATA",
                    stackTrace: ``,
                    additionalDetailsJSON: JSON.stringify({
                        options
                    })
                })
                throw new Error(`Error adding sales data: ${response.statusText}`);
            }

            const salesResponse = await response.json();

            this.logger.info(
                `Sales data added successfully for booking with ids: ${roundIds}, cart data: ${JSON.stringify(
                    salesResponse
                )}`
            );
        } catch (error) {
            this.logger.error(`Error adding sales data: ${error}`);
            loggerService.errorLog({
                userId: "",
                url: "/Lightspeed/addSalesData",
                userAgent: "",
                message: "ERROR_ADDING_SALES_DATA",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    options
                })
            })
        }
    };

    async updateTeeTime(
        token: string,
        _courseId: string,
        _teesheetId: string,
        bookingId: string,
        options?: {
            firstName: string,
            lastName: string
        },
        slotId?: string
    ): Promise<LightSpeedBookingResponse> {
        const { BASE_ENDPOINT, CONTENT_TYPE, ORGANIZATION_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        if (!token) {
            token = await this.getToken() ?? "";
            if (!token) {
                throw new Error(`Error creating booking fail to get token: ${token}`);
            }
        }
        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': CONTENT_TYPE,
            'Accept': 'application/vnd.api+json',
        };
        const payload = {
            data: {
                attributes: {
                    type: "reservation",
                    guest: {
                        first_name: options?.firstName ?? "",
                        last_name: options?.lastName ?? ""
                    }
                }
            }
        }

        const url = `${BASE_ENDPOINT}/partner_api/v2/organizations/${ORGANIZATION_ID}/reservations/${bookingId}/rounds/${slotId}`;

        const response = await fetch(url, {
            method: 'put',
            headers: headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            this.logger.error(`Error updating customer on booking: ${response.statusText}`);
            this.logger.error(`Error response from light-speed: ${JSON.stringify(await response.json())}`);
            if (response.status === 403) {
                await this.getToken();
            }
            loggerService.errorLog({
                userId: "",
                url: "/Lightspeed/updateTeeTime",
                userAgent: "",
                message: "ERROR_UPDATING_CUSTOMER_ON_BOOKING",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    token,
                    bookingId,
                    options
                })
            })
            throw new Error(`Error updating customer on booking: ${response.statusText}`);
        }

        const data = await response.json();
        this.logger.info(`Updated customer on booking successfully: ${JSON.stringify(data)}`);
        return data as LightSpeedBookingResponse;
    }

    async getCustomer(token: string, courseId: string, email: string): Promise<LightspeedGetCustomerResponse | undefined> {
        const { BASE_ENDPOINT, CONTENT_TYPE, ORGANIZATION_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        if (!token) {
            token = await this.getToken() ?? "";
            if (!token) {
                throw new Error(`Error creating booking fail to get token: ${token}`);
            }
        }
        const url = `${BASE_ENDPOINT}/partner_api/v2/organizations/${ORGANIZATION_ID}/customers?filter[email]=${email}`;

        const headers = {
            Authorization: `Bearer ${token}`,
            'Content-Type': CONTENT_TYPE,
            'Accept': 'application/vnd.api+json',
        };

        console.log(`getCustomer - ${url}`);

        const response = await fetch(url, {
            method: "GET",
            headers: headers,
        });

        if (!response.ok) {
            this.logger.error(`Error fetching customer: ${response.statusText}`);
            this.logger.error(`Error response from light-speed: ${JSON.stringify(await response.json())}`);
            loggerService.errorLog({
                userId: "",
                url: "/Lightspeed/getCustomer",
                userAgent: "",
                message: "ERROR_FETCHING_CUSTOMER",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    token,
                    courseId,
                    email
                })
            })
            throw new Error(`Error fetching customer: ${response.statusText}`);
        }

        const customers = await response.json();

        if (customers.data.length === 0) {
            return undefined
        }

        const customer = customers.data[0];

        return customer as LightspeedGetCustomerResponse;
    }

    shouldAddSaleData(): boolean {
        return true;
    }

    getSalesDataOptions(reservationData: BookingResponse, bookingDetails: BookingDetails): LightspeedSaleDataOptions {
        const data = reservationData as LightSpeedBookingResponse;
        const salesDataOptions: LightspeedSaleDataOptions = {
            token: bookingDetails.token,
            roundIds: data.data.relationships.rounds.data,
            amount: bookingDetails.totalAmountPaid
        }
        return salesDataOptions
    }

    supportsPlayerNameChange(): boolean {
        return true;
    }

    getCustomerCreationData(buyerData: BuyerData): LightspeedCustomerCreationData {
        const [firstName, lastName] = buyerData.name ? buyerData.name.split(' ') : ['', ''];
        const data = {
            firstName,
            lastName,
            email: buyerData.email,
            phone: buyerData.phone,
        } as LightspeedCustomerCreationData;
        return data;
    }

    getCustomerId(customerData: LightspeedCustomerCreationResponse): string {
        return customerData.data.id;
    }

    getBookingCreationData(teeTimeData: TeeTimeData): LightspeedBookingCreationData {
        const data: LightspeedBookingCreationData = {
            customerId: teeTimeData.providerCustomerId ?? "",
            carts: teeTimeData.playerCount,
            holes: Number(teeTimeData.holes),
            playerCount: teeTimeData.playerCount,
            teeTimeId: teeTimeData.teeTimeId,
            cartFee: teeTimeData.cartFees,
            greenFee: teeTimeData.greenFees,
            note: teeTimeData.notes ?? "",
            providerTeeTimeId: teeTimeData.providerTeeTimeId,
        }
        return data;
    }

    getBookingId(bookingData: LightSpeedBookingResponse): string {
        return bookingData.data.id;
    }

    getSlotIdsFromBooking(bookingData: LightSpeedBookingResponse): string[] {
        const slotIds = bookingData.data.relationships.rounds.data.map((round) => round.id);
        return slotIds;
    }

    getAvailableSpotsOnTeeTime(teeTimeData: LightspeedTeeTimeResponse): number {
        return teeTimeData.attributes.free_slots;
    }

    indexTeeTime = async (
        formattedDate: string,
        providerCourseId: string,
        providerTeeSheetId: string,
        provider: ProviderAPI,
        token: string,
        time: number,
        teeTimeId: string
    ) => {
        try {
            const teeTimeResponse = await provider.getTeeTimes(
                token,
                providerCourseId,
                providerTeeSheetId,
                time.toString().padStart(4, "0"),
                (time + 1).toString().padStart(4, "0"),
                formattedDate
            ) as LightspeedTeeTimeResponse[]

            const [indexedTeeTime] = await db
                .select({
                    id: teeTimes.id,
                    courseId: teeTimes.courseId,
                    availableFirstHandSpots: teeTimes.availableFirstHandSpots,
                    availableSecondHandSpots: teeTimes.availableSecondHandSpots,
                    entityId: courses.entityId,
                    providerTeeTimeId: teeTimes.providerTeeTimeId,
                })
                .from(teeTimes)
                .leftJoin(courses, eq(courses.id, teeTimes.courseId))
                .where(eq(teeTimes.id, teeTimeId))
                .execute()
                .catch((err) => {
                    this.logger.error(err);
                    loggerService.errorLog({
                        userId: "",
                        url: "/Lightspeed/indexTeeTime",
                        userAgent: "",
                        message: "ERROR_INDEXING_TEE_TIME",
                        stackTrace: `${err.stack}`,
                        additionalDetailsJSON: JSON.stringify({
                            formattedDate,
                            providerCourseId,
                            providerTeeSheetId,
                            provider,
                            token,
                            time,
                            teeTimeId
                        })
                    })
                    throw new Error(`Error finding tee time id`);
                });

            const teeTime = teeTimeResponse.find(teetime => teetime.id === indexedTeeTime?.providerTeeTimeId);

            if (indexedTeeTime && teeTime) {
                const hours = Number(teeTime.attributes.start_time.split(':')?.[0]);
                const minutes = Number(teeTime.attributes.start_time?.split(':')?.[1]);
                const militaryTime = hours * 100 + minutes;
                const formattedDatetime = dayjs(`${teeTime.attributes.date} ${teeTime.attributes.start_time}`).utc().format('YYYY-MM-DD HH:mm:ss.SSS');
                const formattedProviderDate = dayjs(`${teeTime.attributes.date} ${teeTime.attributes.start_time}`).format('YYYY-MM-DDTHH:mm:ss.SSS');

                const providerTeeTime = {
                    id: indexedTeeTime.id,
                    courseId: indexedTeeTime.courseId,
                    providerTeeTimeId: String(teeTime.id),
                    numberOfHoles: teeTime.attributes.hole ? 18 : 9,
                    date: formattedDatetime,
                    time: militaryTime,
                    maxPlayersPerBooking: teeTime.attributes.free_slots,
                    availableFirstHandSpots: teeTime.attributes.free_slots,
                    availableSecondHandSpots: 0,
                    greenFeePerPlayer:
                        (teeTime.attributes.rates[0]?.green_fee ?? 0) * 100,
                    cartFeePerPlayer:
                        (teeTime.attributes.rates[0]?.one_person_cart ?? 0) * 100,
                    greenFeeTaxPerPlayer: 0,
                    cartFeeTaxPerPlayer: 0,
                    providerDate: formattedProviderDate,
                };

                const providerTeeTimeMatchingKeys = {
                    id: indexedTeeTime.id,
                    providerTeeTimeId: indexedTeeTime.providerTeeTimeId,
                    numberOfHoles: teeTime.attributes.hole ? 18 : 9,
                    date: formattedDatetime,
                    time: militaryTime,
                    maxPlayersPerBooking: teeTime.attributes.free_slots,
                    greenFeePerPlayer: (teeTime.attributes.rates[0]?.green_fee ?? 0) * 100,
                    cartFeePerPlayer: (teeTime.attributes.rates[0]?.one_person_cart ?? 0) * 100,
                    greenFeeTaxPerPlayer: 0,
                    cartFeeTaxPerPlayer: 0,
                    courseId: indexedTeeTime.courseId,
                    availableFirstHandSpots: indexedTeeTime.availableFirstHandSpots,
                    availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
                    providerDate: formattedProviderDate,
                };
                console.log("providerTeeTimeMatchingKeys", providerTeeTimeMatchingKeys);
                if (isEqual(indexedTeeTime, providerTeeTimeMatchingKeys)) {
                    // no changes to tee time do nothing
                    return;
                } else {
                    await db
                        .update(teeTimes)
                        .set(providerTeeTime)
                        .where(eq(teeTimes.id, indexedTeeTime.id))
                        .execute()
                        .catch((err) => {
                            this.logger.error(err);
                            loggerService.errorLog({
                                userId: "",
                                url: "/Lightspeed/updateTeeTime",
                                userAgent: "",
                                message: "ERROR_UPDATING_TEE_TIME",
                                stackTrace: `${err.stack}`,
                                additionalDetailsJSON: JSON.stringify({
                                    formattedDate,
                                    providerCourseId,
                                    providerTeeSheetId,
                                    provider,
                                    token,
                                    time,
                                    teeTimeId
                                })
                            })
                            throw new Error(`Error updating tee time: ${err}`);
                        });
                }
            }
        } catch (error: any) {
            this.logger.error(error);
            loggerService.errorLog({
                userId: "",
                url: "/Lightspeed/indexTeeTime",
                userAgent: "",
                message: "ERROR_INDEXING_TEE_TIME",
                stackTrace: `${error.stack}`,
                additionalDetailsJSON: JSON.stringify({
                    formattedDate,
                    providerCourseId,
                    providerTeeSheetId,
                    provider,
                    token,
                    time,
                    teeTimeId
                })
            })
            // throw new Error(`Error indexing tee time: ${error}`);
            // throw new Error(
            //   `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`
            // );
            return {
                error: true,
                message: `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`
            }
        }
    };

    getPlayerCount(bookingData: BookingResponse): number {
        bookingData = bookingData as LightSpeedBookingResponse;
        return bookingData.data.playerCount!;
    }

    findTeeTimeById(teeTimeId: string, teetimes: TeeTimeResponse[]): LightspeedTeeTimeResponse | undefined {
        const teeTimes = teetimes as LightspeedTeeTimeResponse[];
        const teeTime = teeTimes.find((teeTime) => teeTime.id.toString() === teeTimeId);

        return teeTime;
    }

    getBookingNameChangeOptions(customerDetails: NameChangeCustomerDetails): LightspeedBookingNameChangeOptions {
        const [firstName, lastName] = customerDetails.name ? customerDetails.name.split(" ") : ["", ""];

        const bookingNameChangeOptions: LightspeedBookingNameChangeOptions = {
            firstName: firstName ? firstName : "Guesst",
            lastName: lastName ? lastName : "N/A",
        };
        return bookingNameChangeOptions;
    }

    getCustomerIdFromGetCustomerResponse(getCustomerResponse: GetCustomerResponse): { customerId: string, accountNumber?: number } {
        const customer = getCustomerResponse as LightspeedGetCustomerResponse;

        return { customerId: customer.id.toString() }
    }
}