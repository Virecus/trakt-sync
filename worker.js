export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      // Trakt proxy endpoint
      if (request.method === 'POST' && url.pathname === '/trakt') {
        const body = await request.json();

        const traktRes = await fetch('https://api.trakt.tv/sync/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${env.TRAKT_TOKEN}`,
            'trakt-api-version': '2',
            'trakt-api-key': env.TRAKT_CLIENT_ID,
          },
          body: JSON.stringify(body),
        });

        const traktText = await traktRes.text();
        return new Response(traktText, {
          status: traktRes.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Telegram webhook
      if (request.method !== 'POST') {
        return new Response('OK');
      }

      const body = await request.json();

      const message =
        body.message?.text ||
        body.edited_message?.text ||
        body.channel_post?.text;

      console.log("Telegram message:", message);

      if (!message) {
        return new Response("No message");
      }

      const githubResponse = await fetch(
        `https://api.github.com/repos/Virecus/trakt-sync/dispatches`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
            'Content-Type': 'application/json',
            'User-Agent': 'cloudflare-worker'
          },
          body: JSON.stringify({
            event_type: 'telegram_reel',
            client_payload: { message }
          })
        }
      );

      const githubText = await githubResponse.text();

      return new Response(JSON.stringify({
        ok: true,
        telegram: message,
        github_status: githubResponse.status,
        github_response: githubText
      }));

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500 });
    }
  }
};
