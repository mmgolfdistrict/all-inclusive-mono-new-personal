import { isEqual } from "@golf-district/shared";
import { useCheckoutContext } from "~/contexts/CheckoutContext";
import { type SensibleDataToMountCompType } from "~/utils/types";
import React, { memo, useEffect, useState } from "react";
import { Spinner } from "../loading/spinner";

export const SensibleWidget = memo(
  ({
    sensibleDataToMountComp,
  }: {
    sensibleDataToMountComp: SensibleDataToMountCompType;
  }) => {
    const [sensibleFilesLoaded, setSensibleFilesLoaded] = useState({
      module: false,
      noModule: false,
      css: false,
    });
    const [isMounted, setIsMounted] = useState<boolean>(false);
    const [localData, setLocalData] = useState<SensibleDataToMountCompType>(
      sensibleDataToMountComp
    );
    const { handleShouldAddSensible, setSensibleData } = useCheckoutContext();

    useEffect(() => {
      const sensibleModuleScript = document.createElement("script");
      sensibleModuleScript.src =
        "https://static.sensibleweather.io/js-sdk/v1.10.2/build/sensible-sdk.esm.js";
      sensibleModuleScript.async = true;
      sensibleModuleScript.type = "module";
      document.body.appendChild(sensibleModuleScript);
      sensibleModuleScript.addEventListener("load", () => {
        setSensibleFilesLoaded((filesLoaded) => ({
          ...filesLoaded,
          module: true,
        }));
      });

      const sensibleNoModuleScript = document.createElement("script");
      sensibleNoModuleScript.src =
        "https://static.sensibleweather.io/js-sdk/v1.10.2/build/sensible-sdk.js";
      sensibleNoModuleScript.async = true;
      sensibleNoModuleScript.noModule = true;
      document.body.appendChild(sensibleNoModuleScript);
      sensibleNoModuleScript.addEventListener("load", () => {
        setSensibleFilesLoaded((filesLoaded) => ({
          ...filesLoaded,
          noModule: true,
        }));
      });

      const sensibleCssLink = document.createElement("link");
      sensibleCssLink.href =
        "https://static.sensibleweather.io/js-sdk/v1.10.2/assets/css/fonts.css";
      // @ts-ignore
      sensibleCssLink.async = true;
      sensibleCssLink.rel = "stylesheet";
      document.body.appendChild(sensibleCssLink);
      sensibleCssLink.addEventListener("load", () => {
        setSensibleFilesLoaded((filesLoaded) => ({
          ...filesLoaded,
          css: true,
        }));
      });
      return () => {
        document.body.removeChild(sensibleModuleScript);
        document.body.removeChild(sensibleNoModuleScript);
        document.body.removeChild(sensibleCssLink);
      };
    }, []);

    useEffect(() => {
      if (isNaN(sensibleDataToMountComp.exposureTotalCoverageAmount)) {
        return;
      }
      if (
        !(sensibleFilesLoaded.module || sensibleFilesLoaded.noModule) ||
        !sensibleFilesLoaded.css
      ) {
        return;
      }
      if (!isMounted || !isEqual(localData, sensibleDataToMountComp)) {
        // @ts-ignore
        if (process.env.NEXT_PUBLIC_SENSIBLE_IS_SENSIBLE_SANDBOX === "true") {
          // @ts-ignore
          Sensible.configure(
            sensibleDataToMountComp.partner_id,
            sensibleDataToMountComp.product_id,
            "sandbox"
          );
        } else {
          // @ts-ignore
          Sensible.configure(
            sensibleDataToMountComp.partner_id,
            sensibleDataToMountComp.product_id
          );
        }

        //@ts-ignore
        Sensible.createGuaranteeCallback = (quote) => {
          setSensibleData({
            id: quote.quoteData.id,
            price: quote.quoteData.pricePerDay,
          });
        };
        // @ts-ignore
        Sensible.mountComponent({
          coverageStartHourNumber:
            sensibleDataToMountComp.coverageStartHourNumber,
          coverageEndHourNumber: sensibleDataToMountComp.coverageEndHourNumber,
          coverageStartDate: sensibleDataToMountComp.coverageStartDate,
          coverageEndDate: sensibleDataToMountComp.coverageEndDate,
          currency: sensibleDataToMountComp.currency,
          exposureName: sensibleDataToMountComp.exposureName,
          exposureLatitude: sensibleDataToMountComp.exposureLatitude,
          exposureLongitude: sensibleDataToMountComp.exposureLongitude,
          exposureTotalCoverageAmount:
            sensibleDataToMountComp.exposureTotalCoverageAmount,
        });
        setIsMounted(true);
        setLocalData(sensibleDataToMountComp);
        // @ts-ignore
        // Sensible.setCreateGuaranteeCallback((quote) => {
        // });
        // @ts-ignore
        Sensible.setSelectGuaranteeCallback((quote) => {
          const quoteId = quote.quoteData.id;
          const price = quote.quoteData.totalPrice; //make an int
          setSensibleData({ id: quoteId, price });
          handleShouldAddSensible(true);
        });
        // @ts-ignore
        Sensible.setUnselectGuaranteeCallback(() => {
          setSensibleData(undefined);
          handleShouldAddSensible(false);
        });
      }
    }, [sensibleFilesLoaded, sensibleDataToMountComp, localData]);

    const sensibleFilesReady =
      (sensibleFilesLoaded.module || sensibleFilesLoaded.noModule) &&
      sensibleFilesLoaded.css;
    return (
      <>
        {sensibleFilesReady ? (
          // @ts-ignore
          <swui-theme>
            {/* @ts-ignore */}
            <sensible-weather-guarantee mounted="false" />
            {/* @ts-ignore */}
          </swui-theme>
        ) : (
          <div className="flex justify-center items-center h-full min-h-[200px]">
            <Spinner className="w-[50px] h-[50px]" />
          </div>
        )}
      </>
    );
  }
);

SensibleWidget.displayName = "SensibleWidget";
