import Cloudflare, { ClientOptions } from "cloudflare";
import { publicIpv4 } from "public-ip";

const zone_id = "bc235f4b102d9a29e9c06cd91bb484b6";

const options: ClientOptions = {
  apiKey: "e756cf700519e82efead95f929b050c400d59",
  apiEmail: "Andre010400@web.de",
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
            zone_id: record.zone_id,
            content: address!,
            name: record.name,
            type: "A",
          };

        cf.dns.records.update(record.id, params);
      });
    })
    .catch((err) => console.error(err));
}

main();
