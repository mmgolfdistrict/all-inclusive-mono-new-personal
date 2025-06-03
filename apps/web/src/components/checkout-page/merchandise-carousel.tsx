import React, { useEffect, useRef, useState } from 'react';
import MerchandiseCard from '../cards/merchandise-card';
import { Close } from '../icons/close';
import { Tooltip } from '../tooltip';
import { Info } from '../icons/info';

export interface MerchandiseItem {
    id: string;
    caption: string;
    price: number;
    description: string | null;
    longDescription: string | null;
    logoURL: string | null;
    qoh: number;
}

interface MerchandiseInfoPopupProps {
    item: MerchandiseItem;
    position: { top: number; left: number };
    onClose: () => void;
}

interface MerchandiseCarouselProps {
    items: MerchandiseItem[] | undefined | null;
    title?: string;
    onItemQuantityChange?: (itemId: string | number, newQuantity: number, price: number) => void;
}

const POPUP_BOUNDARY_PADDING = 8;

const MerchandiseCarousel: React.FC<MerchandiseCarouselProps> = ({
    items,
    title = "Add-Ons",
    onItemQuantityChange
}) => {
    const [activePopupId, setActivePopupId] = useState<string | number | null>(null);
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
    const [activeItem, setActiveItem] = useState<MerchandiseItem | null>(null);
    const componentContainerRef = useRef<HTMLDivElement>(null);
    const scrollableContainerRef = useRef<HTMLDivElement>(null);

    const handleQuantityChange = (itemId: string, newQuantity: number, price: number) => {
        onItemQuantityChange?.(itemId, newQuantity, price);
    };

    const handleCardClick = (item: MerchandiseItem, event: React.MouseEvent<HTMLDivElement>) => {
        if ((event.target as HTMLElement).closest('button')) {
            return;
        }

        if (activePopupId === item.id) {
            setActivePopupId(null);
            setPopupPosition(null);
            return;
        }

        const cardElement = event.currentTarget;
        const scrollContainer = scrollableContainerRef.current;
        const componentContainer = componentContainerRef.current;

        if (!scrollContainer || !componentContainer) return;

        const cardRect = cardElement.getBoundingClientRect();
        const scrollContainerRect = scrollContainer.getBoundingClientRect();
        const componentContainerRect = componentContainer.getBoundingClientRect();

        // Top position relative to the component's main container (relative parent)
        // This calculation remains correct.
        const top = cardRect.top - componentContainerRect.top;

        // 1. Find card's left relative to the component container's left edge.
        const cardLeftRelativeToComponent = cardRect.left - componentContainerRect.left;

        // 2. Define the visible boundaries *relative to the component container*.
        //    Assume componentContainer and scrollContainer left edges align visually.
        //    If they don't (e.g., padding on componentContainer), this needs adjustment.
        const visibleAreaLeft = scrollContainerRect.left - componentContainerRect.left;
        const visibleAreaRight = visibleAreaLeft + scrollContainer.clientWidth;

        // 3. Initial desired popup left position is where the card is.
        const desiredPopupLeft = cardLeftRelativeToComponent;

        // 4. Apply boundary checks using the visible area boundaries.
        const popupWidth = Math.min(460, componentContainer.clientWidth);
        let finalPopupLeft = desiredPopupLeft;

        // Check Right Boundary: If popup's right edge goes past visible right edge
        if (desiredPopupLeft + popupWidth > visibleAreaRight - POPUP_BOUNDARY_PADDING) {
            // Align popup's right edge with the visible area's right edge
            finalPopupLeft = visibleAreaRight - popupWidth - POPUP_BOUNDARY_PADDING;
        }

        // Check Left Boundary: If popup's left edge goes past visible left edge
        if (desiredPopupLeft < visibleAreaLeft) {
            // Align popup's left edge with the visible area's left edge
            finalPopupLeft = visibleAreaLeft;
        }

        // 5. Final clamp (safety check, handles cases where container is narrower than popup + padding)
        finalPopupLeft = Math.max(
            visibleAreaLeft,
            Math.min(finalPopupLeft, visibleAreaRight - popupWidth - POPUP_BOUNDARY_PADDING)
        );

        setActivePopupId(item.id);
        setPopupPosition({ top, left: finalPopupLeft });
    };

    const handleClosePopup = () => {
        setActivePopupId(null);
        setPopupPosition(null);
    }

    useEffect(() => {
        setActiveItem(items?.find((item) => item.id === activePopupId) || null);
    }, [activePopupId]);

    if (!items || items.length === 0) {
        return null;
    }

    return (
        <div className="relative" ref={componentContainerRef} >
            {title && <div className='flex gap-1 items-center mb-3'>
                <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                <Tooltip
                    trigger={<Info className="h-[20px] w-[20px] text-primary-gray" />}
                    content="Prepaying for add-ons guarantees your availability for your rentals and may be cheaper than paying at the course."
                />
            </div>
            }
            <div
                className="flex overflow-x-auto gap-4 pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                ref={scrollableContainerRef}
            >
                {items.map((item) => (
                    <MerchandiseCard
                        key={item.id}
                        item={item}
                        onQuantityChange={handleQuantityChange}
                        onCardClick={handleCardClick}
                    />
                ))}

                {activeItem && popupPosition && (
                    <MerchandiseInfoPopup
                        item={activeItem}
                        position={popupPosition}
                        onClose={handleClosePopup}
                    />
                )}
            </div>
        </div>
    );
};

export default MerchandiseCarousel;

const MerchandiseInfoPopup: React.FC<MerchandiseInfoPopupProps> = ({
    item,
    position,
    onClose,
}) => {
    const popupRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);


    return (
        <div
            ref={popupRef}
            className="absolute z-10 bg-white border border-primary rounded-lg p-4 shadow-lg flex flex-col gap-2 w-full max-w-[460px]"
            style={{
                top: `${position.top}px`,
                left: `${position.left}px`,
                transform: 'translateY(calc(-100% - 8px))',
                overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
        >

            <div className="flex justify-between items-start">
                <div className='flex gap-4'>
                    {
                        item.logoURL ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={item.logoURL}
                                alt={item.caption}
                                className="object-cover w-16 h-16 rounded-md"
                                width={64}
                                height={64}
                            />
                        ) : null
                    }
                    <div className='flex flex-col gap-1'>
                        <h3 className="text-md font-semibold text-gray-800 line-clamp-1">{item.caption}</h3>
                        <p className="text-sm text-gray-600">
                            {item.longDescription}
                        </p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                    aria-label="Close merchandise details"
                >
                    <Close className="h-[25px] w-[25px]" />
                </button>
            </div>

        </div>
    );
};