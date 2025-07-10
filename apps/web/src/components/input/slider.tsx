import * as RadixSlider from "@radix-ui/react-slider";

export const Slider = (props: RadixSlider.SliderProps) => {
  return (
    <form>
      <RadixSlider.Root
        className="relative flex h-5 w-full touch-none select-none items-center"
        minStepsBetweenThumbs={1}
        {...props}
      >
        <RadixSlider.Track className="relative h-[0.5rem] grow rounded-full bg-stroke">
          <RadixSlider.Range className="absolute h-full rounded-full bg-primary" />
        </RadixSlider.Track>
        <RadixSlider.Thumb
          className="block h-[1.25rem] w-[1.25rem] rounded-full border-2 border-white bg-primary shadow-md focus:outline-none"
          aria-label="min"
        />
        <RadixSlider.Thumb
          className="block h-[1.25rem] w-[1.25rem] rounded-full border-2 border-white bg-primary shadow-md focus:outline-none"
          aria-label="min"
        />
      </RadixSlider.Root>
    </form>
  );
};
