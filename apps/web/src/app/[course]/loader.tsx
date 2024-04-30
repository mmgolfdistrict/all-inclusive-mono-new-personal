import React, { type FC, type ReactNode } from "react";

interface LoadingContainerProps {
  isLoading: boolean;
  children: ReactNode;
}

export const LoadingContainer: FC<LoadingContainerProps> = ({
  isLoading,
  children,
}) => {
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 z-10 rounded-md">
          {/* SVG loader */}
          <svg
            className="animate-spin h-10 w-10 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-80"
              cx="12"
              cy="12"
              r="10"
              stroke="#000000" // Set stroke color to #40942b
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="#000000" // Set fill color to #40942b
              d="M4 12a8 8 0 018-8V2.83a1 1 0 00-1.7-.71l-4.58 4.59a1 1 0 000 1.42l4.58 4.59a1 1 0 101.42-1.42L11 7.41V4a1 1 0 00-2 0v4a1 1 0 001 1z"
            ></path>
          </svg>
        </div>
      )}
      {children}
    </div>
  );
};
