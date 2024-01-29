import { useEffect, useState } from "react";

export const useElementByIdDimensions = (elementId: string) => {
  const [dimensions, setDimensions] = useState<{
    width: number;
    height: number;
  }>({ width: 0, height: 0 });

  useEffect(() => {
    const getElementDimensions = () => {
      const element = document.getElementById(elementId);

      if (element) {
        const rect = element.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    // Call the function initially
    getElementDimensions();

    // Add event listener for window resize
    window.addEventListener("resize", getElementDimensions);

    // Cleanup the event listener on component unmount
    return () => {
      window.removeEventListener("resize", getElementDimensions);
    };
  }, [elementId]);

  return dimensions;
};
