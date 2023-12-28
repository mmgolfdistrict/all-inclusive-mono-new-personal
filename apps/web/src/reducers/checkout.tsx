export enum CheckoutActionKind {
  CARD_NUMBER = "CARD_NUMBER",
  EXPIRY_DATE = "EXPIRY_DATE",
  SECURITY_CODE = "SECURITY_CODE",
  NAME_ON_CARD = "NAME_ON_CARD",
  RESET = "RESET",
}

export type CheckoutState = {
  cardNumber: string;
  expiryDate: string;
  securityCode: string;
  nameOnCard: string;
};

export type CheckoutAction = {
  action: CheckoutActionKind;
  payload: string;
};

export const initCheckoutState: CheckoutState = {
  cardNumber: "",
  expiryDate: "",
  securityCode: "",
  nameOnCard: "",
};

export const checkoutReducer = (
  state: CheckoutState,
  action: CheckoutAction
) => {
  const { action: type, payload } = action;

  switch (type) {
    case CheckoutActionKind.CARD_NUMBER:
      return {
        ...state,
        cardNumber: payload,
      };
    case CheckoutActionKind.EXPIRY_DATE:
      return {
        ...state,
        expiryDate: payload,
      };
    case CheckoutActionKind.SECURITY_CODE:
      return {
        ...state,
        securityCode: payload,
      };
    case CheckoutActionKind.NAME_ON_CARD:
      return {
        ...state,
        nameOnCard: payload,
      };
    case CheckoutActionKind.RESET:
      return initCheckoutState;
    default: {
      throw Error("Unknown action.");
    }
  }
};
