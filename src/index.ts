import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

const API_KEY = process.env.API_KEY;
const API_EMAIL = process.env.API_EMAIL;
const API_ZONE_ID = process.env.API_ZONE_ID;
const API_BASE_URL = `https://api.cloudflare.com/client/v4/zones/${API_ZONE_ID}/`;

if (!API_KEY || !API_EMAIL || !API_ZONE_ID) {
  throw new Error("Necessary configuration not set");
}

interface Record {
  id: string;
  zone_id: string;
  zone_name: string;
  name: string;
  type: "A" | "AAAA";
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  settings: any;
  meta: {
    auto_added: boolean;
    managed_by_app: boolean;
    managed_by_argo_tunnel: boolean;
  };
  comment: string | null;
  tags: string[];
  created_on: string;
  modified_on: string;
}

const getExistingRecords = async (): Promise<Record[]> => {
  const response = await fetch(API_BASE_URL + "dns_records", {
    headers: {
      "X-Auth-Key": API_KEY,
      "X-Auth-Email": API_EMAIL,
    },
  });
  const data = await response.json();

  return data.result as Record[];
};

const getIPv4Address = async (): Promise<string> => {
  const response = await fetch("https://api.ipify.org?format=json");
  return (await response.json()).ip;
};

const getIPv6Address = async (): Promise<string> => {
  const response = await fetch("https://api64.ipify.org?format=json");
  return (await response.json()).ip;
};

const getNecessaryRecords = async (): Promise<Partial<Record>[]> => {
  const ipv4 = await getIPv4Address();
  const ipv6 = await getIPv6Address();
  console.log("New ipv4:", ipv4);
  console.log("New ipv6:", ipv6);

  // Resolve the path to the config.json file
  const configPath = path.resolve(__dirname, "../config.json");

  let config: { aRecords: any[]; aaaaRecords: any[] } = {
    aRecords: [],
    aaaaRecords: [],
  };

  try {
    // Read and parse the JSON file
    const configContent = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(configContent);
  } catch (error) {
    console.error("Error reading or parsing config.json:", error);
  }

  // Map A records
  const aRecords = config.aRecords.map((record) => ({
    content: ipv4,
    type: "A",
    name: record.name,
    proxied: record.proxied,
  }));

  // Map AAAA records
  const aaaaRecords = config.aaaaRecords.map((record) => ({
    content: ipv6,
    type: "AAAA",
    name: record.name,
    proxied: record.proxied,
  }));

  return [...aRecords, ...aaaaRecords] as Partial<Record>[];
};

const updateRecords = async (): Promise<void> => {
  const existingRecords = await getExistingRecords();
  const necessaryRecords = await getNecessaryRecords();

  necessaryRecords.forEach((record) => {
    let recordId;
    existingRecords.forEach((eRecord) => {
      if (record.name === eRecord.name && record.type === eRecord.type) {
        recordId = eRecord.id;
        record.id = recordId;
      }
    });

    fetch(API_BASE_URL + "dns_records/" + (recordId ?? ""), {
      method: recordId ? "PUT" : "POST",
      headers: {
        "X-Auth-Key": API_KEY,
        "X-Auth-Email": API_EMAIL,
      },
      body: JSON.stringify(record),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Request failed with status " + response.status);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  });
};

updateRecords();
