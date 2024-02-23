"use client";

import { useState } from "react";
import placeholderIcon from "../../../public/placeholders/course-icon.png";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";

export const TransactionHistory = () => {
  const [amount, setAmount] = useState<number>(4);

  const loadMore = () => {
    setAmount(amount + 4);
  };

  return (
    <div className="relative flex max-w-full flex-col gap-4  overflow-auto pb-2  text-[14px] md:pb-3">
      <table className="w-full table-auto">
        <thead className="top-0 table-header-group">
          <tr className="text-left">
            <TableHeader text="Transaction" />
            <TableHeader text="Date" className="text-right" />
            <TableHeader text="Course" className="text-right" />
            <TableHeader text="Confirmation" className="text-right" />
            <TableHeader text="Amount" className="text-right" />
          </tr>
        </thead>
        <tbody className="table-row-group max-h-[300px] w-full flex-col overflow-scroll">
          {Array(amount)
            .fill(null)
            .map((_, i) => (
              <TableRow
                course={"Encinitas Ranch"}
                transaction={"Encinitas Ranch"}
                date={"Sun Aug 20, 2023"}
                iconSrc={placeholderIcon.src}
                key={i}
                type="Purchase"
                confirmationId={"123-456-789"}
                amount={"$100.00"}
              />
            ))}
        </tbody>
      </table>
      <OutlineButton
        className="sticky left-1/2 mx-auto w-fit -translate-x-1/2"
        onClick={loadMore}
        data-testid="load-more-button-id"
      >
        Load more
      </OutlineButton>
    </div>
  );
};

const TableHeader = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <th className={`whitespace-nowrap px-4 font-semibold ${className ?? ""}`}>
      {text}
    </th>
  );
};

const TableRow = ({
  iconSrc,
  date,
  course,
  type,
  transaction,
  confirmationId,
  amount,
}: {
  course: string;
  date: string;
  iconSrc: string;
  transaction: string;
  type: string;
  confirmationId: string;
  amount: string;
}) => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="w-full gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar src={iconSrc} />
          <div className="flex flex-col">
            <div className="whitespace-nowrap text-secondary-black">
              {transaction}
            </div>
            <div className="text-primary-gray">{type}</div>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">{date}</td>
      <td className="whitespace-nowrap px-4 py-3">{course}</td>
      <td className="whitespace-nowrap px-4 py-3">{confirmationId}</td>
      <td className="whitespace-nowrap px-4 py-3">{amount}</td>
    </tr>
  );
};
