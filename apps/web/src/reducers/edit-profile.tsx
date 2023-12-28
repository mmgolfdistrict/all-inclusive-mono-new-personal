export enum EditProfileActionKind {
  NAME = "NAME",
  EMAIL = "EMAIL",
  USERNAME = "USERNAME",
  LOCATION = "LOCATION",
  PROFILE_PICTURE = "PROFILE_PICTURE",
  BACKGROUND_IMAGE = "BACKGROUND_IMAGE",
  RESET = "RESET",
}

type State = {
  name: string;
  email: string;
  username: string;
  location: string;
  profilePicture: string;
  backgroundImage: string;
};

type Action = { action: EditProfileActionKind; payload: string };

export const initEditProfileState: State = {
  name: "",
  email: "",
  username: "",
  location: "",
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
    case EditProfileActionKind.LOCATION:
      return {
        ...state,
        location: payload,
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
