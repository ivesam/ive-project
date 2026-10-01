# IVE — Looks Can Kill

A responsive cinematic comeback landing page using the supplied IVE imagery, with an interactive gallery and a release calendar.

The hero embeds https://www.youtube.com/watch?v=iBeo74ujfes as a muted, looping background with play/pause controls. It keeps the photo visible until playback starts and respects reduced-motion preferences.

## Publish on GitHub Pages

1. Open repository **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose branch **main** and folder **/docs**, then click **Save**.
4. GitHub will display the website URL when deployment finishes.

GitHub Pages for private repositories may require a paid GitHub plan. The repository's visibility has been preserved.

## Local preview

From this repository, run `python -m http.server 8000 --directory docs` and open http://localhost:8000.

YouTube playback requires internet access, embed permission from the video owner, and a served webpage. The photo fallback remains if playback fails.

Fan-made experience. Supplied imagery belongs to STARSHIP Entertainment. No video was downloaded.
