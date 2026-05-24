const axios = require("axios");

const message = process.env.MESSAGE;

const TMDB_KEY = process.env.TMDB_KEY;
const TRAKT_CLIENT_ID = process.env.TRAKT_CLIENT_ID;
const TRAKT_TOKEN = process.env.TRAKT_TOKEN;

async function searchTMDb(query) {
  const res = await axios.get(
    `https://api.themoviedb.org/3/search/multi`,
    {
      params: {
        api_key: TMDB_KEY,
        query
      }
    }
  );

  return res.data.results?.[0];
}

async function addToTrakt(item) {
  if (!item) return;

  const type = item.media_type === "movie" ? "movies" : "shows";

  const payload = {
    [type]: [
      {
        ids: {
          tmdb: item.id
        }
      }
    ]
  };

  const res = await axios.post(
    "https://api.trakt.tv/sync/watchlist",
    payload,
    {
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TRAKT_TOKEN}`,
        "trakt-api-key": TRAKT_CLIENT_ID,
        "trakt-api-version": "2"
      }
    }
  );

  console.log("Added to Trakt:", res.status);
}

(async () => {
  try {
    console.log("Incoming message:", message);

    if (!message) {
      console.log("No message found");
      return;
    }

    const item = await searchTMDb(message);

    if (!item) {
      console.log("No TMDb match found");
      return;
    }

    console.log("Matched:", item.title || item.name);

    await addToTrakt(item);

  } catch (err) {
    console.error("Error:", err.message);
  }
})();
