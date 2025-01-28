import { formatMoney, formatTime } from "@golf-district/shared";
import { TableCell, TableRow } from "@mui/material";
import { useSidebar } from "~/hooks/useSidebar";
import type { Dispatch, SetStateAction } from "react";
import { OutlineButton } from "../buttons/outline-button";
import { Close } from "../icons/close";
import type { TxnHistoryType } from "./transaction-history";
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, Image } from '@react-pdf/renderer';

type BookingDetailsProps = {
  isReceiptOpen: boolean;
  setIsReceiptOpen: Dispatch<SetStateAction<boolean>>;
  selectedReceipt: TxnHistoryType | null;
};

export const BookingDetails = ({
  isReceiptOpen,
  setIsReceiptOpen,
  selectedReceipt,
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
        className={`!duration-400 fixed right-0 top-1/2 z-20 flex h-[90dvh] w-[80vw] -translate-y-1/2 flex-col overflow-y-hidden border border-stroke bg-white shadow-lg transition-all ease-linear sm:w-[500px] md:h-[100dvh] ${
          isReceiptOpen ? "translate-x-0" : "translate-x-full"
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
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="font-[300] text-primary-gray"
                  width="50%"
                >
                  Play Date Time:{" "}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="text-secondary-black"
                  width="50%"
                >
                  {selectedReceipt?.date
                    ? formatTime(selectedReceipt?.date)
                    : "-"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="font-[300] text-primary-gray"
                  width="50%"
                >
                  Players:{" "}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="text-secondary-black"
                  width="50%"
                >
                  {selectedReceipt?.playerCount ?? "-"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="font-[300] text-primary-gray"
                  width="50%"
                >
                  Status:{" "}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="text-secondary-black"
                  width="50%"
                >
                  {selectedReceipt?.status ?? "-"}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="font-[300] text-primary-gray"
                  width="50%"
                >
                  Weather Guarantee Amount:{" "}
                </TableCell>
                <TableCell
                  sx={{ borderBottom: "none" }}
                  className="text-secondary-black"
                  width="50%"
                >
                  {/* {selectedReceipt?.weatherGuaranteeAmount ?? "-"} */}
                  {selectedReceipt?.weatherGuaranteeAmount
                    ? formatMoney(selectedReceipt?.weatherGuaranteeAmount / 100)
                    : "-"}
                </TableCell>
              </TableRow>
              {selectedReceipt?.status === "PURCHASED" && (
                <>
                  <TableRow>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="font-[300] text-primary-gray"
                      width="50%"
                    >
                      Green Fees Per Player:{" "}
                    </TableCell>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="text-secondary-black"
                      width="50%"
                    >
                      {selectedReceipt?.firstHandPrice
                        ? formatMoney(
                            (selectedReceipt?.firstHandPrice +
                              (selectedReceipt.markupFees ?? 0)) /
                              100
                          )
                        : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="font-[300] text-primary-gray"
                      width="50%"
                    >
                      Total Amount:{" "}
                    </TableCell>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="text-secondary-black"
                      width="50%"
                    >
                      {selectedReceipt?.pricePerGolfer[0]
                        ? formatMoney(selectedReceipt?.pricePerGolfer[0])
                        : "-"}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </table>
            {/* </div> */}
            <div className="flex flex-col gap-4">
              {selectedReceipt?.status === "SOLD" && (
                <table border={0} cellPadding={0} cellSpacing={0} width="100%">
                  <TableRow>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="font-[300] text-primary-gray"
                      width="50%"
                    >
                      Your Listing Price:{" "}
                    </TableCell>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="text-secondary-black"
                      width="50%"
                    >
                      {selectedReceipt?.firstHandPrice
                        ? formatMoney(selectedReceipt?.firstHandPrice)
                        : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="font-[300] text-primary-gray"
                      width="50%"
                    >
                      Service Fee:{" "}
                    </TableCell>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="text-secondary-black"
                      width="50%"
                    >
                      {selectedReceipt?.sellerServiceFee
                        ? formatMoney(selectedReceipt?.sellerServiceFee)
                        : "-"}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="font-[300] text-primary-gray"
                      width="50%"
                    >
                      You Receive after Sale:{" "}
                    </TableCell>
                    <TableCell
                      sx={{ borderBottom: "none" }}
                      className="text-secondary-black"
                      width="50%"
                    >
                      {selectedReceipt?.receiveAfterSale
                        ? formatMoney(selectedReceipt?.receiveAfterSale)
                        : "-"}
                    </TableCell>
                  </TableRow>
                </table>
              )}
              <div className="flex flex-col gap-2">
                {selectedReceipt?.status === "PURCHASED" ?
                  <PDFDownloadLink className="w-full" document={<BookingReceipt selectedReceipt={selectedReceipt} />} fileName="booking_receipt.pdf">
                    <OutlineButton
                      className="w-full"
                      data-testid="cancel-button-id"
                    >
                      Download
                    </OutlineButton>
                  </PDFDownloadLink> : null}

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

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    padding: 20,
    fontFamily: 'Helvetica',
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  header: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  table: {
    width: '100%',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
  },
  tableCell: {
    width: '50%',
    padding: 5,
    fontSize: 12,
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#4A4A4A',
  },
  valueCell: {
    color: '#000000',
    fontSize: 12,
  },
  logoCell: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  headerLogo: {
    position: 'relative',
    marginLeft: 10
  },
  courseLogo: {
    flex: 1,
    alignItems: 'center'
  }
});

const BookingReceipt = ({ selectedReceipt }: { selectedReceipt: TxnHistoryType | null }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <View style={styles.logoCell}>
            <View style={styles.courseLogo}>
              <Image src={selectedReceipt?.courseLogo} style={{ width: 150, height: 50 }} />
            </View>
            <View style={styles.headerLogo}>
              <Image src={`https://${process.env.NEXT_PUBLIC_AWS_CLOUDFRONT_URL}/emailheaderlogo.png`} style={{ width: 100, height: 30, position: 'absolute', top: 0, right: 0 }} />
            </View>
          </View>
          <Text style={styles.title}>Booking Receipt</Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.headerCell]}>
                Play Date Time:
              </Text>
              <Text style={[styles.tableCell, styles.valueCell]}>
                {selectedReceipt?.date ? formatTime(selectedReceipt?.date) : '-'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.headerCell]}>
                Players:
              </Text>
              <Text style={[styles.tableCell, styles.valueCell]}>
                {selectedReceipt?.playerCount ?? '-'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.headerCell]}>
                Status:
              </Text>
              <Text style={[styles.tableCell, styles.valueCell]}>
                {selectedReceipt?.status ?? '-'}
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.headerCell]}>
                Weather Guarantee Amount:
              </Text>
              <Text style={[styles.tableCell, styles.valueCell]}>
                {selectedReceipt?.weatherGuaranteeAmount
                  ? formatMoney(selectedReceipt?.weatherGuaranteeAmount / 100)
                  : '-'}
              </Text>
            </View>
            {selectedReceipt?.status === 'PURCHASED' && (
              <>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.headerCell]}>
                    Green Fees Per Player:
                  </Text>
                  <Text style={[styles.tableCell, styles.valueCell]}>
                    {selectedReceipt?.firstHandPrice
                      ? formatMoney(
                        (selectedReceipt?.firstHandPrice + (selectedReceipt.markupFees ?? 0)) / 100
                      )
                      : '-'}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.headerCell]}>
                    Total Amount:
                  </Text>
                  <Text style={[styles.tableCell, styles.valueCell]}>
                    {selectedReceipt?.pricePerGolfer[0]
                      ? formatMoney(selectedReceipt?.pricePerGolfer[0])
                      : '-'}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Page>
    </Document>
  );
};