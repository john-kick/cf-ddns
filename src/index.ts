import Cloudflare, { ClientOptions } from "cloudflare";
import dotenv from "dotenv";

dotenv.config();

if (!(process.env.API_ZONE_ID && process.env.API_KEY && process.env.API_MAIL)) {
  throw new Error(
    "'API_ZONE_ID', 'API_KEY' and 'API_EMAIL' must be set in .env"
  );
}

const zone_id = process.env.API_ZONE_ID;

const options: ClientOptions = {
  apiKey: process.env.API_KEY,
  apiEmail: process.env.API_MAIL
};

async function getPublicIPAddress(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    if (!response.ok) {
      throw new Error("Failed to fetch IP address");
    }
    const data: any = await response.json();
    return data.ip;
  } catch (error) {
    console.error(error);
    return "";
  }
}

async function main() {
  const cf = new Cloudflare(options);

  const address = await getPublicIPAddress();

  if (!address) {
    throw new Error("Could not get the public IP address");
  }

  cf.dns.records
    .list({ zone_id })
    .then((response) => {
      response.result.forEach((record) => {
        if (!record.id || !record.zone_id) {
          throw new Error("Error while fetching DNS records");
        }

        const params: Cloudflare.DNS.Records.RecordUpdateParams.DNSRecordsARecord =
          {
            zone_id,
            content: address,
            name: record.name,
            type: "A"
          };

        cf.dns.records.update(record.id, params);
      });
    })
    .catch((err) => console.error(err));
}

main();
