import { loggerService } from "@golf-district/service/src/webhooks/logging.service";

export async function getIpInfo() {
    try {
        const ipInfoResponse = await fetch(`https://ipinfo.io/json?token=${process.env.NEXT_PUBLIC_IP_INFO_API_KEY}`);
        const ipInfo = JSON.stringify(await ipInfoResponse.json());
        return ipInfo;
    } catch (error: any) {
        this.logger.error(error);
        await loggerService.errorLog({
            message: "IP_INFO_ERROR",
            userId: "",
            url: "/ipinfo",
            userAgent: "",
            stackTrace: `Error fetching IP info: ${error}`,
            additionalDetailsJSON: JSON.stringify({ error }),
        })
        return "";
    }
}