"use-client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, type ReactNode, type FC, useEffect } from "react";
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

    useEffect(() => {
        if (!isOpen) {
            document.body.classList.remove("overflow-hidden");
        }
    }, [isOpen]);

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
                            bg-white md:rounded-lg shadow-lg w-full
                            max-w-2xl transform border border-stroke text-left
                            align-middle ${isSmallHeightMobile ? 'mt-[6rem]' : 'mt-[5.5rem]'}
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
                            <div className="sticky top-0 bg-white z-10 px-4 pt-2 pb-2 border-b border-gray-200 flex justify-center items-center">
                                <h2 className="text-xl font-semibold text-center w-full">{title}</h2>
                                <button
                                    className="absolute top-2 right-0 p-2"
                                    onClick={onClose}
                                    data-testid="close-button-id"
                                >
                                    <Close className="w-[1.25rem] h-[1.25rem]" />
                                </button>
                            </div>
                            <div
                                className={`px-2 overflow-y-auto max-h-[95vh] mb-16`}
                            >
                                {children}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>);
};