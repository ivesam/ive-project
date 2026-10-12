# IVE — Looks Can Kill

A responsive cinematic comeback landing page using the supplied IVE imagery, with an interactive gallery and a release calendar.

The hero plays the user-supplied 1080p MP4 as a muted, inline loop. The background copy has its audio track removed and is optimized for progressive playback. A photo remains as a loading/error fallback, and playback pauses when the hero is off-screen or reduced motion is enabled.

## Publish on GitHub Pages

The GitHub Actions workflow `.github/workflows/pages.yml` publishes the website files at the repository root whenever website files change on `main`. It also supports manual runs from the Actions tab.

The workflow attempts to enable GitHub Pages automatically. If GitHub refuses automatic enablement, open **Settings → Pages**, set **Source** to **GitHub Actions**, then rerun the failed workflow from the Actions tab.

The site URL appears in the successful workflow deployment and in repository Settings → Pages.

## Local preview

From this repository, run `python -m http.server 8000` and open http://localhost:8000.

The background video is served directly from assets/ive-theater-background.mp4. It does not use a YouTube player.

Fan-made experience. Supplied imagery belongs to STARSHIP Entertainment. The video was supplied by the user.

IP location: ipapi.co is tried first, with FreeIPAPI as fallback. FreeIPAPI country-wide `timeZones` are resolved using its IP geolocation coordinates and the bundled [tz-lookup 6.1.25](https://github.com/darkskyapp/tz-lookup) (CC0; license in assets/vendor). This does not use device time zone or browser location permissions. IP geolocation is approximate, including when using a VPN. If both lookups fail, only KST is shown.

## Daily YouTube tracker

The Daily Pulse watchlist supports multiple videos, with thumbnail selection and independent view trends, daily growth, and comment histories. The original video https://www.youtube.com/watch?v=XJzRgeX-bwo and its history are preserved. `.github/workflows/youtube-daily.yml` requests a snapshot daily at **23:55 Asia/Seoul (14:55 UTC)** and supports manual runs. GitHub schedules can be delayed; each record uses the actual capture timestamp and Korea calendar date. The first successful run on a date is retained, including manual runs. There is no fabricated historical backfill.

Enable YouTube Data API v3 in a Google Cloud project, create an API key restricted to that API, and add it to this repository's **Settings → Secrets and variables → Actions** as `YOUTUBE_API_KEY`. Never place the key in website files. Merge the workflow into `main`, then run **Track YouTube daily views** from Actions for an initial snapshot. Scheduled runs start once the workflow is on the default branch. Repository rules must permit the workflow token to push the history file to main; otherwise the save step fails visibly. This implementation does not bypass branch protections.

The collector uses `videos.list` for the public total and scans `commentThreads.list` newest-first until it covers all accessible top-level comments posted on the capture date, from midnight KST through capture time. It selects the highest like count, with ties resolved by earliest publication then ID. Replies are excluded. This is a snapshot of likes, not YouTube's personalized “Top comments” ordering. Disabled comments/no comments are shown explicitly. A request failure or incomplete scan (1,000-page limit) fails without saving a partial ranking. Deleted/unavailable comments cannot be recovered.

History lives in `assets/youtube/daily.json`, with a `videos` array. To add a video, append an object with its 11-character `video_id`, `title`, `video_url`, and `snapshots: []`. Keep existing objects and their snapshots. Merging this change triggers collection for newly added videos; duplicates are rejected. No historical counts are invented. The collector processes every video and saves atomically after all requests succeed; a failure preserves all existing histories. API usage increases with the number of videos and comments scanned. View growth is the difference between consecutive calendar-date snapshots, with a percentage relative to the previous total. Missing dates show no daily change; negative adjustments remain visible. Differences are between capture times, not official YouTube Analytics calendar-day measurements. A delayed run crossing midnight may leave a gap, rather than inventing a count for yesterday.

The workflow commits only the history file and calls the Pages deployment workflow explicitly: commits made with `GITHUB_TOKEN` do not trigger another push workflow. The browser loads the history without any credentials. History starts empty until a successful API run. Validate with `python -m unittest discover -s tests`.

### Comment translations

To enable English translations, enable **Cloud Translation API (Basic v2)** in a Google Cloud project with billing and add an API key restricted to that API as the repository Actions secret `TRANSLATION_API_KEY`. Then manually run **Track YouTube daily views**. The existing YouTube-only key is kept separate. Public top-comment text is sent to Google for automatic language detection and translation; credentials stay in Actions. English and Chinese comments retain their original display. Other languages show an English translation with an expandable original comment and an automatic-translation label. Existing saved top comments are also enriched, while counts, dates, and original text stay unchanged. Missing credentials or translation failures keep the original text; failures retry on later runs.

Gemini is also supported and takes priority when `GEMINI_API_KEY` is configured. The default model is `gemini-3.8-flash`, verified against the available API models and a live Korean-to-English request. Optionally set the Actions variable `GEMINI_MODEL` to another supported text model ID. Run **Track YouTube daily views** to enrich saved comments immediately. Public comment text is sent to the Gemini API; the original text stays in history. English and Chinese comments remain untranslated. Model responses are validated before saving; unavailable or invalid responses leave the original visible and retry later. The Cloud Translation key is optional when using Gemini.
