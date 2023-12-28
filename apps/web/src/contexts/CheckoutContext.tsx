"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface CheckoutContextType {
  shouldAddSensible: boolean;
  handleShouldAddSensible: (bool: boolean) => void;
  sensibleData: { id: string; price: number } | undefined;
  setSensibleData: Dispatch<
    SetStateAction<{ id: string; price: number } | undefined>
  >;
  amountOfPlayers: number;
  setAmountOfPlayers: Dispatch<SetStateAction<number>>;
}

const CheckoutContext = createContext<CheckoutContextType>({
  shouldAddSensible: false,
  handleShouldAddSensible: () => undefined,
  sensibleData: undefined,
  setSensibleData: () => undefined,
  amountOfPlayers: 1,
  setAmountOfPlayers: () => undefined,
});

export const CheckoutWrapper = ({ children }: { children: ReactNode }) => {
  const [shouldAddSensible, setShouldAddSensible] = useState<boolean>(false);
  const [sensibleData, setSensibleData] = useState<
    { id: string; price: number } | undefined
  >(undefined);
  const [amountOfPlayers, setAmountOfPlayers] = useState<number>(1);

  const handleShouldAddSensible = (bool: boolean) => {
    setShouldAddSensible(bool);
  };

  const settings = {
    shouldAddSensible,
    handleShouldAddSensible,
    sensibleData,
    setSensibleData,
    amountOfPlayers,
    setAmountOfPlayers,
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
