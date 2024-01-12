// import Image from "next/image";
// import Link from "next/link";

// import prisma from "@/lib/prisma";
// import CTA from "@/components/cta";
// import ReportAbuse from "@/components/report-abuse";
// import { notFound, redirect } from "next/navigation";
// import { getSiteData } from "@/lib/fetchers";
// import { fontMapper } from "@/styles/fonts";
// import { Metadata } from "next";
import { type ReactNode } from "react";
import "~/styles/globals.css";
import { ssrGetEntityByDomain, ssrGetStaticPaths } from "@golf-district/api";
import { Layout } from "~/components/layout";
import { fontMapper } from "~/styles/fonts";
import { type Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
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

  if (!domain) {
    notFound();
  }

  const domainDecoded = decodeURIComponent(domain);

  const entityData = await ssrGetEntityByDomain(domainDecoded, "");

  if (!entityData) {
    notFound();
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${
          fontMapper[entityData?.font ?? "font-inter"]
        } bg-secondary-white`}
      >
        <Providers entityData={entityData}>
          <Layout>{children}</Layout>
        </Providers>
      </body>
    </html>
  );
}
