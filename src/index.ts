import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.API_KEY;
const API_EMAIL = process.env.API_EMAIL;
const API_ZONE_ID = process.env.API_ZONE_ID;
const API_BASE_URL = `https://api.cloudflare.com/client/v4/zones/${API_ZONE_ID}/`;

if (!API_KEY || !API_EMAIL || !API_ZONE_ID) {
  throw new Error("Necessary configuration not set");
}

interface ARecord {
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

const getExistingRecords = async (): Promise<ARecord[]> => {
  const response = await fetch(API_BASE_URL + "dns_records", {
    headers: {
      "X-Auth-Key": API_KEY,
      "X-Auth-Email": API_EMAIL
    }
  });
  const data = await response.json();

  return data.result as ARecord[];
};

const getIPv4Address = async (): Promise<string> => {
  const response = await fetch("https://api.ipify.org?format=json");
  return (await response.json()).ip;
};

const getNecessaryRecords = async (): Promise<Partial<ARecord>[]> => {
  const ip = await getIPv4Address();

  // server-kicker.de
  const base: Partial<ARecord> = {
    content: ip,
    type: "A",
    name: "server-kicker.de"
  };

  const www: Partial<ARecord> = {
    content: ip,
    type: "A",
    name: "www.server-kicker.de"
  };

  return [base, www];
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

    fetch(API_BASE_URL + "dns_records", {
      method: recordId ? "PUT" : "POST",
      headers: {
        "X-Auth-Key": API_KEY,
        "X-Auth-Email": API_EMAIL
      },
      body: JSON.stringify(record)
    }).catch((err) => {
      console.error(err);
    });
  });
};

updateRecords();
