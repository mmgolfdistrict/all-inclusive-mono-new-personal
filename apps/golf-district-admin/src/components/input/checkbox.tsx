export const Checkbox = ({ label }: { label: string }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="checkbox"
        className="accent-primary w-5 h-5 cursor-pointer"
      />
      <p>{label}</p>
    </div>
  );
};
