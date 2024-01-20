export const TableHeader = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  return (
    <th
      className={`whitespace-nowrap text-primary-gray text-[10px] font-semibold pb-2 uppercase ${
        className ?? ""
      }`}
    >
      {text}
    </th>
  );
};
