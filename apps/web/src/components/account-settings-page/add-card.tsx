import { zodResolver } from "@hookform/resolvers/zod";
import * as ToggleGroup from "@radix-ui/react-toggle-group";
import { useUserContext } from "~/contexts/UserContext";
import {
  creditCardSchema,
  type CreditCardSchemaType,
} from "~/schema/credit-card-schema";
import { api } from "~/utils/api";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import {
  formatCreditCardNumber,
  formatExpirationDate,
} from "../../utils/credit-card-formatters";
import { FilledButton } from "../buttons/filled-button";
import { Input } from "../input/input";

const Options = ["debit", "credit"];
type OptionsType = "debit" | "credit";

export const AddCard = ({ refetchCards }: { refetchCards: () => unknown }) => {
  const { user } = useUserContext();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<CreditCardSchemaType>({
    // @ts-ignore
    resolver: zodResolver(creditCardSchema),
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [type, setType] = useState<OptionsType | "">("");

  const addCard = api.checkout.createPaymentMethod.useMutation();

  const onSubmit: SubmitHandler<CreditCardSchemaType> = async (data) => {
    const { cardNumber, expirationDate, type } = data;
    const cleanedCardNumber = cardNumber.replace(/\s/g, "");
    const expirationMonth = expirationDate.split("/")[0];
    const expirationYear = expirationDate.split("/")[1];
    const cardHolderName = data.cardHolderName;
    const paymentMethod = type;
    try {
      setIsLoading(true);
      await addCard.mutateAsync({
        params: {
          payment_method: "card",
          payment_method_type: paymentMethod,
          card: {
            card_number: cleanedCardNumber,
            card_exp_month: expirationMonth,
            card_exp_year: expirationYear,
            card_holder_name: cardHolderName,
            nick_name: user?.id ?? cardHolderName,
          },
          customer_id: user?.id,
        },
      });
      await refetchCards();
      reset();
      setIsLoading(false);
    } catch (error) {
      console.log(error);
      setIsLoading(false);
    }
  };

  return (
    <>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Card Holder Name"
          type="text"
          id="cardHolderName"
          placeholder="John Doe"
          name="cardHolderName"
          register={register}
          error={errors.cardHolderName?.message}
          required
        />
        <Input
          label="Card Number"
          type="tel"
          id="cardNumber"
          placeholder="1234 1234 1234 1234"
          name="cardNumber"
          register={register}
          error={errors.cardNumber?.message}
          pattern="[\d| ]{16,22}"
          required
          onChange={(e) => {
            const formatted = formatCreditCardNumber(e.target.value);
            setValue("cardNumber", formatted);
          }}
        />
        <div className="flex gap-2">
          <Input
            label="Expiry date (MM/YY)"
            type="tel"
            placeholder="12/25"
            id="expirationDate"
            name="expirationDate"
            pattern="\d\d/\d\d"
            register={register}
            error={errors.expirationDate?.message}
            className="w-full md:w-[49%]"
            required
            onChange={(e) => {
              const formatted = formatExpirationDate(e.target.value);
              setValue("expirationDate", formatted);
            }}
          />
        </div>
        <ToggleGroup.Root
          type="single"
          value={type}
          onValueChange={(p: OptionsType) => {
            if (p) {
              setType(p);
              setValue("type", p);
            }
          }}
          orientation="horizontal"
          className="mx-auto"
        >
          {Options.map((value, index) => (
            <Item
              key={index}
              value={value}
              className={`${
                index === 0
                  ? "rounded-l-full border-b border-l border-t border-stroke"
                  : index === Options.length - 1
                  ? "rounded-r-full border-b border-r border-t border-stroke"
                  : "border border-stroke"
              } px-[2.65rem]`}
            />
          ))}
        </ToggleGroup.Root>

        <FilledButton
          type="submit"
          disabled={isSubmitting || isLoading}
          className={`w-full rounded-full ${
            isLoading || isSubmitting ? "opacity-20" : "opacity-100"
          }`}
        >
          Add
        </FilledButton>
      </form>
    </>
  );
};

const Item = ({ value, className }: { value: string; className?: string }) => {
  return (
    <ToggleGroup.Item
      value={value}
      className={`bg-white capitalize px-4 py-2 text-left text-[14px] text-primary-gray transition-colors data-[state=on]:bg-primary data-[state=on]:text-white ${
        className ?? ""
      }`}
    >
      {value}
    </ToggleGroup.Item>
  );
};
