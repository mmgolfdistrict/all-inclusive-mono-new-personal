export enum EditProfileActionKind {
  NAME = "NAME",
  EMAIL = "EMAIL",
  USERNAME = "USERNAME",
  // LOCATION = "LOCATION",
  ADDRESS1 = "ADDRESS1",
  ADDRESS2 = "ADDRESS2",
  STATE = "STATE",
  CITY = "CITY",
  ZIPCODE = "ZIPCODE",
  COUNTRY = "COUNTRY",
  PROFILE_PICTURE = "PROFILE_PICTURE",
  BACKGROUND_IMAGE = "BACKGROUND_IMAGE",
  RESET = "RESET",
}

type State = {
  name: string;
  email: string;
  username: string;
  // location: string;
  address1: string;
  address2?: string;
  city: string;
  country: string;
  zipcode: string;
  state: string;
  profilePicture: string;
  backgroundImage: string;
};

type Action = { action: EditProfileActionKind; payload: string };

export const initEditProfileState: State = {
  name: "",
  email: "",
  username: "",
  // location: "",
  address1: "",
  address2: "",
  state: "",
  zipcode: "",
  city: "",
  country: "",
  profilePicture: "",
  backgroundImage: "",
};

export const editProfileReducer = (state: State, action: Action) => {
  const { action: type, payload } = action;

  switch (type) {
    case EditProfileActionKind.NAME:
      return {
        ...state,
        name: payload,
      };
    case EditProfileActionKind.EMAIL:
      return {
        ...state,
        email: payload,
      };
    case EditProfileActionKind.USERNAME:
      return {
        ...state,
        username: payload,
      };
    // case EditProfileActionKind.LOCATION:
    //   return {
    //     ...state,
    //     location: payload,
    //   };
    case EditProfileActionKind.ADDRESS1:
      return {
        ...state,
        address1: payload,
      };
    case EditProfileActionKind.ADDRESS2:
      return {
        ...state,
        address2: payload,
      };
    case EditProfileActionKind.STATE:
      return {
        ...state,
        state: payload,
      };
    case EditProfileActionKind.CITY:
      return {
        ...state,
        city: payload,
      };
    case EditProfileActionKind.ZIPCODE:
      return {
        ...state,
        zipcode: payload,
      };
    case EditProfileActionKind.COUNTRY:
      return {
        ...state,
        country: payload,
      };
    case EditProfileActionKind.PROFILE_PICTURE:
      return {
        ...state,
        profilePicture: payload,
      };
    case EditProfileActionKind.BACKGROUND_IMAGE:
      return {
        ...state,
        backgroundImage: payload,
      };
    case EditProfileActionKind.RESET:
      return initEditProfileState;
    default: {
      throw Error("Unknown action.");
    }
  }
};
