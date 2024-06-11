import { type ReactNode } from "react";
import "~/styles/globals.css";
import { ssrGetEntityByDomain } from "@golf-district/api";
import { Analytics } from "@vercel/analytics/react";
import { Club } from "~/components/icons/club";
import { GolfDistrict } from "~/components/icons/golf-district";
import { Layout } from "~/components/layout";
import { fontMapper } from "~/styles/fonts";
import { getNICDetails } from "~/utils/ipUtility";
import { type Metadata } from "next";
import { headers } from "next/headers";
import Providers from "./providers";

const title = "Golf District Platforms";
const description = "Golf District Platforms";
// const image = "https://vercel.pub/thumbnail.png";

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    // images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    // images: [image],
    creator: "@vercel",
  },
  metadataBase: new URL("https://vercel.pub"),
  icons: {
    icon: "/favicon.png",
  },
};

// export async function generateMetadata({
//   params,
// }: {
//   params: { domain: string };
// }): Promise<Metadata | null> {
//   const data = await getSiteData(params.domain);
//   if (!data) {
//     return null;
//   }
//   const {
//     name: title,
//     description,
//     image,
//     logo,
//   } = data as {
//     name: string;
//     description: string;
//     image: string;
//     logo: string;
//   };

//   return {
//     title,
//     description,
//     openGraph: {
//       title,
//       description,
//       images: [image],
//     },
//     twitter: {
//       card: "summary_large_image",
//       title,
//       description,
//       images: [image],
//       creator: "@vercel",
//     },
//     icons: [logo],
//     metadataBase: new URL(`https://${params.domain}`),
//   };
// }

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const host = headers().get("host");

  const domain = host?.split(":")?.[0]; //split on : to get localhost

  const domainDecoded = decodeURIComponent(domain!);

  const entityData = await ssrGetEntityByDomain(domainDecoded, "");

  const nicInfos = getNICDetails();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${
          fontMapper[entityData?.font ?? "font-inter"]
        } bg-gray-100`}
      >
        {!entityData?.id ? (
          <div className="flex items-center flex-col justify-center mt-20">
            <div className="text-center">
              <div className="container mx-auto flex flex-col items-center justify-center ">
                <div className="bg-white p-4 rounded-md shadow-md text-center border-gray-300 mb-10">
                  <Club className="w-[16px]" />
                </div>
                <div className="bg-white p-8 rounded-md shadow-md text-center w-90 ml-4 mr-4">
                  <div className="flex items-center mb-10 justify-center">
                    <GolfDistrict
                      className="w-[180px]"
                      id="powered-by-sidebar"
                      color="black"
                    />
                  </div>
                  <h1
                    className={`text-3xl mb-5 ${
                      fontMapper[entityData?.font ?? "font-inter"]
                    }`}
                  >
                    Facility not found
                  </h1>
                  <p
                    className={`${
                      fontMapper[entityData?.font ?? "font-inter"]
                    } text-md text-gray-800`}
                  >
                    You have reached a golf facility’s page that has
                  </p>
                  <p className="text-md text-gray-800">
                    not been configured yet.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Providers entityData={entityData}>
            <Layout>
              <Analytics />
              {children}
            </Layout>
          </Providers>
        )}
      </body>
    </html>
  );
}
