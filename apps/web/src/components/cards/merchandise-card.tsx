import React, { useEffect, useMemo, useState } from 'react';
import type { MerchandiseItem } from '../checkout-page/merchandise-carousel';
import { OutlineButton } from '../buttons/outline-button';
import { formatMoney } from '~/utils/formatters';
import { Tooltip } from '../tooltip';

interface MerchandiseCardProps {
    item: MerchandiseItem;
    maxQuantity: number;
    onQuantityChange?: (itemId: string | number, newQuantity: number, price: number, merchandiseTaxPercent?: number | null) => void;
    onCardClick?: (item: MerchandiseItem, event: React.MouseEvent<HTMLDivElement>) => void;
}

const MerchandiseCard: React.FC<MerchandiseCardProps> = ({ item, onQuantityChange, onCardClick, maxQuantity }) => {
    const [quantity, setQuantity] = useState<number>(0);
    const [isExpanded, setIsExpanded] = useState<boolean>(false);

    const handleToggle = () => {
        setIsExpanded(!isExpanded);
    };

    const handleAdd = () => {
        const newQuantity = 1;
        setQuantity(newQuantity);
        onQuantityChange?.(item.id, newQuantity, item.price, item.merchandiseTaxPercent);
    };

    const handleIncrement = () => {
        const newQuantity = quantity + 1;
        setQuantity(newQuantity);
        onQuantityChange?.(item.id, newQuantity, item.price, item.merchandiseTaxPercent);
    };

    const handleDecrement = () => {
        if (quantity > 0) {
            const newQuantity = quantity - 1;
            setQuantity(newQuantity);
            onQuantityChange?.(item.id, newQuantity, item.price, item.merchandiseTaxPercent);
        }
    };

    const handleCardWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (onCardClick) {
            onCardClick?.(item, event);
        }
    }

    const isIncrementDisabled = useMemo(() => {
        if (quantity >= item.qoh && item.qoh !== -1) {
            return true;
        }
        if (item.maxQtyToAdd === 0 && quantity >= maxQuantity) {
            return true;
        }
        if (item.maxQtyToAdd > 0 && quantity >= item.maxQtyToAdd) {
            return true;
        }

        return false;
    }, [item, maxQuantity, quantity]);

    useEffect(() => {
        if (item.maxQtyToAdd === 0 && quantity >= maxQuantity) {
            setQuantity(maxQuantity);
            onQuantityChange?.(item.id, maxQuantity, item.price, item.merchandiseTaxPercent);
        }
    }, [maxQuantity]);

    return (
        <div
            className="flex-shrink-0 w-72 bg-white border border-primary rounded-lg p-4 shadow-sm flex flex-col justify-between gap-3 cursor-pointer"
            onClick={handleCardWrapperClick}
        >
            <div className='flex gap-4'>
                {
                    item.logoURL ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={item.logoURL}
                            alt={item.caption}
                            width={48}
                            height={48}
                            className="w-16 h-16 object-cover rounded-md flex-1 mt-2"
                        />
                    ) : null
                }
                <div className='w-full flex flex-col'>
                    <h2
                        className="w-full text-lg font-semibold overflow-hidden line-clamp-1"
                    >
                        {item.caption}
                    </h2>
                    <Tooltip className='text-start flex-[2]' delay={1000} content={item.description} trigger={
                        <p className="w-full text-sm text-gray-600 overflow-hidden">
                            {!isExpanded
                                ? `${item.description?.slice(0, 50)}`
                                : item.description}
                            {!isExpanded && (item.description?.length ?? 0) > 50 ? "..." : ""}
                            {(item.description?.length ?? 0) > 50 ? <span
                                className="text-xs text-primary cursor-pointer ml-2"
                                onClick={handleToggle}
                            >
                                {isExpanded ? "...Read Less" : "Read More..."}
                            </span> : null}
                        </p>
                    } />
                </div>
            </div>

            <div className="mt-auto flex justify-between items-center">
                <div className="text-[14px] md:text-[16px] font-semibold text-secondary-black">
                    {formatMoney(item.price / 100)}
                </div>
                {quantity === 0 ? (
                    <OutlineButton
                        onClick={handleAdd}
                        className='rounded-full max-w-[180px] w-full'
                        aria-label={`Add ${item.caption} to cart`}
                        type="button"
                    >
                        Add
                    </OutlineButton>
                ) : (
                    <div className="flex items-center justify-between">
                        <OutlineButton
                            onClick={handleDecrement}
                            className="rounded-md min-w-[40px] !px-0"
                            aria-label={`Decrease quantity of ${item.caption}`}
                            type="button"
                        >
                            -
                        </OutlineButton>
                        <span className="font-semibold text-gray-800 min-w-[48px] bg-secondary-white py-1 text-center" aria-live="polite">
                            {quantity}
                        </span>
                        <OutlineButton
                            onClick={handleIncrement}
                            className="rounded-md min-w-[40px] !px-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label={`Increase quantity of ${item.caption}`}
                            disabled={isIncrementDisabled}
                            type="button"
                        >
                            +
                        </OutlineButton>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MerchandiseCard;