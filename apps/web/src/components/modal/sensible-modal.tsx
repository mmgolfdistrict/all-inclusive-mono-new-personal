import { useUpdateSearchParams } from "~/hooks/useUpdateSearchParams";
import { formatMoney } from "~/utils/formatters";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRef, useState } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { Sensible } from "../icons/sensible";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
};

export const SensibleModal = ({
  isOpen,
  onClose,
  sensiblePrice,
}: {
  isOpen: boolean;
  onClose: () => void;
  sensiblePrice: number | undefined;
}) => {
  const [addWeatherGuarantee, setAddWeatherGuarantee] =
    useState<boolean>(false);
  const { updateSearchParams } = useUpdateSearchParams();

  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = () => {
    onClose();
  };
  useOnClickOutside(modalRef, handleClickOutside);

  const toggleWeatherGuarantee = () => {
    const value = !addWeatherGuarantee;
    setAddWeatherGuarantee(!addWeatherGuarantee);
    updateSearchParams(["addSensible"], [value.toString()]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50 bg-[#00000099]"
          style={{ willChange: "opacity" }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="bg-white md:rounded-lg shadow-lg w-full max-w-2xl transform text-left align-middle"
            style={{ willChange: "opacity, transform" }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            ref={modalRef}
            transition={{ duration: 0.2 }}
          >
            <div className="overflow-y-auto max-h-[100dvh]">
              <div className="flex flex-col gap-4 p-6 md:rounded-t-lg bg-tertiary-gray">
                <h1 className="font-semibold text-[22px] md:text-[28px]">
                  Protect Your Trip from Weather
                </h1>
                <p className="font-bold">
                  Add a Weather Guarantee for{" "}
                  {sensiblePrice ? formatMoney(sensiblePrice) : "-"}
                </p>
                <p className="max-w-[500px]">
                  Sensible Weather will automatically reimburse you when Mother
                  Nature has other plans for your day - No Claims, No Hassle.
                </p>
                <div className="flex gap-1">
                  <input
                    type="checkbox"
                    checked={addWeatherGuarantee}
                    onChange={toggleWeatherGuarantee}
                    className="cursor-pointer w-5 accent-primary"
                  />
                  <button
                    onClick={toggleWeatherGuarantee}
                    className="cursor-pointer"
                  >
                    Add Weather Guarantee
                  </button>
                  <p>or</p>
                  <Link
                    href="https://www.sensibleweather.com/about-sensible/"
                    target="_blank"
                    rel="noopenner noreferrer"
                    className="underline"
                  >
                    Learn More
                  </Link>
                </div>
              </div>
              <div className="border-t flex flex-col md:flex-row gap-4 p-6 items-center justify-between">
                <div className="flex flex-col text-[14px] text-primary">
                  <Link
                    href="https://www.sensibleweather.com/guarantee-terms-and-conditions"
                    target="_blank"
                    rel="noopenner noreferrer"
                    className="underline"
                  >
                    We believe in no surprises, read our Terms & Conditions
                  </Link>
                  <Link
                    href="https://www.sensibleweather.com/sensible-weather-privacy-policy"
                    target="_blank"
                    rel="noopenner noreferrer"
                    className="underline"
                  >
                    View our Privacy Policy
                  </Link>
                </div>
                <Sensible className="h-[24px] w-[138px]" />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
