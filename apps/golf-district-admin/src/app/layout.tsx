import { Layout } from "~/components/layout";
import { fontMapper } from "~/styles/fonts";
import "~/styles/globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${fontMapper["font-lexend"]} text-secondary-black`}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
