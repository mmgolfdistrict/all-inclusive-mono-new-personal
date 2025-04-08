import { AnimatePresence, motion } from "framer-motion";
import { useRef, type ReactNode, type FC } from "react";
import { useMediaQuery, useOnClickOutside } from "usehooks-ts";
import { Close } from "../icons/close";

interface ModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    className?: string
}

const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
};

const modalVariants = {
    hidden: { opacity: 0, scale: 0.5 },
    visible: { opacity: 1, scale: 1 },
};

export const Modal: FC<ModalProps> = ({ title, isOpen, onClose, children, className }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const isSmallHeightMobile = useMediaQuery("(max-height: 667px)");
    const handleClickOutside = () => {
        onClose();
    };
    useOnClickOutside(modalRef, handleClickOutside);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 flex items-center justify-center z-500 bg-[#00000099]"
                    style={{ willChange: "opacity", zIndex: 99 }}
                    variants={backdropVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                >
                    <motion.div
                        className={`
                            bg-white md:rounded-lg px-2 shadow-lg w-full
                            max-w-2xl transform border border-stroke text-left
                            align-middle ${isSmallHeightMobile ? 'mt-[96px]' : 'mt-[88px]'}
                        `}
                        style={{ willChange: "opacity, transform" }}
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        ref={modalRef}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={`relative ${className ?? ""}`}>
                            <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-2 border-b border-gray-200 flex justify-center items-center">
                                <h2 className="text-xl font-semibold text-center w-full">{title}</h2>
                                <button
                                    className="absolute top-4 right-4 p-2"
                                    onClick={onClose}
                                    data-testid="close-button-id"
                                >
                                    <Close className="w-[20px] h-[20px]" />
                                </button>
                            </div>
                            <div
                                className={`
                                    px-2 mt-2
                                    ${isSmallHeightMobile ? 'mb-6' : 'mb-4'}
                                `}>
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>);
};