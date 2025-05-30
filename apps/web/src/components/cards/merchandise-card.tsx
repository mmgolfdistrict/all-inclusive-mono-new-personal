import React, { useState } from 'react';
import type { MerchandiseItem } from '../checkout-page/merchandise-carousel';
import { OutlineButton } from '../buttons/outline-button';
import { formatMoney } from '~/utils/formatters';
import { BlurImage } from '../images/blur-image';

interface MerchandiseCardProps {
    item: MerchandiseItem;
    // Optional: Callback to notify parent of quantity changes
    onQuantityChange?: (itemId: string | number, newQuantity: number, price: number) => void;
    onCardClick?: (item: MerchandiseItem, event: React.MouseEvent<HTMLDivElement>) => void;
}

const MerchandiseCard: React.FC<MerchandiseCardProps> = ({ item, onQuantityChange, onCardClick }) => {
    const [quantity, setQuantity] = useState<number>(0);

    const handleAdd = () => {
        const newQuantity = 1;
        setQuantity(newQuantity);
        onQuantityChange?.(item.id, newQuantity, item.price);
    };

    const handleIncrement = () => {
        const newQuantity = quantity + 1;
        setQuantity(newQuantity);
        onQuantityChange?.(item.id, newQuantity, item.price);
    };

    const handleDecrement = () => {
        if (quantity > 0) {
            const newQuantity = quantity - 1;
            setQuantity(newQuantity);
            onQuantityChange?.(item.id, newQuantity, item.price);
        }
    };

    const handleCardWrapperClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (onCardClick) {
            onCardClick?.(item, event);
        }
    }

    return (
        <div
            className="flex-shrink-0 w-72 bg-white border border-primary rounded-lg p-4 shadow-sm flex flex-col justify-between gap-3 cursor-pointer"
            onClick={handleCardWrapperClick}
        >
            <div className='flex gap-2'>
                {
                    item.logoURL ? (
                        <BlurImage
                            src={item.logoURL}
                            alt={item.caption}
                            width={48}
                            height={48}
                            className="w-16 h-16 object-cover rounded-md"
                        />
                    ) : null
                }
                <div className='w-full'>
                    <h2
                        className="w-full text-lg font-semibold overflow-hidden line-clamp-1"
                    >
                        {item.caption}
                    </h2>
                    <p className="w-full text-sm text-gray-600 line-clamp-2 overflow-hidden">
                        {item.description}
                    </p>
                </div>
            </div>

            <div className="mt-auto flex justify-between items-center">
                <div className="text-[14px] md:text-[16px] font-semibold text-secondary-black">
                    {formatMoney(item.price / 100)}
                </div>
                {quantity === 0 ? (
                    <OutlineButton
                        onClick={handleAdd}
                        className='rounded-md'
                        aria-label={`Add ${item.caption} to cart`}
                    >
                        Add
                    </OutlineButton>
                ) : (
                    <div className="flex items-center justify-between">
                        <OutlineButton
                            onClick={handleDecrement}
                            className="rounded-md min-w-[40px] !px-0"
                            aria-label={`Decrease quantity of ${item.caption}`}
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
                            disabled={quantity >= item.qoh}
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