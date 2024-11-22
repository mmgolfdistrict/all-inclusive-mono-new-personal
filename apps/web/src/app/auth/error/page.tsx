"use client";

// Make sure to mark this as a client component if using React hooks.
import { Facebook } from "~/components/icons/facebook";
import { useSearchParams } from "next/navigation";

const AuthErrorPage = () => {
  const searchParams = useSearchParams(); // Hook to access query parameters
  const error = searchParams.get("error"); // Get the error code from the query string
  const provider = searchParams.get("provider") || "";
  return (
    <div className="flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg">
        <div className="text-center">
          <h1 className="text-7xl font-bold text-red-500">Golf district</h1>
          <h2 className="mt-4 text-2xl font-semibold text-gray-800">
            Error Occurred While Sign In with Provider
          </h2>
          <p className="mt-2 text-gray-600">Provider: {provider}</p>
          <p>
            Reason : Sorry you are not sign in you need to provide consent to
            email
          </p>
          <div className="mt-6">
            <a
              href="/"
              className="inline-block px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
            >
              Go Back Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorPage;
