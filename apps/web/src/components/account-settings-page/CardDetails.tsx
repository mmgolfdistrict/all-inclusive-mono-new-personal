import React from 'react';
import { Trashcan } from '../icons/trashcan';

interface CardDetailsProps {
  label: string;
  value: string;
  onRemove?: () => void;
}

const CardDetails: React.FC<CardDetailsProps> = ({ label, value, onRemove }) => (
  <div className="flex flex-col relative justify-between ">
    <div className="flex items-start flex-col gap-1">
      <div className="font-[500] text-md">{label}</div>
      <div className="text-sm">{value}</div>
    </div>
    {onRemove && (
      <div className="flex w-full justify-end items-end absolute bottom-0">
        <button onClick={onRemove} className="border border-alert-red px-3 rounded-md">
          <Trashcan fill="#EE2020" className="w-[20px] h-[20px]" />
        </button>
      </div>
    )}
  </div>
);

export default CardDetails;
