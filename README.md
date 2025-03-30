# Cloudflare Dynamic DNS (cf-ddns)

This script automatically updates Cloudflare DNS records with your latest public IP address, making it useful for dynamic IP environments.

## Prerequisites

Ensure you have the following installed on your system:

- [Node.js](https://nodejs.org/) (LTS recommended)
- [npm](https://www.npmjs.com/)

## Installation

1. **Clone the Repository:**

   ```sh
   git clone https://github.com/your-username/cf-ddns.git
   cd cf-ddns
   ```

2. **Install Dependencies:**

   ```sh
   npm install
   ```

3. **Setup Configuration:**

   - Copy the example environment file and update it with your Cloudflare credentials:
     ```sh
     cp .env.example .env
     ```
   - Edit `.env` with your API details:

     ```sh
     nano .env
     ```

     Example contents:

     ```sh
     API_KEY="your-cloudflare-api-key"
     API_EMAIL="your-cloudflare-email"
     API_ZONE_ID="your-cloudflare-zone-id"
     ```

   - Create a `config.json` file for your DNS records:
     ```sh
     nano config.json
     ```
     Example contents:
     ```json
     {
       "aRecords": [{ "name": "example.com", "proxied": true }],
       "aaaaRecords": [{ "name": "example.com", "proxied": true }]
     }
     ```

## Running the Script

You can manually run the script using:

```sh
npm start
```

Or, if using TypeScript directly (without compiling):

```sh
npx ts-node ./src/index.ts
```

## Setting Up a Cron Job

To run the script every minute, follow these steps:

1. Open the crontab editor:

   ```sh
   crontab -e
   ```

2. Add the following line at the end:

   ```sh
   * * * * * /path/to/cf-ddns/run.sh
   ```

   Replace `/path/to/cf-ddns/` with the actual path to the cloned repository.

3. Save and exit. The script will now run every minute.

## Logs

- The cron job logs its output to `cron.log` in the script directory.
- You can check logs using:
  ```sh
  tail -f cron.log
  ```

## License

This project is licensed under the MIT License.

---

For any issues or improvements, feel free to contribute or open an issue on GitHub!
