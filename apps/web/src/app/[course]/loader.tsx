import type { FC, ReactNode } from "react";
import React, { useEffect } from "react";

interface LoadingContainerProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
}

export const LoadingContainer: FC<LoadingContainerProps> = ({
  isLoading,
  loadingText,
  children,
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
      className=" inset-0 flex justify-center items-center bg-black bg-opacity-40"
      style={{ zIndex: isLoading ? 999 : -1, position: "fixed" }}
    >
      {isLoading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 200 200"
            style={{ width: "80px", height: "80px" }}
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
              style={{ transformOrigin: "center" }}
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
          <div>{loadingText}</div>
        </div>
      )}
      <div style={{ display: isLoading ? "none" : "block" }}>{children}</div>
    </div>
  );
};
