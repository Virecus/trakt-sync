import fetch from "node-fetch";
import readline from "readline";

const CLIENT_ID = process.env.TRAKT_CLIENT_ID;
const CLIENT_SECRET = process.env.TRAKT_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("TRAKT_CLIENT_ID ve TRAKT_CLIENT_SECRET env değişkenlerini set et.");
  process.exit(1);
}

const res = await fetch("https://api.trakt.tv/oauth/device/code", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  body: JSON.stringify({ client_id: CLIENT_ID }),
});

const data = await res.json();

console.log(`\n1. Şu adrese git: ${data.verification_url}`);
console.log(`2. Bu kodu gir: ${data.user_code}`);
console.log(`\nOnayladıktan sonra Enter'a bas...`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
await new Promise((r) => rl.question("", r));
rl.close();

const interval = data.interval * 1000;
const expiry = Date.now() + data.expires_in * 1000;

console.log("Token alınıyor...");

while (Date.now() < expiry) {
  await new Promise((r) => setTimeout(r, interval));

  const tokenRes = await fetch("https://api.trakt.tv/oauth/device/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    },
    body: JSON.stringify({
      code: data.device_code,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
    }),
  });

  if (tokenRes.status === 200) {
    const token = await tokenRes.json();
    console.log(`\nAccess Token:\n${token.access_token}`);
    console.log(`\nBu token'ı GitHub Secrets'a TRAKT_TOKEN olarak ekle.`);
    process.exit(0);
  } else if (tokenRes.status === 400) {
    process.stdout.write(".");
    continue;
  } else {
    console.error(`\nHata: ${tokenRes.status}`);
    process.exit(1);
  }
}
