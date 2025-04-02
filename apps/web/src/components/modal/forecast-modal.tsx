import { useCourseContext } from "~/contexts/CourseContext";
import { api } from "~/utils/api";
import { useEffect, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { Close } from "../icons/close";
import HeatmapChart from "../charts/heatmapChart";
import dayjs from "dayjs";

interface Props {
  closeForecastModal: () => void;
  startDate: string;
  endDate: string;
}

const dayMonthDate = (date: string): string => {
  const cleanTimeString = !date.includes("T")
    ? date.replace(" ", "T") + "Z"
    : date;
  return dayjs.utc(cleanTimeString).format("ddd MMM D");
};

export const ForecastModal = ({
  closeForecastModal,
  startDate: propStartDate,
  endDate: propEndDate, 
}: Props) => {
  const { course } = useCourseContext();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [startDate, setStartDate] = useState<string>(propStartDate);
  const [endDate, setEndDate] = useState<string>(propEndDate);
  const [dateIndex, setDateIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("dates");

  useEffect(() => {
    setStartDate(formatDate(propStartDate));
    setEndDate(formatDate(propEndDate));
  }, []);

  const { data, isLoading } = api.searchRouter.getPriceForecast.useQuery({
    courseId: course?.id ?? "",
    startDate,
    endDate,
  });
  
  const formatDate = (date: Date | string): string => {
    return dayjs(date).format('YYYY-MM-DD');
  };

  // Define number of dates to show
  const numDatesToShow = isMobile ? 2 : 7;
  const totalDates = data?.length ?? 0;

  // Slice data for pagination
  const paginatedData =
    data?.slice(dateIndex, dateIndex + numDatesToShow) || [];

  const handleNext = () => {
    if (dateIndex + numDatesToShow < totalDates) {
      setDateIndex((prev) => prev + numDatesToShow);
    }
  };

  const handlePrevious = () => {
    if (dateIndex - numDatesToShow >= 0) {
      setDateIndex((prev) => prev - numDatesToShow);
    }
  };

  const handleTabClick = (tab : string) => {
    setActiveTab(tab);
  };

  const forecastingTableHeight = document?.getElementById('forecasting-table')?.offsetHeight

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black w-screen backdrop-blur bg-opacity-50 overflow-hidden">
      <div
        className={`bg-white p-6 rounded-lg sm:max-w-4xl md:max-w-3xl lg:max-w-2xl xl:max-w-5xl w-full ${isMobile && "w-full"
          }`}
      >
        <div className="flex items-center pb-3 relative">
          <h3 className="text-lg font-semibold mx-auto">Price Forecasting</h3>
          <button onClick={closeForecastModal} className="text-xl">
            <Close className="h-[25px] w-[25px]" />
          </button>
        </div>
        <div className="flex gap-3 border-b mb-1 items-center">
          <button
            className={`cursor-pointer py-2 px-4 text-center border-b-2 ${activeTab === "dates" ? "border-[#40942B] text-[#40942B]" : "border-transparent text-gray-500"
              } hover:border-[#40942B] hover:text-[#40942B] transition-colors`}
            onClick={() => handleTabClick("dates")}
          >
            Dates
          </button>
          <button
            className={`cursor-pointer py-2 px-4 text-center border-b-2 ${activeTab === "graph" ? "border-[#40942B] text-[#40942B]" : "border-transparent text-gray-500"
              } hover:border-[#40942B] hover:text-[#40942B] transition-colors`}
            onClick={() => handleTabClick("graph")}
          >
            Graph
          </button>
        </div>
        <div>
        <div className="flex justify-between items-center">
              <div className="flex justify-between items-center mb-2 w-[170px]">
                <button
                  className="text-sm font-medium hover:underline"
                  onClick={handlePrevious}
                  disabled={dateIndex === 0}
                >
                  &lt; Previous
                </button>
                <button
                  className="text-sm font-medium hover:underline"
                  onClick={handleNext}
                  disabled={dateIndex + numDatesToShow >= totalDates}
                >
                  Next &gt;
                </button>
              </div>
            </div>
          {activeTab === "dates" ?
            <div id="forecasting-table" className="mt-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="top-0 table-header-group bg-gray-200">
                  <tr className="text-left">
                    {isLoading ? (
                      ""
                    ) : paginatedData.length === 0 ? (
                      ""
                    ) : (
                      <TableHeader text="Dates / Times" />
                    )}
                    {paginatedData.map((item) => (
                      <TableHeader
                        key={item.providerDate}
                        text={dayMonthDate(item.providerDate)}
                        className="text-center"
                      />
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <SkeletonRow key={index} isMobile={isMobile} />
                      ))
                  ) : paginatedData.length === 0 ? (
                    <div className={`${isMobile ? "py-36" : "p-36"} text-center`}>
                      Data is not available for {dayMonthDate(startDate)} -{" "}
                      {dayMonthDate(endDate)}
                    </div>
                  ) : (
                    <>
                      <tr className="border-b border-stroke text-primary-gray">
                        <td className="px-4 py-2 font-semibold bg-gray-200">
                          <p className="text-secondary-black">Early Morning</p>{" "}
                          06:00 AM – 08:00 AM
                        </td>
                        {paginatedData?.map((item) => (
                          <td
                            key={item.providerDate}
                            className="px-4 py-2 text-center"
                          >
                            {item.MidMorning != null && item.MidMorning >= 0
                              ? `$${item.MidMorning.toFixed(2)}`
                              : "-"}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-stroke text-primary-gray">
                        <td className="px-4 py-2 font-semibold bg-gray-200">
                          <p className="text-secondary-black">Mid-Morning</p> 08:00
                          AM – 10:30 AM
                        </td>
                        {paginatedData?.map((item) => (
                          <td
                            key={item.providerDate}
                            className="px-4 py-2 text-center"
                          >
                            {item.MidMorning != null && item.MidMorning >= 0
                              ? `$${item.MidMorning.toFixed(2)}`
                              : "-"}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-stroke text-primary-gray">
                        <td className="px-4 py-2 font-semibold bg-gray-200">
                          <p className="text-secondary-black">Early Afternoon</p>{" "}
                          10:30 AM – 02:00 PM
                        </td>
                        {paginatedData?.map((item) => (
                          <td
                            key={item.providerDate}
                            className="px-4 py-2 text-center"
                          >
                            {item.EarlyAfternoon != null && item.EarlyAfternoon >= 0
                              ? `$${item.EarlyAfternoon.toFixed(2)}`
                              : "-"}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-stroke text-primary-gray">
                        <td className="px-4 py-2 font-semibold bg-gray-200">
                          <p className="text-secondary-black">Afternoon</p> 02:00 PM
                          – 04:00 PM
                        </td>
                        {paginatedData?.map((item) => (
                          <td
                            key={item.providerDate}
                            className="px-4 py-2 text-center"
                          >
                            {item.Afternoon != null && item.Afternoon >= 0
                              ? `$${item.Afternoon.toFixed(2)}`
                              : "-"}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b border-stroke text-primary-gray pr-1">
                        <td className="px-4 py-2 font-semibold bg-gray-200">
                          <p className="text-secondary-black">Twilight</p> 04:00 PM
                          – 06:00 PM
                        </td>
                        {paginatedData?.map((item) => (
                          <td
                            key={item.providerDate}
                            className="px-4 py-2 text-center"
                          >
                            {item.Twilight != null && item.Twilight >= 0
                              ? `$${item.Twilight.toFixed(2)}`
                              : "-"}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            :
            <div className={ `${isMobile ? `h-[${forecastingTableHeight}]` : 'h-[323px]'}`}>
              {isLoading ? (
                <div className="text-center">Loading...</div>
              ) : data && data.length > 0 ? (
                <HeatmapChart data={paginatedData} fullData={data}/>
              ) : (
                <div className="text-center">No data available for the selected dates.</div>
              )}
            </div>
          }
        </div>
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
}) => (
  <th className={`whitespace-nowrap px-4 font-semibold ${className ?? ""}`}>
    {text}
  </th>
);

const SkeletonRow = ({ isMobile }) => (
  <tr className="w-full border-b border-stroke text-primary-gray animate-pulse">
    <td className="px-4 py-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-2">
          <div className="h-4 w-28 bg-gray-200 rounded-md"></div>
          <div className="h-3 w-22 bg-gray-200 rounded-md"></div>
          {isMobile ? (
            <div className="h-4 w-22 bg-gray-200 rounded-md"></div>
          ) : (
            ""
          )}
        </div>
      </div>
    </td>
    {Array(7)
      .fill(0)
      .map((_, index) => (
        <td key={index} className="px-4 py-3">
          <div className="h-5 w-24 bg-gray-200 rounded-md"></div>
        </td>
      ))}
  </tr>
);
