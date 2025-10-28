import { db, eq } from "@golf-district/database";
import { appSettings } from "@golf-district/database/schema/appSetting";
export async function GET(request: Request, { params }: { params: { filename: string } }) {
    if (params.filename === "apple-developer-merchantid-domain-association.txt") {
        const [result] = await db.select({
            value: appSettings.value,
        })
            .from(appSettings)
            .where(eq(appSettings.internalName, 'APPLEPAY_DOMAIN_VERIFICATION'))
            ;
        // const result = await db.query(`SELECT content FROM apple_merchant_association LIMIT 1`);
        // const textContent = result?.[0]?.content || "";
        return new Response(result.value, { headers: { "Content-Type": "text/plain" } });
    }

    return new Response("Not found", { status: 404 });
}