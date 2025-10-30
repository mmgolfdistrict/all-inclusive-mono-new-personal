import { db, eq } from "@golf-district/database";
import { appSettings } from "@golf-district/database/schema/appSetting";
export async function GET(request: Request, { params }: { params: { filename: string } }) {
    const [result] = await db.select({
        value: appSettings.value,
    })
        .from(appSettings)
        .where(eq(appSettings.internalName, 'APPLEPAY_DOMAIN_VERIFICATION_FILE_URL'))
        ;
    if (result == undefined || result.value == undefined) {
        return new Response("Missing app setting APPLEPAY_DOMAIN_VERIFICATION_FILE_URL", { headers: { "Content-Type": "text/plain" } });
    }
    let res = await fetch(result.value)
    let text = await res.text()
    return new Response(text, { headers: { "Content-Type": "text/plain" } });

}