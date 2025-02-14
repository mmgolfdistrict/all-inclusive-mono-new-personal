import * as RadixSlider from "@radix-ui/react-slider";

interface SingleSliderProps extends RadixSlider.SliderProps {
  shouldDisplayValue?: boolean;
}

export const SingleSlider = (props: SingleSliderProps) => {
  const { shouldDisplayValue, ...restProps } = props;
  const { value } = restProps;

  return (
    <form>
      <RadixSlider.Root
        className={`relative flex h-5 w-full touch-none select-none items-center ${shouldDisplayValue ? "pt-8" : ""}`}
        {...restProps}
      >
        <RadixSlider.Track className="relative h-[8px] grow rounded-full bg-stroke">
          <RadixSlider.Range className="absolute h-full rounded-full bg-primary" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block h-[20px] w-[20px] rounded-full border-2 border-white bg-primary shadow-md focus:outline-none"
          aria-label="value"
        >
          {shouldDisplayValue ? <div className="absolute -top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {value ? value[0] : ""}
          </div>
            : null
          }
        </RadixSlider.Thumb>
      </RadixSlider.Root>
    </form>
  );
};
