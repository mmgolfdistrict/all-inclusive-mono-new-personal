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

// export async function generateStaticParams() {
//   const [subdomains, customDomains] = await Promise.all([
//     prisma.site.findMany({
//       select: {
//         subdomain: true,
//       },
//     }),
//     prisma.site.findMany({
//       where: {
//         NOT: {
//           customDomain: null,
//         },
//       },
//       select: {
//         customDomain: true,
//       },
//     }),
//   ]);

//   const allPaths = [
//     ...subdomains.map(({ subdomain }) => subdomain),
//     ...customDomains.map(({ customDomain }) => customDomain),
//   ].filter((path) => path) as Array<string>;

//   return allPaths.map((domain) => ({
//     params: {
//       domain,
//     },
//   }));
// }

// export async function generateStaticParams() {
//   return await ssrGetStaticPaths();
// }

export const dynamic = "force-dynamic";

export default async function RootLayout({
  params,
  children,
}: {
  params: { domain: string };
  children: ReactNode;
}) {
  // console.log("params", params);
  // const host = headers().get("host");
  // const origin = headers().values();
  // console.log("origin", origin);
  // const domain = host?.split(":")[0];

  // const domain1 = decodeURIComponent(host);
  // console.log("host", host);
  // console.log("domain1", domain1);
  // // const { domain } = params;
  // // console.log("domain", domain);
  // // const data = await getSiteData(domain);
  // const data = await ssrGetEntityByDomain("localhost", "");
  // console.log(data);

  // if (!data) {
  //   notFound();
  // }

  // // Optional: Redirect to custom domain if it exists
  // if (
  //   domain.endsWith(`.${process.env.NEXT_PUBLIC_ROOT_DOMAIN}`) &&
  //   data.customDomain &&
  //   process.env.REDIRECT_TO_CUSTOM_DOMAIN_IF_EXISTS === "true"
  // ) {
  //   return redirect(`https://${data.customDomain}`);
  // }

  const entityData = await ssrGetEntityByDomain("localhost", "");

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
