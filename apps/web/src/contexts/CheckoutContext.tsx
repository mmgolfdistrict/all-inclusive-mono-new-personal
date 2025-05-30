"use client";

import type { SupportedCharity } from "@golf-district/shared";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useCourseContext } from "./CourseContext";

type ReservationData = {
  golfReservationId: string;
  providerReservationId: string;
  playTime: string;
};
type ValidatePlayerType = {
  isValidPlayer: boolean;
  playerEmail: string;
  playerIndex: number;
  courseMemberShipId?: string;
  providerCourseMembershipId?: string;
};

type MerchandiseData = {
  id: string;
  qty: number;
  price: number;
}[];

interface CheckoutContextType {
  shouldAddSensible: boolean;
  handleShouldAddSensible: (bool: boolean) => void;
  sensibleData: { id: string; price: number } | undefined;
  setSensibleData: Dispatch<
    SetStateAction<{ id: string; price: number } | undefined>
  >;
  amountOfPlayers: number;
  setAmountOfPlayers: Dispatch<SetStateAction<number>>;
  promoCode: string;
  handlePromoCode: (code: string) => void;
  selectedCharity: SupportedCharity | undefined;
  handleSelectedCharity: (charityId: string) => void;
  selectedCharityAmount: number | null;
  handleSelectedCharityAmount: (amount: number) => void;
  handleRemoveSelectedCharity: () => void;
  reservationData: ReservationData;
  setReservationData: Dispatch<SetStateAction<ReservationData>>;
  validatePlayers: ValidatePlayerType[];
  setValidatePlayers: Dispatch<SetStateAction<ValidatePlayerType[]>>;
  setIsSensibleLoading: Dispatch<SetStateAction<boolean>>;
  isSensibleLoading: boolean;
  merchandiseData: MerchandiseData;
  setMerchandiseData: Dispatch<SetStateAction<MerchandiseData>>;
}

const CheckoutContext = createContext<CheckoutContextType>({
  shouldAddSensible: false,
  handleShouldAddSensible: () => undefined,
  sensibleData: undefined,
  setSensibleData: () => undefined,
  amountOfPlayers: 1,
  setAmountOfPlayers: () => undefined,
  promoCode: "",
  handlePromoCode: () => undefined,
  selectedCharity: undefined,
  handleSelectedCharity: () => undefined,
  selectedCharityAmount: null,
  handleSelectedCharityAmount: () => undefined,
  handleRemoveSelectedCharity: () => undefined,
  reservationData: {
    golfReservationId: "",
    providerReservationId: "",
    playTime: "",
  },
  setReservationData: () => undefined,
  validatePlayers: [],
  setValidatePlayers: () => undefined,
  setIsSensibleLoading: () => undefined,
  isSensibleLoading: false,
  merchandiseData: [],
  setMerchandiseData: () => undefined,
});

export const CheckoutWrapper = ({ children }: { children: ReactNode }) => {
  const [shouldAddSensible, setShouldAddSensible] = useState<boolean>(false);
  const [isSensibleLoading, setIsSensibleLoading] = useState(false);
  const [reservationData, setReservationData] = useState<ReservationData>({
    golfReservationId: "",
    providerReservationId: "",
    playTime: "",
  });
  const [sensibleData, setSensibleData] = useState<
    { id: string; price: number } | undefined
  >(undefined);
  const [amountOfPlayers, setAmountOfPlayers] = useState<number>(1);
  const [selectedCharity, setSelectedCharity] = useState<
    SupportedCharity | undefined
  >(undefined);
  const [selectedCharityAmount, setSelectedCharityAmount] = useState<
    number | null
  >(null);
  const [promoCode, setPromoCode] = useState<string>("");
  const [validatePlayers, setValidatePlayers] = useState<ValidatePlayerType[]>(
    []
  );
  const [merchandiseData, setMerchandiseData] = useState<MerchandiseData>([]);
  const { course } = useCourseContext();

  const handleShouldAddSensible = (bool: boolean) => {
    setShouldAddSensible(bool);
  };

  const handlePromoCode = (code: string) => {
    setPromoCode(code);
  };

  const handleSelectedCharity = (charityId: string) => {
    const charity = course?.supportedCharities?.find(
      (c) => c.charityId === charityId
    );
    if (charity) setSelectedCharity(charity);
  };

  const handleRemoveSelectedCharity = () => {
    setSelectedCharity(undefined);
    setSelectedCharityAmount(null);
  };

  const handleSelectedCharityAmount = (amount: number) => {
    setSelectedCharityAmount(amount);
  };

  const settings = {
    shouldAddSensible,
    handleShouldAddSensible,
    sensibleData,
    setSensibleData,
    amountOfPlayers,
    setAmountOfPlayers,
    promoCode,
    handlePromoCode,
    selectedCharity,
    handleSelectedCharity,
    selectedCharityAmount,
    handleSelectedCharityAmount,
    handleRemoveSelectedCharity,
    reservationData,
    setReservationData,
    validatePlayers,
    setValidatePlayers,
    isSensibleLoading,
    setIsSensibleLoading,
    merchandiseData,
    setMerchandiseData,
  };

  return (
    <CheckoutContext.Provider value={settings}>
      {children}
    </CheckoutContext.Provider>
  );
};

export const useCheckoutContext = () => {
  return useContext(CheckoutContext);
};
