import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { Tooltip } from "../tooltip";
import { Info } from "../icons/info";

export type SaleTypeOption = {
    value: string;
    caption: string;
    description: string;
    tooltip: string;
};

interface SaleTypeSelectorProps {
    value: string;
    onValueChange: (value: string) => void;
    className?: string;
    saleTypeOptions: SaleTypeOption[];
    defaultValue?: string;
    disabled?: boolean;
}

export const SaleTypeSelector: React.FC<SaleTypeSelectorProps> = ({
    value,
    onValueChange,
    className = "",
    saleTypeOptions,
    defaultValue = "",
    disabled = false,
}) => {
    const currentValue = saleTypeOptions.some(opt => opt.value === value) ? value : defaultValue;

    const handleValueChange = (newValue: string) => {
        if (newValue) {
            onValueChange(newValue);
        } else {
            onValueChange(currentValue);
        }
    };

    return (
        <div className={`${className} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`} >
            <ToggleGroup.Root
                type="single"
                value={currentValue}
                onValueChange={handleValueChange}
                defaultValue={defaultValue}
                aria-label="Sale Type Selection"
                className="flex flex-wrap gap-3"
                disabled={disabled}
            >
                {saleTypeOptions.map((option) => (
                    <ToggleGroup.Item
                        key={option.caption}
                        value={option.value}
                        aria-label={option.caption}
                        className={`
                            group relative
                            flex flex-col items-start justify-center gap-1
                            rounded-md border 
                            px-4 py-2 sm:px-5 sm:py-2.5
                            text-sm sm:text-base font-semibold
                            transition-all duration-150 ease-in-out
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 
                            border-primary bg-white text-primary
                            data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-white
                            w-full
                            ${disabled ? "cursor-not-allowed" : "cursor-pointer"}
                        `}
                        disabled={disabled}
                    >
                        <div className="flex items-center justify-center gap-1.5">
                            <span className="text-justify">{option.caption}</span>
                            <button
                                type="button"
                                onClick={(e) => e.stopPropagation()}
                                aria-label={`More info about ${option.caption}`}
                                className="flex rounded-full focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-1 focus-visible:ring-offset-current"
                                disabled={disabled}
                            >
                                <Tooltip
                                    trigger={<Info className={`h-[14px] w-[14px] ${disabled ? "cursor-not-allowed" : ""}`} />}
                                    content={<div className="max-w-[220px] text-sm break-words">{option.tooltip}</div>}
                                    isDisabled={disabled}
                                />
                            </button>
                        </div>
                        <div className="text-justify text-sm text-gray-600 dark:text-gray-400 group-data-[state=on]:text-white group-data-[state=on]:opacity-[75%]">
                            {option.description}
                        </div>
                    </ToggleGroup.Item>
                ))}
            </ToggleGroup.Root>
        </div>
    );
};