import dotenv from "dotenv";

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
      "X-Auth-Email": API_EMAIL
    }
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
}

const getNecessaryRecords = async (): Promise<Partial<Record>[]> => {
  const ipv4 = await getIPv4Address();
  const ipv6 = await getIPv6Address();
  console.log("New ipv4:", ipv4);
  console.log("New ipv6:", ipv6);

  // A server-kicker.de
  const aBase: Partial<Record> = {
    content: ipv4,
    type: "A",
    name: "server-kicker.de",
    proxied: false
  };

  // A www.server-kicker.de
  const aWww: Partial<Record> = {
    content: ipv4,
    type: "A",
    name: "www.server-kicker.de",
    proxied: false
  };

  // A auth.server-kicker.de
  const aAuth: Partial<Record> = {
    content: ipv4,
    type: "A",
    name: "auth.server-kicker.de",
    proxied: false
  }

  // A vaultwarden.server-kicker.de
  const aVaultwarden: Partial<Record> = {
    content: ipv4,
    type: "A",
    name: "vaultwarden.server-kicker.de",
    proxied: false
  }

  // AAAA server-kicker.de
  const aaaaBase: Partial<Record> = {
    content: ipv6,
    type: "AAAA",
    name: "server-kicker.de",
    proxied: true
  }

  // AAAA www.server-kicker.de
  const aaaaWww: Partial<Record> = {
    content: ipv6,
    type: "AAAA",
    name: "server-kicker.de",
    proxied: true
  }

  return [aBase, aWww, aAuth, aVaultwarden, aaaaBase, aaaaWww];
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
        "X-Auth-Email": API_EMAIL
      },
      body: JSON.stringify(record)
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
