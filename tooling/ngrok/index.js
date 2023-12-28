const dotenv = require("dotenv");
const ngrok = require("ngrok");
const main = async () => {
  const url = await ngrok.connect({
    addr: 3000,
    auth: process.env.NGROK_AUTH_TOKEN ?? null,
    subdomain: "solidity",
  });

  console.log(
    `%c
    +-----------------------------------------+
    |                                         |
    |   🚀 Ngrok Tunnel OPEN on port: 3000    |
    |                                         |
    +-----------------------------------------+

     🌍 URL: %c${url} %c

    `,
    "color: blue; font-weight: bold;",
    "color: green; font-weight: bold;",
    "color: blue; font-weight: bold;"
  );
};

main().catch((err) => {
  console.error("%cError:", "color: red; font-weight: bold;", err);
});
