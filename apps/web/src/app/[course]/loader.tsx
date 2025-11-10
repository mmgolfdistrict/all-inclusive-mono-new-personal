import type { FC, ReactNode } from "react";
import React, { useEffect } from "react";

interface LoadingContainerProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export const LoadingContainer: FC<LoadingContainerProps> = ({
  isLoading,
  loadingText,
  children,
  title,
  subtitle,
}) => {
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isLoading]);

  return (
    <div
      className="inset-0 flex justify-center items-center bg-black bg-opacity-70"
      style={{ zIndex: isLoading ? 999 : -1, position: "fixed" }}
    >
      {isLoading && (
        <div
          data-testid="loading-container"
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            id="Logo-2"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            viewBox="0 0 646.72 644.67"
            style={{ width: "80px", height: "80px" }} // Adjust size as needed
          >
            <style>
              {`
                #c-1 {
                  animation-name: c-1; 
                  animation-duration: 5s;
                  animation-iteration-count: infinite;
                  animation-timing-function: ease-out;
                  stroke-dasharray: 2000;
                  stroke-dashoffset: 2000;
                }
                @keyframes c-1 {
                  0% { stroke-dashoffset: 2000; }
                  50% { stroke-dashoffset: 0; }
                  100% { stroke-dashoffset: 0; }
                }
                #c-2 {
                  animation-name: c-2; 
                  animation-duration: 5s;
                  animation-iteration-count: infinite;
                  animation-timing-function: ease-out;
                  stroke-dasharray: 1000;
                  stroke-dashoffset: 1000;
                }
                @keyframes c-2 {
                  0% { stroke-dashoffset: 1000; }
                  35% { stroke-dashoffset: 1000; }
                  70% { stroke-dashoffset: 0; }
                  100% { stroke-dashoffset: 0; }
                }
                #line {
                  animation-name: line-1; 
                  animation-duration: 5s;
                  animation-iteration-count: infinite;
                  animation-timing-function: ease-out;
                  stroke-dasharray: 1000;
                  stroke-dashoffset: 1000;
                }
                @keyframes line-1 {
                  0% { stroke-dashoffset: -1000; }
                  20% { stroke-dashoffset: -1000; }
                  60% { stroke-dashoffset: 0; }
                  100% { stroke-dashoffset: 0; }
                }
              `}
            </style>
            <defs>
              <clipPath id="clippath">
                <path
                  d="M320.04,639.49c-19.63,0-39.22-1.89-58.65-5.67-27.33-5.31-81.07-20.43-133.81-61.98-45.77-36.05-72.34-77.09-86.56-105.16-15.53-30.65-40.35-94.32-32.09-176.35,2.79-27.75,9.09-55.08,18.71-81.23,14.25-38.74,35.38-73.56,62.82-103.47,39.25-42.8,88.56-72.92,146.55-89.54,42.18-12.08,76.65-13.16,89.51-13.05,12.92.1,47.5,1.71,89.42,14.46,57.58,17.5,106.35,48.38,144.95,91.78,62.49,70.25,76.48,149.94,79.27,191.2,4.45,66.01-11.52,130.3-47.46,191.06-26.03,44.01-55.54,73.37-67.01,83.95l-39.31-42.64c17.5-16.14,104.38-102.98,95.91-228.47-2.28-33.85-13.73-99.21-64.73-156.55-72.71-81.74-172.28-86.64-191.5-86.79-19.24-.15-118.93,3.18-192.87,83.79-50.17,54.69-63.23,118.27-66.56,151.3-7.03,69.86,15.92,124.2,26.12,144.33,11.59,22.86,33.26,56.31,70.71,85.82,43.15,33.99,86.81,46.3,108.99,50.61,24.39,4.74,49.13,5.82,73.79,3.21l-.33-147.79h0c8.33,3.5,21.47,10.23,34.23,22.79.13.13.26.26.4.39,15.12,15.02,23.5,35.54,23.55,56.86l.21,92.56c.03,13.85-9.73,25.78-23.31,28.5-20.25,4.05-40.62,6.08-60.95,6.08Z"
                  style={{ fill: "none", strokeWidth: "0px" }}
                />
              </clipPath>
              <clipPath id="clippath-1">
                <path
                  d="M403.9,454.34c6.06-127.54,5.72-221.72-1.02-242.3-4.53-13.83-13.64-19.49-13.64-19.49-8.89-5.52-19.13-4.46-24.78-3.36-43.19,20.04-70.07,32.58-86.94,40.47-53.89,25.21-37.75,18.04-49.4,23.36-6.9,3.15-13.65,6.64-20.52,9.86-13.5,6.32-16.41,7.36-20.04,10.73-2.07,1.92-11.17,10.44-11.14,23.46.02,10.19,5.63,17.28,7.31,19.34,2.82,3.46,5.8,5.61,14.55,10.53,13.19,7.41,23.57,12.16,23.69,12.21,12.87,5.88,6.96,3.74,32.13,15.84,20.57,9.89,62.28,29.47,104.87,52.37,11.77,6.33,31.84,17.46,42.13,39.83,1.37,2.98,2.28,5.52,2.81,7.15Z"
                  style={{ fill: "none", strokeWidth: "0px" }}
                />
              </clipPath>
              <linearGradient
                id="linear-gradient"
                x1="139.39"
                y1="302.42"
                x2="487.13"
                y2="302.42"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0" stopColor="#ec4f52" />
                <stop offset=".7" stopColor="#a21e20" />
                <stop offset=".75" stopColor="#9c1a1c" />
              </linearGradient>
            </defs>
            <g style={{ clipPath: "url(#clippath)" }}>
              <g id="c-1">
                <path
                  d="M373,418.08c-.13,62.94-.26,125.87-.38,188.81-17.56,2.8-140.35,20.25-240.13-67.02C50.28,467.96,16.67,354,43.64,251.1,78.18,119.32,206.74,26.08,343.9,35.1c122.7,8.07,221.68,95.96,255.06,196.85,28.29,85.49,3.78,163.09-4.6,188.43-23.02,69.63-64.15,114.36-86.63,135.64"
                  style={{
                    fill: "none",
                    stroke: "#ffff",
                    strokeLinejoin: "round",
                    strokeWidth: "69px",
                  }}
                />
              </g>
            </g>
            <g style={{ clipPath: "url(#clippath-1)" }}>
              <g id="line">
                <line
                  x1="139.39"
                  y1="302.42"
                  x2="487.13"
                  y2="302.42"
                  style={{
                    fill: "#9c1a1c",
                    stroke: "url(#linear-gradient)",
                    strokeMiterlimit: "10",
                    strokeWidth: "311px",
                  }}
                />
              </g>
            </g>
            <g id="c-2">
              <polyline
                points="489.17 406.08 489.17 563.36 640.88 563.36"
                style={{
                  fill: "none",
                  stroke: "#ffff",
                  strokeLinejoin: "round",
                  strokeWidth: "60px",
                }}
              />
            </g>
          </svg>
          <div
            style={{
              color: "white",
              fontSize: "18px",
              textAlign: "center",
              marginTop: "10px",
              lineHeight: "1.5",
            }}
          >
            <div className="text-xs md:text-xl">{title ?? loadingText}</div>
            {subtitle && <div className="text-xs md:text-xl">{subtitle}</div>}
          </div>
        </div>
      )}
      <div style={{ display: isLoading ? "none" : "block" }}>{children}</div>
    </div>
  );
};
