import type { CartProduct, MerchandiseWithTaxOverride } from '~/utils/types';

export interface CalculationInput {
    cartData: CartProduct[];
    amountOfPlayers: number;
    validatedPlayersCount: number;
    roundUpCharityId?: string;
    donateValue: number;
    supportsSellingMerchandise: boolean;
}

export const calculateCheckoutTotals = ({
    cartData,
    amountOfPlayers,
    validatedPlayersCount,
    roundUpCharityId,
    donateValue,
    supportsSellingMerchandise,
}: CalculationInput) => {
    let primaryGreenFeeCharge = 0;

    const isFirstHand = cartData?.filter(
        ({ product_data }) => product_data.metadata.type === "first_hand"
    );
    if (isFirstHand.length) {
        primaryGreenFeeCharge =
            isFirstHand?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    } else {
        primaryGreenFeeCharge =
            cartData
                ?.filter(
                    ({ product_data }) => product_data.metadata.type === "second_hand"
                )
                ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    }
    const isFirstHandGroup = cartData?.filter(
        ({ product_data }) => product_data.metadata.type === "first_hand_group"
    );
    if (isFirstHandGroup.length) {
        primaryGreenFeeCharge =
            isFirstHandGroup?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    }

    const convenienceCharge =
        cartData
            ?.filter(
                ({ product_data }) => product_data.metadata.type === "convenience_fee"
            )
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    let taxCharge =
        cartData
            ?.filter(({ product_data }) => product_data.metadata.type === "taxes")
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

    const sensibleCharge =
        cartData
            ?.filter(({ product_data }) => product_data.metadata.type === "sensible")
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

    const charityCharge =
        cartData
            ?.filter(({ product_data }) => product_data.metadata.type === "charity")
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    const cartFeeCharge =
        cartData
            ?.filter(({ product_data }) => product_data.metadata.type === "cart_fee")
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

    const merchandiseCharge =
        (cartData
            ?.filter(({ product_data }) => product_data.metadata.type === "merchandise")
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100);

    const merchandiseWithTaxOverrideCharge = (cartData
        ?.filter(({ product_data }) => product_data.metadata.type === "merchandiseWithTaxOverride")
        ?.reduce((acc: number, i) => acc + (i.product_data.metadata as unknown as MerchandiseWithTaxOverride).priceWithoutTax, 0) / 100) || 0;

    const merchandiseTotalCharge = merchandiseCharge + merchandiseWithTaxOverrideCharge;

    const greenFeeTaxPercent =
        cartData
            ?.filter(
                ({ product_data }) =>
                    product_data.metadata.type === "greenFeeTaxPercent"
            )
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    const cartFeeTaxPercent =
        cartData
            ?.filter(
                ({ product_data }) => product_data.metadata.type === "cartFeeTaxPercent"
            )
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    const weatherGuaranteeTaxPercent =
        cartData
            ?.filter(
                ({ product_data }) =>
                    product_data.metadata.type === "weatherGuaranteeTaxPercent"
            )
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;
    const markupFee =
        cartData
            ?.filter(({ product_data }) => product_data.metadata.type === "markup")
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

    const markupTaxPercent =
        cartData
            ?.filter(
                ({ product_data }) => product_data.metadata.type === "markupTaxPercent"
            )
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

    const merchandiseTaxPercent =
        cartData
            ?.filter(
                ({ product_data }) => product_data.metadata.type === "merchandiseTaxPercent"
            )
            ?.reduce((acc: number, i) => acc + i.price, 0) / 100;

    const merchandiseOverriddenTaxCharge = (cartData
        ?.filter(({ product_data }) => product_data.metadata.type === "merchandiseWithTaxOverride")
        ?.reduce((acc: number, i) => acc + (i.product_data.metadata as unknown as MerchandiseWithTaxOverride).taxAmount, 0)) ?? 0;

    const playersInNumber = Number(amountOfPlayers - validatedPlayersCount || 0);
    const greenFeeChargePerPlayer =
        playersInNumber && playersInNumber > 0
            ? primaryGreenFeeCharge / playersInNumber - cartFeeCharge - markupFee
            : 0;
    const greenFeeTaxAmount =
        greenFeeChargePerPlayer * greenFeeTaxPercent * playersInNumber;
    const cartFeeTaxAmount = cartFeeCharge * cartFeeTaxPercent * playersInNumber;
    const markupFeesTaxAmount = markupFee * markupTaxPercent * playersInNumber;
    const weatherGuaranteeTaxAmount = sensibleCharge * weatherGuaranteeTaxPercent;
    const merchandiseTaxAmount = (merchandiseCharge * merchandiseTaxPercent) + merchandiseOverriddenTaxCharge;

    const additionalTaxes =
        (greenFeeTaxAmount +
            markupFeesTaxAmount +
            weatherGuaranteeTaxAmount +
            cartFeeTaxAmount +
            merchandiseTaxAmount) /
        100;
    taxCharge += additionalTaxes;
    taxCharge = Math.ceil(taxCharge * 100) / 100;
    let Total =
        primaryGreenFeeCharge +
        taxCharge +
        sensibleCharge +
        (!roundUpCharityId ? charityCharge : 0) +
        convenienceCharge +
        (!roundUpCharityId ? 0 : Number(donateValue)) +
        (!supportsSellingMerchandise ? 0 : (merchandiseTotalCharge));

    let totalCeil = Math.ceil(Total * 100);
    if (Total * 100 - Math.round(Total * 100) < 0.0000001) {
        totalCeil = Math.round(Total * 100)
    }
    if ((Total - Number(Total.toFixed(2))) < 0.001 && (Total - Number(Total.toFixed(2))) > 0) {
        Total = Number(Total.toFixed(2))
        totalCeil = Math.round(Total * 100);
    }

    const TotalAmt = (totalCeil / 100).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    const totalGreenFeesPerPlayer =
        (greenFeeChargePerPlayer + markupFee) * playersInNumber;
    const totalCartFeePerPlayer = cartFeeCharge * playersInNumber;
    const TaxCharge =
        taxCharge +
        sensibleCharge +
        (!roundUpCharityId ? charityCharge : 0) +
        convenienceCharge;
    const totalBeforeRoundOff = Math.ceil((primaryGreenFeeCharge + TaxCharge + merchandiseTotalCharge) * 100) / 100;
    const decimalPart = Number((totalBeforeRoundOff % 1).toFixed(2));
    const subTotal = primaryGreenFeeCharge +
        (!supportsSellingMerchandise ? 0 : (merchandiseTotalCharge));

    return {
        Total,
        TotalAmt,
        subTotal,
        taxCharge,
        totalGreenFeesPerPlayer,
        totalCartFeePerPlayer,
        totalBeforeRoundOff,
        decimalPart,
        TaxCharge,
        primaryGreenFeeCharge,
        merchandiseTotalCharge,
        playersInNumber,
        greenFeeChargePerPlayer,
        markupFee,
        cartFeeCharge,
        sensibleCharge,
        greenFeeTaxPercent,
        cartFeeTaxPercent,
        weatherGuaranteeTaxPercent,
        merchandiseTaxPercent,
        greenFeeTaxAmount,
        cartFeeTaxAmount,
        markupFeesTaxAmount,
        weatherGuaranteeTaxAmount,
        merchandiseTaxAmount,
        markupTaxPercent,
        convenienceCharge
    };
}; 