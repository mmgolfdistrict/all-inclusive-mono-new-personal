import * as RadixSlider from "@radix-ui/react-slider";

export const SingleSlider = (props: RadixSlider.SliderProps) => {
  return (
    <form>
      <RadixSlider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        {...props}
      >
        <RadixSlider.Track className="relative h-[8px] grow rounded-full bg-stroke">
          <RadixSlider.Range className="absolute h-full rounded-full bg-primary" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block h-[20px] w-[20px] rounded-full border-2 border-white bg-primary shadow-md focus:outline-none"
          aria-label="value"
        />
      </RadixSlider.Root>
    </form>
  );
};
