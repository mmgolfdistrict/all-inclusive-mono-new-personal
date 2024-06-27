import { Dispatch, SetStateAction } from "react";
import { useSidebar } from "~/hooks/useSidebar";
import { Close } from "../icons/close";
import { TableCell, TableRow } from "@mui/material";
import { formatMoney, formatTime } from "@golf-district/shared";
import { OutlineButton } from "../buttons/outline-button";
import { TxnHistoryType } from "./transaction-history";

type BookingDetailsProps = {
	isReceiptOpen: boolean;
	setIsReceiptOpen: Dispatch<SetStateAction<boolean>>;
	selectedReceipt: TxnHistoryType | null;
};

export const BookingDetails = ({
	isReceiptOpen,
	setIsReceiptOpen,
	selectedReceipt
}: BookingDetailsProps) => {

	const { toggleSidebar } = useSidebar({
		isOpen: isReceiptOpen,
		setIsOpen: setIsReceiptOpen,
	});

	return (
		<>
			{isReceiptOpen && (
				<div
					className={`fixed left-0 top-0 z-20 h-[100dvh] w-screen backdrop-blur `}
				>
					<div className="h-screen bg-[#00000099]" />
				</div>
			)}
			<aside
				className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${isReceiptOpen ? "translate-x-0" : "translate-x-full"
					}`}
			>
				<div className="relative flex h-full flex-col">
					<div className="flex items-center justify-between p-4">
						<div className="text-lg">Booking Receipt</div>
						<button
							onClick={toggleSidebar}
							aria-controls="sidebar"
							aria-expanded={isReceiptOpen}
							className="z-[2]"
							aria-label="sidebarToggle"
							data-testid="close-button-id"
						>
							<Close className="h-[25px] w-[25px]" />
						</button>
					</div>
					<div className="flex h-full flex-col justify-between overflow-y-auto p-4">
						{/* <div className="border-2 p-4 shadow-lg border-gray-500 w-full"> */}
						{/* <div className="relative flex items-center">
								<BlurImage
									alt="golf district logo"
									src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/${isMobile ? "mobileheaderlogo.png" : "desktopheaderlogo.png"
										}`}
									width={`${isMobile ? "157" : "157"}`}
									height={`${isMobile ? "39" : "39"}`}
								/>
								<div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform`}>
									<Link href="/" data-testid="course-logo-id">
										<BlurImage
											src={course?.logo ?? ""}
											alt="course logo"
											width={60}
											height={100}
											className="w-[50px] object-fit"
										/>
									</Link>
								</div>
							</div> */}
						<table border={0} cellPadding={0} cellSpacing={0} width="100%">
							<TableRow>
								<TableCell sx={{ borderBottom: "none" }} className="font-[300] text-primary-gray" width="50%">Play Date Time: </TableCell>
								<TableCell sx={{ borderBottom: "none" }} className="text-secondary-black" width="50%">{selectedReceipt?.date ? formatTime(selectedReceipt?.date) : "-"}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell sx={{ borderBottom: "none" }} className="font-[300] text-primary-gray" width="50%">Players: </TableCell>
								<TableCell sx={{ borderBottom: "none" }} className="text-secondary-black" width="50%">{selectedReceipt?.playerCount ?? "-"}</TableCell>
							</TableRow>
							<TableRow>
								<TableCell sx={{ borderBottom: "none" }} className="font-[300] text-primary-gray" width="50%">Status: </TableCell>
								<TableCell sx={{ borderBottom: "none" }} className="text-secondary-black" width="50%">{selectedReceipt?.status ?? "-"}</TableCell>
							</TableRow>
							{selectedReceipt?.status === "PURCHASED" && (
								<>
									<TableRow>
										<TableCell sx={{ borderBottom: "none" }} className="font-[300] text-primary-gray" width="50%">Green Fees Per Player: </TableCell>
										<TableCell sx={{ borderBottom: "none" }} className="text-secondary-black" width="50%">{selectedReceipt?.firstHandPrice ? formatMoney(selectedReceipt?.firstHandPrice / 100) : "-"}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell sx={{ borderBottom: "none" }} className="font-[300] text-primary-gray" width="50%">Total Amount: </TableCell>
										<TableCell sx={{ borderBottom: "none" }} className="text-secondary-black" width="50%">{selectedReceipt?.pricePerGolfer[0] ? formatMoney(selectedReceipt?.pricePerGolfer[0]) : "-"}</TableCell>
									</TableRow>
								</>
							)}
						</table>
						{/* </div> */}
						<div className="flex flex-col gap-4 px-4 pb-8">
							{selectedReceipt?.status === "SOLD" && (
								<table border={0} cellPadding={0} cellSpacing={0} width="100%">
									<TableRow>
										<TableCell sx={{ borderBottom: "none" }} className="font-[300] text-primary-gray" width="50%">Your Listing Price: </TableCell>
										<TableCell sx={{ borderBottom: "none" }} className="text-secondary-black" width="50%">{selectedReceipt?.firstHandPrice ? formatMoney(selectedReceipt?.firstHandPrice) : "-"}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell sx={{ borderBottom: "none" }} className="font-[300] text-primary-gray" width="50%">Service Fee: </TableCell>
										<TableCell sx={{ borderBottom: "none" }} className="text-secondary-black" width="50%">{selectedReceipt?.sellerServiceFee ? formatMoney(selectedReceipt?.sellerServiceFee) : "-"}</TableCell>
									</TableRow>
									<TableRow>
										<TableCell sx={{ borderBottom: "none" }} className="font-[300] text-primary-gray" width="50%">You Receive after Sale: </TableCell>
										<TableCell sx={{ borderBottom: "none" }} className="text-secondary-black" width="50%">{selectedReceipt?.receiveAfterSale ? formatMoney(selectedReceipt?.receiveAfterSale) : "-"}</TableCell>
									</TableRow>
								</table>
							)}
							<div className="flex flex-col gap-2">
								<OutlineButton
									onClick={() => setIsReceiptOpen(false)}
									data-testid="cancel-button-id"
								>
									Cancel
								</OutlineButton>
							</div>
						</div>
					</div>
				</div>
			</aside>
		</>
	);
};