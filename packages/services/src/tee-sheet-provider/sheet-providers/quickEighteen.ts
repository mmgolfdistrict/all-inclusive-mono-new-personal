import { randomUUID } from "crypto";
import { db, eq } from "@golf-district/database";
import { courses } from "@golf-district/database/schema/courses";
import { teeTimes } from "@golf-district/database/schema/teeTimes";
import Logger from "@golf-district/shared/src/logger";
import isEqual from "lodash.isequal";
import type { CacheService } from "../../infura/cache.service";
import { loggerService } from "../../webhooks/logging.service";
import type { TeeTimeUpdateRequest } from "./types/foreup.type";
import type {
    BookingNameChangeOptions,
    BookingResponse,
    BuyerData,
    CustomerCreationData,
    CustomerData,
    FetchCustomerDetails,
    GetCustomerResponse,
    NameChangeCustomerDetails,
    ProviderAPI,
    SalesDataOptions,
    TeeTimeData,
    TeeTimeResponse,
} from "./types/interface";
import { BaseProvider } from "./types/interface";
import type {
    QuickEighteenBookingCreationData,
    QuickEighteenTeeTimesData,
    QuickEighteenCustomerCreationData,
    QuickEighteenGetCustomerResponse,
    QuickEighteenBookingResponse,
    QuickEighteenTeeTimeResponse
} from "./types/quickEighteen.types";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export class QuickEighteen extends BaseProvider {
    providerId = "quick-18";
    public providerConfiguration: string;
    logger = Logger(QuickEighteen.name);
    cacheService: CacheService | undefined;

    constructor(providerConfiguration: string) {
        super(undefined, providerConfiguration, undefined);
        this.providerConfiguration = providerConfiguration;
    }

    async getTeeTimes(
        token: string,
        courseId: string,
        _teesheetId: string | null,
        _startTime: string,
        _endTime: string,
        date: string
    ): Promise<TeeTimeResponse[]> {
        const baseEndpoint = this.getBasePoint();
        const { PRICE_GROUP, FACILITY_ID } = JSON.parse(this.providerConfiguration ?? "{}");

        const url = `${baseEndpoint}/facility/${FACILITY_ID}/teetime?teedate=${date}&pricegroup=${PRICE_GROUP}&courseid=${courseId}`;
        this.logger.info(`getTeeTimes - ${url}`);
        const headers = this.getHeaders(token);
        const response = await fetch(url, {
            method: 'GET',
            headers: headers,
        });
        if (!response.ok) {
            if (response.status === 403) {
                this.logger.error(`Error fetching tee time: ${response.statusText}`);
            }

            throw new Error(`Error fetching tee times: ${response.statusText}`);
        }
        const responseData = await response.json() as QuickEighteenTeeTimesData;
        return responseData.Times;
    }

    // ----* starting here we are creating new booking for tee time *-----
    async createBooking(
        token: string,
        _coureId: string,
        _teesheetId: string,
        data: QuickEighteenBookingCreationData,
        userId: string
    ): Promise<BookingResponse> {
        const { FACILITY_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        const endpoint = this.getBasePoint();
        const url = `${endpoint}/facility/${FACILITY_ID}/reservation`;

        const headers = this.getHeaders(token);

        this.logger.info(`createBooking - ${url}`);
        this.logger.info(`payload - ${JSON.stringify(data)}`);

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            this.logger.error(`Error creating booking: ${response.statusText}`);
            const responseData = await response.json();
            if (response.status === 403) {
                this.logger.error(`Error creating booking: ${JSON.stringify(responseData)}`);
                await this.getToken();
            }
            void loggerService.errorLog({
                userId,
                url: "/QuickEighteen/createBooking",
                userAgent: "",
                message: "ERROR_CREATING_BOOKING",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    data,
                }),
            });
            throw new Error(`Error creating booking: ${JSON.stringify(responseData)}`);
        }

        const bookingResponse = await response.json();

        return bookingResponse as BookingResponse;
    }

    async getToken(): Promise<string> {
        const { USERNAME, PASSWORD } = JSON.parse(this.providerConfiguration);
        const token = btoa(`${USERNAME}:${PASSWORD}`);

        return token;
    }

    private getHeaders(token: string) {
        return {
            Authorization: `Basic ${token}`,
            'Content-Type': 'application/json',
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
        const { FACILITY_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        const endpoint = this.getBasePoint();
        const url = `${endpoint}/facility/${FACILITY_ID}/reservation/${bookingId}`;
        const headers = this.getHeaders(token);

        this.logger.info(`deleteBooking - ${url}`);

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify({
                Status: "Cancelled"
            }),
        });

        const isError = !response.ok;
        const data = await response.json();

        if (isError || data === false) {
            this.logger.error(`Error deleting booking: ${response.statusText}`);
            this.logger.error(`Error response from quick-eighteen: ${JSON.stringify(data)}`);

            const url = `${endpoint}/facility/${FACILITY_ID}/reservation/${bookingId}`;
            const bookingResponse = await fetch(url, {
                method: "GET",
                headers: headers,
            });
            const reservation = await bookingResponse.json();

            this.logger.info(`Reservation: ${JSON.stringify(reservation)}`);
            void loggerService.errorLog({
                userId: "",
                url: "/QuickEighteen/deleteBooking",
                userAgent: "",
                message: "ERROR_DELETING_BOOKING",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    bookingId: bookingId,
                    isError,
                    data,
                    reservation,
                }),
            });

            if (response.status === 403) {
                await this.getToken();
            }
            throw new Error(`Error deleting booking: ${JSON.stringify(reservation)}`);
        }
        this.logger.info(`Booking deleted successfully: ${bookingId}`);
    }

    async createCustomer(
        token: string,
        _courseId: string,
        customerData: CustomerCreationData
    ): Promise<CustomerData> {
        customerData = customerData as QuickEighteenCustomerCreationData;
        const { FACILITY_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        //Create Customer
        const endpoint = this.getBasePoint();
        const url = `${endpoint}/facility/${FACILITY_ID}/customer?type=BaseCustomer`;

        this.logger.info(`createCustomer - ${url}`);
        this.logger.info(`createCustomerData - ${JSON.stringify(customerData)}`);

        const response = await fetch(url, {
            method: "POST",
            headers: this.getHeaders(token),
            body: JSON.stringify(customerData),
        });

        if (!response.ok) {
            this.logger.error(`Error creating customer: ${response.statusText}`);
            const responseData = await response.json();
            if (response.status === 403) {
                this.logger.error(`Error response from quick-eighteen: ${JSON.stringify(responseData)}`);
            }
            void loggerService.errorLog({
                userId: "",
                url: "/QuickEighteen/createCustomer",
                userAgent: "",
                message: "ERROR_CREATING_CUSTOMER",
                stackTrace: `Error creating customer`,
                additionalDetailsJSON: JSON.stringify({
                    customerData: customerData,
                    responseData,
                }),
            });
            throw new Error(`Error creating customer: ${JSON.stringify(responseData)}`);
        }

        return (await response.json()) as QuickEighteenGetCustomerResponse;
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
        providerCourseMembershipId?: string
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
            providerCourseMembershipId: string | null;
        }[] = [];

        for (let i = 0; i < slots; i++) {
            bookingSlots.push({
                id: randomUUID(),
                bookingId: bookingId,
                slotnumber: providerBookingId[i]!,
                name: i === 0 ? "" : "Guest",
                customerId: i === 0 ? customerId : "",
                isActive: true,
                slotPosition: i + 1,
                lastUpdatedDateTime: null,
                createdDateTime: null,
                providerCourseMembershipId: providerCourseMembershipId ?? null,
            });
        }
        return bookingSlots;
    }

    addSalesData = async (Options: SalesDataOptions): Promise<void> => {
    };

    //@ts-ignore
    async updateTeeTime(
        _token: string,
        _courseId: string,
        _teesheetId: string,
        _bookingId: string,
        _options?: TeeTimeUpdateRequest
    ): Promise<BookingResponse> {
        return {} as BookingResponse;
    }

    async getCustomer(
        token: string,
        courseId: string,
        customerDetails: FetchCustomerDetails
    ): Promise<GetCustomerResponse | undefined> {
        const { FACILITY_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        const { email, firstName, lastName, phone } = customerDetails;
        const endpoint = this.getBasePoint();
        const customerData = {
            "FirstName": firstName,
            "LastName": lastName,
            "Phone": phone,
            "EmailAddress": email
        }
        const url = `${endpoint}/facility/${FACILITY_ID}/customer?type=BaseCustomer`;

        const headers = this.getHeaders(token);

        this.logger.info(`getCustomer - ${url}`);
        this.logger.info(`customerData - ${JSON.stringify(customerData)}`);

        const response = await fetch(url, {
            method: "POST",
            headers: headers,
            body: JSON.stringify(customerData),
        });

        if (!response.ok) {
            this.logger.error(`Error fetching customer: ${response.statusText}`);
            const responseData = await response.json();
            this.logger.error(`Error response from quick-eighteen: ${JSON.stringify(JSON.stringify(responseData))}`);
            void loggerService.errorLog({
                userId: "",
                url: "/QuickEighteen/getCustomer",
                userAgent: "",
                message: "ERROR_FETCHING_CUSTOMER",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    email,
                    responseData,
                }),
            });
            throw new Error(`Error fetching customer: ${JSON.stringify(responseData)}`);
        }

        const customer = await response.json();

        return customer as QuickEighteenGetCustomerResponse;
    }

    shouldAddSaleData(): boolean {
        return false;
    }

    getSalesDataOptions(): SalesDataOptions {
        return {} as SalesDataOptions;
    }

    supportsPlayerNameChange(): boolean {
        return false;
    }

    getCustomerCreationData(buyerData: BuyerData): QuickEighteenCustomerCreationData {
        const nameOfCustomer = buyerData.name ? buyerData.name.split(" ") : ["", ""];
        const customer: QuickEighteenCustomerCreationData = {
            EmailAddress: buyerData.email ?? "",
            FirstName: nameOfCustomer?.[0] ? nameOfCustomer[0] : "guest",
            LastName: nameOfCustomer?.[1] ? nameOfCustomer[1] : "N/A",
            Phone: buyerData.phone ?? "",
            PostalCode: buyerData.zipcode ?? "",
        };
        return customer;
    }

    getCustomerId(customerData: QuickEighteenGetCustomerResponse): string {
        return customerData.Id.toString();
    }

    getBookingCreationData(teeTimeData: TeeTimeData): QuickEighteenBookingCreationData {
        const { PRICE_SCHEDULE_ID } = JSON.parse(
            this.providerConfiguration ?? "{}"
        );
        const teeTimeDate = dayjs.utc(teeTimeData.startTime, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DD HH:mm');
        const bookingData: QuickEighteenBookingCreationData = {
            CourseId: Number(teeTimeData.providerCourseId),
            TeeTimeId: Number(teeTimeData.providerTeeTimeId),
            CustomerId: Number(teeTimeData.providerCustomerId),
            Players: teeTimeData.playerCount,
            GreensFeeAmountPerPlayer: teeTimeData.greenFees,
            PriceScheduleId: PRICE_SCHEDULE_ID,
            Status: "Complete",
            TeeDateTime: teeTimeDate,
            Notes: teeTimeData.notes ?? "",
        };
        return bookingData;
    }

    getBookingId(bookingData: BookingResponse): string {
        const data = bookingData as QuickEighteenBookingResponse;
        return data.Details.Id.toString();
    }

    getAvailableSpotsOnTeeTime(teeTimeData: QuickEighteenTeeTimeResponse): number {
        return teeTimeData.Availability;
    }

    indexTeeTime = async (
        formattedDate: string,
        providerCourseId: string,
        _providerTeeSheetId: string,
        provider: ProviderAPI,
        token: string,
        _time: number,
        teeTimeId: string,
        providerTeeTimeId: string
    ) => {
        try {
            const teeTimeResponse = (await provider.getTeeTimes(
                token,
                providerCourseId,
                "",
                "",
                "",
                formattedDate
            )) as unknown as QuickEighteenTeeTimeResponse[];

            let teeTime;
            if (teeTimeResponse && teeTimeResponse.length > 0) {
                teeTime = teeTimeResponse.find((teeTime) => teeTime.TeeTimeId.toString() === providerTeeTimeId);
            }
            if (!teeTime) {
                throw new Error("Tee time not available for booking");
            }
            const [indexedTeeTime] = await db
                .select({
                    id: teeTimes.id,
                    courseId: teeTimes.courseId,
                    courseProvider: courses.providerId,
                    availableSecondHandSpots: teeTimes.availableSecondHandSpots,
                    entityId: courses.entityId,
                    greenFeeTaxPerPlayer: teeTimes.greenFeeTaxPerPlayer,
                    cartFeeTaxPerPlayer: teeTimes.cartFeeTaxPerPlayer,
                })
                .from(teeTimes)
                .leftJoin(courses, eq(courses.id, teeTimes.courseId))
                .where(eq(teeTimes.providerTeeTimeId, teeTime.TeeTimeId.toString()))
                .execute()
                .catch((err: Error) => {
                    this.logger.error(err);
                    void loggerService.errorLog({
                        userId: "",
                        url: "/QuickEighteen/indexTeeTime",
                        userAgent: "",
                        message: "ERROR_FINDING_INDEXED_TEE_TIME_BY_ID",
                        stackTrace: ``,
                        additionalDetailsJSON: JSON.stringify({
                            teeTimeId,
                            providerTeeTimeId,
                        }),
                    });
                    throw new Error(`Error finding tee time id`);
                });

            if (indexedTeeTime) {
                const hours = Number(teeTime.TeeDateTime?.split(' ')?.[1]?.split(':')?.[0]);
                const minutes = Number(teeTime.TeeDateTime?.split(' ')?.[1]?.split(':')?.[1]);
                const militaryTime = hours * 100 + minutes;
                const formattedDatetime = dayjs(teeTime.TeeDateTime).utc().format('YYYY-MM-DD HH:mm:ss.SSS');
                const formattedProviderDatetime = dayjs.utc(teeTime.TeeDateTime, 'YYYY-MM-DD HH:mm').format('YYYY-MM-DDTHH:mm:ss.SSS');

                const pricing = teeTime.Prices[0];
                if (!pricing) {
                    throw new Error("Pricing not found");
                }
                const taxes = pricing.Adjustments.find((adj) => adj.Name === "Taxes and/or Fees");

                const providerTeeTime = {
                    id: indexedTeeTime.id,
                    courseId: indexedTeeTime.courseId,
                    providerTeeTimeId: String(teeTime.TeeTimeId),
                    numberOfHoles: 18,
                    date: formattedDatetime,
                    time: militaryTime,
                    maxPlayersPerBooking: teeTime.Availability,
                    availableFirstHandSpots: teeTime.Availability,
                    availableSecondHandSpots: 0,
                    greenFeePerPlayer: pricing.GreensFee * 100,
                    cartFeePerPlayer: 0,
                    greenFeeTaxPerPlayer: taxes?.Amount ? taxes.Amount * 100 : 0,
                    cartFeeTaxPerPlayer: 0,
                    providerDate: formattedProviderDatetime,
                };
                const providerTeeTimeMatchingKeys = {
                    id: indexedTeeTime.id,
                    providerTeeTimeId: String(teeTime.TeeTimeId),
                    numberOfHoles: 18,
                    date: formattedDatetime,
                    time: militaryTime,
                    maxPlayersPerBooking: teeTime.Availability,
                    greenFeePerPlayer: pricing.GreensFee * 100,
                    cartFeePerPlayer: 0,
                    greenFeeTaxPerPlayer: indexedTeeTime.greenFeeTaxPerPlayer ? indexedTeeTime.greenFeeTaxPerPlayer : 0,
                    cartFeeTaxPerPlayer: indexedTeeTime.cartFeeTaxPerPlayer,
                    courseId: indexedTeeTime.courseId,
                    availableFirstHandSpots: teeTime.Availability,
                    availableSecondHandSpots: indexedTeeTime.availableSecondHandSpots,
                    courseProvider: indexedTeeTime.courseProvider,
                    providerDate: formattedProviderDatetime,
                };
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
                            void loggerService.errorLog({
                                userId: "",
                                url: "/QuickEighteen/indexTeeTime",
                                userAgent: "",
                                message: "ERROR_UPDATING_INDEXED_TEE_TIME",
                                stackTrace: ``,
                                additionalDetailsJSON: JSON.stringify({
                                    teeTimeId,
                                    providerTeeTimeId,
                                    indexedTeeTime,
                                }),
                            });
                            throw new Error(`Error updating tee time: ${err}`);
                        });
                }
            }
        } catch (error) {
            this.logger.error(error);
            void loggerService.errorLog({
                userId: "",
                url: "/QuickEighteen/indexTeeTime",
                userAgent: "",
                message: "ERROR_INDEXING_TEE_TIME",
                stackTrace: ``,
                additionalDetailsJSON: JSON.stringify({
                    teeTimeId,
                }),
            });
            // throw new Error(`Error indexing tee time: ${error}`);
            throw new Error(
                `We're sorry. This time is no longer available. Someone just booked this. It may take a minute for the sold time you selected to be removed. Please select another time.`
            );
        }
    };

    getSlotIdsFromBooking = (bookingData: BookingResponse): string[] => {
        return [];
    };

    getPlayerCount(bookingData: BookingResponse): number {
        const data = bookingData as QuickEighteenBookingResponse;
        return data.Players;
    }

    findTeeTimeById(teeTimeId: string, teetimes: TeeTimeResponse[]): QuickEighteenTeeTimeResponse | undefined {
        const teeTimes = teetimes as QuickEighteenTeeTimeResponse[];
        const teeTime = teeTimes.find((teeTime) => teeTime.TeeTimeId.toString() === teeTimeId);

        return teeTime;
    }

    getBookingNameChangeOptions(_customerDetails: NameChangeCustomerDetails): BookingNameChangeOptions {
        return {} as BookingNameChangeOptions;
    }

    getCustomerIdFromGetCustomerResponse(getCustomerResponse: GetCustomerResponse): {
        customerId: string;
        accountNumber?: number;
    } {
        const customer = getCustomerResponse as QuickEighteenGetCustomerResponse;

        return { customerId: customer.Id.toString() };
    }
    async checkBookingIsCancelledOrNot(
        providerBookingId: string,
        providerCourseId: string,
        providerTeeSheetId: string,
        token: string,
        providerInternalId: string,
        courseId: string,
        providerCourseConfiguration: string
    ): Promise<boolean> {
        let bookingIsDeleted = false;
        const endpoint = this.getBasePoint();
        const { FACILITY_ID } = JSON.parse(this.providerConfiguration ?? "{}");
        const quickEighteenToken = await this.getToken();
        const url = `${endpoint}/facility/${FACILITY_ID}/reservation/${providerBookingId}`;
        const headers = this.getHeaders(quickEighteenToken);
        const response = await fetch(url, {
            method: "GET",
            headers: headers,
        });
        const quickEighteenBooking = await response.json() as QuickEighteenBookingResponse;

        if (quickEighteenBooking.Status === "Cancelled") {
            bookingIsDeleted = true;
        } else {
            bookingIsDeleted = false;
        }
        // console.log("bookingIsDeleted================8888888>",bookingIsDeleted)
        return bookingIsDeleted;
    }
    async SearchCustomer(token: string, providerCourseId: string, email: string): Promise<CustomerData> {
        return {} as CustomerData;
    }
    requireToCreatePlayerSlots(): boolean {
        return false;
    }
}
