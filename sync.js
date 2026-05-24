import fetch from "node-fetch";

const message = process.env.MESSAGE?.trim();
const tmdbKey = process.env.TMDB_KEY;
const workerUrl = process.env.WORKER_URL; // Cloudflare Worker URL

if (!message) {
  console.error("No message provided.");
  process.exit(1);
}

console.log(`Searching for: "${message}"`);

async function searchTMDb(query) {
  const url = `https://api.themoviedb.org/3/search/multi?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results || [];
}

async function addToTrakt(mediaType, tmdbId, title) {
  const traktType = mediaType === "movie" ? "movies" : "shows";
  const body = {
    [traktType]: [{ ids: { tmdb: tmdbId } }],
  };

  const res = await fetch(`${workerUrl}/trakt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const responseText = await res.text();
  let responseJson;
  try {
    responseJson = JSON.parse(responseText);
  } catch {
    console.error(`Worker returned non-JSON (Trakt likely blocked): ${responseText.slice(0, 300)}`);
    process.exit(1);
  }

  // Worker wraps Trakt response as { status, body }
  const traktStatus = responseJson.status ?? res.status;
  const traktBody = responseJson.body ?? responseText;

  if (traktStatus >= 400) {
    console.error(`Trakt API error ${traktStatus}: ${traktBody.slice(0, 300)}`);
    process.exit(1);
  }

  console.log(`Added to Trakt watchlist: "${title}" (${traktType})`);
  console.log(`Trakt response: ${traktBody}`);
}

async function main() {
  const results = await searchTMDb(message);

  const match = results.find(
    (r) => r.media_type === "movie" || r.media_type === "tv"
  );

  if (!match) {
    console.error(`No movie or TV show found for: "${message}"`);
    process.exit(1);
  }

  const title = match.title || match.name;
  const mediaType = match.media_type;
  const tmdbId = match.id;

  console.log(`Found: "${title}" (${mediaType}, TMDb ID: ${tmdbId})`);

  await addToTrakt(mediaType, tmdbId, title);
}

main();
