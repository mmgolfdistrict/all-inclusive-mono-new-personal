"use client";

import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

interface BookingSourceContextType {
  bookingSource: string;
  setBookingSource: Dispatch<SetStateAction<string>>;
}

const BookingSourceContext = createContext<BookingSourceContextType>({
  bookingSource: "",
  setBookingSource: () => undefined,
});

export const BookingSourceWrapper = ({ children }: { children: ReactNode }) => {
  const [bookingSource, setBookingSource] = useState<string>("");

  const handleBookingSourceChange = (source: string) => {
    setBookingSource(source);
  };

  const settings = {
    bookingSource,
    setBookingSource: handleBookingSourceChange,
  };

  return (
    <BookingSourceContext.Provider value={settings}>
      {children}
    </BookingSourceContext.Provider>
  );
};

export const useBookingSourceContext = () => {
  return useContext(BookingSourceContext);
};
