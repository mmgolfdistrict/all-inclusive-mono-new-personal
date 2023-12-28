export enum ActionKind {
  NAME = "NAME",
  EMAIL = "EMAIL",
  USERNAME = "USERNAME",
  LOCATION = "LOCATION",
  PASSWORD = "PASSWORD",
  PASSWORD_CONFIRMATION = "PASSWORD_CONFIRMATION",
  PROFILE_PICTURE = "PROFILE_PICTURE",
  BACKGROUND_IMAGE = "BACKGROUND_IMAGE",
  RESET = "RESET",
}

type State = {
  name: string;
  email: string;
  username: string;
  location: string;
  password: string;
  passwordConfirmation: string;
  profilePicture: string;
  backgroundImage: string;
};

type Action = { action: ActionKind; payload: string };

export const initRegisterState: State = {
  name: "",
  email: "",
  username: "",
  location: "",
  password: "",
  passwordConfirmation: "",
  profilePicture: "",
  backgroundImage: "",
};

export const registerReducer = (state: State, action: Action) => {
  const { action: type, payload } = action;

  switch (type) {
    case ActionKind.NAME:
      return {
        ...state,
        name: payload,
      };
    case ActionKind.EMAIL:
      return {
        ...state,
        email: payload,
      };
    case ActionKind.USERNAME:
      return {
        ...state,
        username: payload,
      };
    case ActionKind.LOCATION:
      return {
        ...state,
        location: payload,
      };
    case ActionKind.PASSWORD:
      return {
        ...state,
        password: payload,
      };
    case ActionKind.PASSWORD_CONFIRMATION:
      return {
        ...state,
        passwordConfirmation: payload,
      };
    case ActionKind.PROFILE_PICTURE:
      return {
        ...state,
        profilePicture: payload,
      };
    case ActionKind.BACKGROUND_IMAGE:
      return {
        ...state,
        backgroundImage: payload,
      };
    case ActionKind.RESET:
      return initRegisterState;
    default: {
      throw Error("Unknown action.");
    }
  }
};
