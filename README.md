# IVE — Looks Can Kill

A responsive cinematic comeback landing page using the supplied IVE imagery, with an interactive gallery and a release calendar.

The hero embeds https://www.youtube.com/watch?v=iBeo74ujfes as a muted, looping background with play/pause controls. It keeps the photo visible until playback starts and respects reduced-motion preferences.

## Publish on GitHub Pages

The GitHub Actions workflow `.github/workflows/pages.yml` publishes the website files at the repository root whenever website files change on `main`. It also supports manual runs from the Actions tab.

The workflow attempts to enable GitHub Pages automatically. If GitHub refuses automatic enablement, open **Settings → Pages**, set **Source** to **GitHub Actions**, then rerun the failed workflow from the Actions tab.

The site URL appears in the successful workflow deployment and in repository Settings → Pages.

## Local preview

From this repository, run `python -m http.server 8000` and open http://localhost:8000.

YouTube playback requires internet access, embed permission from the video owner, and a served webpage. The photo fallback remains if playback fails.

Fan-made experience. Supplied imagery belongs to STARSHIP Entertainment. No video was downloaded.
