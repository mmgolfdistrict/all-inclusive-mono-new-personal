import { useSidebar } from "~/hooks/useSidebar";
import { Close } from "../icons/close";
import type { Dispatch, ReactNode, SetStateAction } from "react";

type FlyoutProps = {
    isOpen: boolean,
    title: string,
    setIsOpen: Dispatch<SetStateAction<boolean>>
    children: ReactNode,
    className?: string
}

const Flyout = ({ isOpen, title, setIsOpen, children, className }: FlyoutProps) => {
    const { toggleSidebar } = useSidebar({
        isOpen,
        setIsOpen,
    });

    return (
        <>
            {isOpen && (
                <div
                    className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
                >
                    <div className="h-screen bg-[#00000099]" />
                </div>
            )}
            <aside
                className={`
                    !duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh]
                    w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border
                    border-stroke bg-white shadow-lg transition-all
                    ease-linear sm:w-[31.25rem] md:h-[100dvh] ${className}
                    ${isOpen ? "translate-x-0" : "translate-x-full"}
                `}
            >
                <div className="relative flex h-full flex-col">
                    <div className="flex items-center justify-between p-4">
                        <div className="text-lg">{title}</div>
                        <button
                            onClick={toggleSidebar}
                            aria-controls="sidebar"
                            aria-expanded={isOpen}
                            className="z-[2]"
                            aria-label="sidebarToggle"
                            data-testid="close-button-id"
                        >
                            <Close className="h-[1.5625rem] w-[1.5625rem]" />
                        </button>
                    </div>
                    <div className="flex h-full flex-col justify-between overflow-y-auto">{children}</div>
                </div>
            </aside>
        </>
    )
}

export default Flyout;