import { AnimatePresence, motion } from "framer-motion";
import { useRef, type FC, type ReactNode } from "react";
import { useOnClickOutside } from "usehooks-ts";
import { Close } from "../icons/close";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1 },
};

export const ModalWrapper: FC<ModalProps> = ({
  isOpen,
  onClose,
  children,
  className,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = () => {
    onClose();
  };
  useOnClickOutside(modalRef, handleClickOutside);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-500 bg-[#00000099]"
          style={{ willChange: "opacity" }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
        >
          <motion.div
            className="bg-white   md:rounded-lg px-2 my-2 shadow-lg w-full max-w-2xl transform border border-stroke text-left align-middle"
            style={{ willChange: "opacity, transform" }}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            ref={modalRef}
            transition={{ duration: 0.2 }}
          >
            <div
              className={`overflow-y-auto max-h-[100dvh] pt-12 pb-6 relative ${
                className ?? ""
              }`}
            >
              <button
                className="absolute top-2 right-0 p-2"
                onClick={onClose}
                data-testid="close-button-id"
              >
                <Close className="w-[20px] h-[20px]" />
              </button>
              <div className="px-4">{children}</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
