import React, { FC, ReactNode, useEffect } from "react";

interface LoadingContainerProps {
  isLoading: boolean;
  children: ReactNode;
}

export const LoadingContainer: FC<LoadingContainerProps> = ({
  isLoading,
  children,
}) => {
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [isLoading]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex  justify-center bg-black bg-opacity-40 z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            style={{     width: '80px',
                position: 'fixed',
                top: '50%',
                left: '50%',
                marginTop: '-40px',
                marginLeft: '-40px' }}
          >
            <radialGradient
              id="a9"
              cx=".66"
              fx=".66"
              cy=".3125"
              fy=".3125"
              gradientTransform="scale(1.5)"
            >
              <stop offset="0" stopColor="#225816"></stop>
              <stop offset=".3" stopColor="#225816" stopOpacity=".9"></stop>
              <stop offset=".6" stopColor="#225816" stopOpacity=".6"></stop>
              <stop offset=".8" stopColor="#225816" stopOpacity=".3"></stop>
              <stop offset="1" stopColor="#225816" stopOpacity="0"></stop>
            </radialGradient>
            <circle
              fill="none"
              stroke="url(#a9)"
              strokeWidth="15"
              strokeLinecap="round"
              strokeDasharray="200 1000"
              strokeDashoffset="0"
              cx="100"
              cy="100"
              r="70"
              style={{ transformOrigin: 'center' }}
            >
              <animateTransform
                type="rotate"
                attributeName="transform"
                calcMode="spline"
                dur="2"
                values="360;0"
                keyTimes="0;1"
                keySplines="0 0 1 1"
                repeatCount="indefinite"
              ></animateTransform>
            </circle>
            <circle
               style={{ transformOrigin: 'center' }}
              fill="none"
              opacity=".2"
              stroke="#225816"
              strokeWidth="15"
              strokeLinecap="round"
              cx="100"
              cy="100"
              r="70"
            ></circle>
          </svg>
            </div>
      )}
      {children}
    </div>
  );
};
