interface TeeTimeRate {
  player_type_id: string;
  green_fee: number;
  half_cart: number;
  one_person_cart: number;
  subtotal: number;
}

interface TeeTimeAttributes {
  blocked: boolean;
  date: string;
  hole: number;
  format: string;
  start_time: string;
  free_slots: number;
  subtotal: number;
  restrictions: string[];
  rates: TeeTimeRate[];
}

interface TeeTimeRelationships {
  course: {
    data: {
      id: string;
      type: string;
    };
  };
  event: {
    data: null | {
      id: string;
      type: string;
    };
  };
}

export interface LightspeedTeeTimeResponse {
  id: string;
  type: string;
  attributes: TeeTimeAttributes;
  relationships: TeeTimeRelationships;
}

interface Meta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface LightspeedTeeTimeDataResponse {
  data: LightspeedTeeTimeResponse[];
  meta: Meta;
}

export interface LightspeedBookingCreationData {
  note: string;
  holes: number;
  carts: number;
  greenFee: number;
  cartFee: number;
  playerCount: number;
  customerId: string;
  teeTimeId: string;
  providerTeeTimeId: string;
}

export interface LightspeedCustomerCreationData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface LightSpeedReservationRequestResponse {
  data: {
    id: string;
    type: "reservation_request";
    attributes: {
      holes: number;
      note: string;
      cart_count: number;
    };
    relationships: {
      round_requests: {
        data: any[];
      };
      organization: {
        data: {
          id: string;
          type: "organization";
        };
      };
      teetime: {
        data: {
          id: string;
          type: "teetime";
        };
      };
      tour_operator: {
        data: null;
      };
    };
  };
}

export interface LightspeedRoundRequestResponse {
  data: {
    id: string;
    type: "round_request";
    attributes: {
      guest: {
        first_name: string;
        last_name: string;
      };
      cart_fee: string;
      green_fee: string;
    };
    relationships: {
      reservation_request: {
        data: {
          id: string;
          type: "reservation_request";
        };
      };
      player_type: {
        data: {
          id: string;
          type: "player_type";
        };
      };
      customer: {
        data: {
          id: string;
          type: "customer";
        };
      };
    };
  };
}

export interface LightSpeedBookingResponse {
  data: {
    id: string;
    type: "reservation";
    attributes: {
      booking_reference: string;
      cart_count: number;
      holes: number;
      note: string;
      state: string;
      cancelled_at: string | null;
      created_at: string;
      updated_at: string;
    };
    relationships: {
      teetime: {
        data: {
          id: string;
          type: "teetime";
        };
      };
      organization: {
        data: {
          id: string;
          type: "organization";
        };
      };
      booker: {
        data: null;
      };
      rounds: {
        data: {
          id: string;
          type: "round";
        }[];
      };
      linked_reservations: {
        data: any[];
      };
    };
  };
  included: (Round | Teetime)[];
}

interface Round {
  id: string;
  type: "round";
  attributes: {
    state: string;
    created_at: string;
    updated_at: string;
    cancelled_at: string | null;
    price: number;
    paid: boolean;
    guest: Record<string, unknown>;
    extras: any[];
    kits: any[];
    rates: {
      green_fee: number;
      cart_fee: number;
      extra_fee: number;
      kit_fee: number;
      subtotal: number | null;
    };
  };
  relationships: {
    organization: {
      data: {
        id: string;
        type: "organization";
      };
    };
    reservation: {
      data: {
        id: string;
        type: "reservation";
      };
    };
    player_type: {
      data: {
        id: string;
        type: "player_type";
      };
    };
    customer: {
      data: {
        id: string;
        type: "customership";
      };
    };
  };
}

interface Teetime {
  id: string;
  type: "teetime";
  attributes: {
    blocked: boolean;
    date: string;
    hole: number;
    format: string;
    start_time: string;
    free_slots: number;
  };
  relationships: {
    course: {
      data: {
        id: string;
        type: "course";
      };
    };
    event: {
      data: null;
    };
  };
}

export interface LightspeedCustomerCreationResponse {
  data: {
    id: string;
    type: "customer";
    attributes: {
      first_name: string;
      last_name: string;
      ref: string;
      member_no: string | null;
      marketing_consent: boolean | null;
      date_of_birth: string | null;
      email: string;
      gender: number;
      phone: string;
      created_at: string;
      updated_at: string;
      archived_at: string | null;
      prefers_to_be_hidden: boolean;
      default_player_type_id: string;
      tags: any[];
      integrators: {
        data: any[];
      };
      family_account_primary_customer_id: string | null;
    };
    relationships: {
      address: {
        data: null;
      };
      organization: {
        data: {
          id: string;
          type: "organization";
        };
      };
      subscriptions: {
        data: any[];
      };
      player_types: {
        data: {
          id: string;
          type: "player_type";
        }[];
      };
    };
  };
}

type RoundId = {
  id: string;
  type: "round";
};
export interface LightspeedSaleDataOptions {
  token: string;
  roundIds: RoundId[];
  amount: number;
}

export interface LightspeedBookingNameChangeOptions {
  firstName: string;
  lastName: string;
}

export interface LightspeedGetCustomerResponse {
  id: string;
  type: "customer";
  attributes: {
    first_name: string;
    last_name: string;
    ref: string;
    member_no: string | null;
    marketing_consent: boolean | null;
    date_of_birth: string;
    email: string;
    gender: number;
    phone: string;
    created_at: string;
    updated_at: string;
    archived_at: string | null;
    prefers_to_be_hidden: boolean;
    default_player_type_id: string;
    tags: string[];
    integrators: {
      data: any[];
    };
    family_account_primary_customer_id: string | null;
  };
  relationships: {
    address: {
      data: null;
    };
    organization: {
      data: {
        id: string;
        type: "organization";
      };
    };
    subscriptions: {
      data: any[];
    };
    player_types: {
      data: {
        id: string;
        type: "player_type";
      }[];
    };
  };
  includePhone?: boolean;
}
