"use client";

import { useState } from "react";
import placeholderIcon from "../../../public/placeholders/course-icon.png";
import { Avatar } from "../avatar";
import { OutlineButton } from "../buttons/outline-button";

export const TeeTimeHistory = () => {
  const [amount, setAmount] = useState<number>(4);

  const loadMore = () => {
    setAmount(amount + 4);
  };

  return (
    <div className="flex w-full flex-col gap-4 bg-white md:rounded-xl">
      <div className="stroke flex justify-between gap-4 border-b px-4 py-3 md:px-6 md:py-4">
        <div className="text-lg font-semibold">Tee Time History</div>
      </div>
      <div className="flex max-w-full flex-col gap-4 overflow-auto px-4 pb-2 text-[14px] md:px-6 md:pb-3">
        <table className="w-full table-auto">
          <thead className="top-0 table-header-group">
            <tr className="text-left">
              <TableHeader text="Course" />
              <TableHeader text="Date" className="text-right" />
            </tr>
          </thead>
          <tbody className="table-row-group max-h-[300px] w-full flex-col overflow-scroll">
            {Array(amount)
              .fill(null)
              .map((_, i) => (
                <TableRow
                  course={"Encinitas Ranch"}
                  date={"Sun Aug 20, 2023"}
                  iconSrc={placeholderIcon.src}
                  key={i}
                />
              ))}
          </tbody>
        </table>
        <OutlineButton className="mx-auto w-fit" onClick={loadMore}>
          Load more
        </OutlineButton>
      </div>
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
    <th className={`whitespace-nowrap px-4 ${className ?? ""}`}>{text}</th>
  );
};

const TableRow = ({
  iconSrc,
  date,
  course,
}: {
  course: string;
  date: string;
  iconSrc: string;
}) => {
  return (
    <tr className="w-full border-b border-stroke text-primary-gray">
      <td className="w-full gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Avatar src={iconSrc} />
          {course}
        </div>
      </td>
      <td className="whitespace-nowrap px-4 py-3">{date}</td>
    </tr>
  );
};
