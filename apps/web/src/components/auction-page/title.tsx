export const Title = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="text-[24px] text-secondary-black md:text-[30px]">
        {title}
      </h1>
      <h2 className="text-[16px] text-primary-gray md:text-[20px]">
        {subtitle}
      </h2>
    </div>
  );
};
