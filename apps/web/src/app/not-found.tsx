import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center flex-col justify-center mt-20">
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/" className="underline">
        Return Home
      </Link>
    </div>
  );
}
