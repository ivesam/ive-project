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
