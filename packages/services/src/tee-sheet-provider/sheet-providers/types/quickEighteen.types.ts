export interface QuickEighteenTeeTimesData {
    TeeTimePolicy: string;
    Times: QuickEighteenTeeTimeResponse[];
}

export interface QuickEighteenTeeTimeResponse {
    CourseId: number;
    TeeDateTime: string;
    TeeTimeId: number;
    TeeName: string | null;
    Availability: number;
    AllowedGroupSizes: number[];
    Prices: PriceSchedule[];
}

interface PriceSchedule {
    PriceScheduleId: number;
    Name: string;
    GreensFee: number;
    Adjustments: Adjustment[];
    Amenities: string[] | null;
}

interface Adjustment {
    Name: string;
    Amount: number;
}

export interface QuickEighteenBookingCreationData {
    CourseId: number;
    TeeDateTime: string;
    TeeTimeId: number;
    Status: string;
    Players: number;
    CustomerId: number;
    PriceScheduleId: number;
    CreditCardId?: number | null;
    Notes?: string;
    GreensFeeAmountPerPlayer: number;
    ExternalChargeAmount?: number;
    ExternalChargeAmountByPlayer?: number[];
    ExternalChargeId?: number | null;
}

export interface QuickEighteenBookingResponse {
    CourseId: number;
    TeeDateTime: string;
    TeeName: string | null;
    Status: string;
    Players: number;
    CustomerId: number;
    CreditCardId: number;
    PriceScheduleId: number;
    Notes: string | null;
    Details: ReservationDetails;
}

interface ReservationDetails {
    Id: number;
    Amenities: string[];
    CourseName: string;
    TeeTimeDescription: string;
    TotalAmount: number;
    GreensFeeAmount: number;
    GreensFeeAmoutPerPlayer: number;
    AmountDueOnline: number;
    AmountDueAtCourse: number;
    OriginalReservationId: number | null;
    ReplacedByReservationId: number | null;
    Adjustments: Adjustment[];
    PromoCodes: PromoCode[];
    RewardPromoCodes: RewardPromoCode[];
    CreditCard: CreditCardDetails | null;
    Players: PlayerDetails[];
}

interface Adjustment {
    Name: string;
    Amount: number;
}

interface PromoCode {
    Resource: string;
    Code: string;
    Description: string;
    TotalAmount: number;
}

interface RewardPromoCode {
    Resource: string;
    RewardProgram: string;
    Code: string;
    Description: string;
    Cost: string;
    TotalAmount: number;
}

interface CreditCardDetails {
    Resource: string;
    CreditCardId: number;
    Number: string;
    ExpMonth: number;
    ExpYear: number;
    FirstName: string;
    LastName: string;
    Address1: string;
    Address2: string;
    City: string;
    StateProv: string;
    PostalCode: string;
    Type: string;
}

interface PlayerDetails {
    CheckedIn: boolean;
    EmailAddress: string;
    FirstName: string;
    LastName: string;
    Resource: string;
    CustomerId: number;
    ShareRewards: boolean;
}

export interface QuickEighteenGetCustomerResponse {
    Id: number;
    FirstName: string;
    LastName: string;
    EmailAddress: string;
    PostalCode: string;
    Phone: string;
    Subscribed: boolean;
}

export interface QuickEighteenCustomerCreationData {
    FirstName: string;
    LastName: string;
    EmailAddress: string;
    PostalCode: string;
    Phone?: string;
}