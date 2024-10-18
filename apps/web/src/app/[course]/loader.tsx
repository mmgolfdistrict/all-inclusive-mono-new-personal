import type { FC, ReactNode } from "react";
import React, { useEffect } from "react";

interface LoadingContainerProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
  title?:string;
  subtitle?:string;
}

export const LoadingContainer: FC<LoadingContainerProps> = ({
  isLoading,
  loadingText,
  children,
  title,
  subtitle
  
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
      className=" inset-0 flex justify-center items-center bg-black bg-opacity-70"
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
              <stop offset="0" stopColor="#ffffff"></stop>
              <stop offset=".3" stopColor="#ffffff" stopOpacity=".9"></stop>
              <stop offset=".6" stopColor="#ffffff" stopOpacity=".6"></stop>
              <stop offset=".8" stopColor="#ffffff" stopOpacity=".3"></stop>
              <stop offset="1" stopColor="#ffffff" stopOpacity="0"></stop>
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
              stroke="#ffffff"
              strokeWidth="15"
              strokeLinecap="round"
              cx="100"
              cy="100"
              r="70"
            ></circle>
          </svg>
          <div
            style={{
              color: 'white',
              fontSize: '18px',
              textAlign: 'center',
              marginTop: '10px',
              lineHeight: '1.5',
            }}
          >
            <div className="text-xs md:text-xl">{title??loadingText}</div>
            {
              subtitle && <div className="text-xs md:text-xl">{subtitle}</div>
            }
            
          </div>
          
        </div>
      )}
      <div style={{ display: isLoading ? "none" : "block" }}>{children}</div>
    </div>
  );
};
