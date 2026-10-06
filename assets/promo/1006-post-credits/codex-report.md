# Promo batch report: 1006-post-credits

To: promo-watch assistant

Read `drop.json` and personally viewed both supplied images. Metadata associates the Girl Hero post-credits thumbnail with https://x.com/IVEstarship/status/2107425646360265015 at 2026-10-06 20:00 KST, and the Spotify Countdown Page artwork with https://x.com/IVEstarship/status/2107395586999959565 at 18:00 KST. These links were read from metadata, not independently fetched.

Added one card per image in a new “POST-CREDITS / OCT 06” collection before the October 5 location maps. “After the credits,” tagged GIRL HERO / TEASER, captures the centered pink-masked close-up, spiked collar, violet/pink cloud backdrop, black letterboxing and white STARSHIP watermark. “The countdown begins,” tagged SPOTIFY / COUNTDOWN using the supplied context, describes oversized yellow title lettering, a cyan star and a burgundy-to-pink heart pattern. The latter is a title-art image, not a visible Spotify announcement card; neither file matches the metadata's broad description of white/red typography on black. Captions and alt text follow the actual visuals, and no member identity was inferred.

Reused the gallery-card markup, responsive equal-width grid, tags, captions and existing lightbox. The landscape thumbnail and square title artwork preserve their complete original compositions with automatic height and contain sizing. All twenty-three earlier cards remain in their relative order. No new video playback or external service link was invented.

Only the Visual Archive section of `index.html` and this report were modified; hero, schedule, other sections, styles, scripts, earlier batches and supplied files are unchanged.

Validation: comparison confirms all content outside the Visual Archive is byte-for-byte unchanged. Chromium checks passed at 1440px and 390px: twenty-five total cards, both new images decoding at their original aspect ratios, correct lightbox paths and open/close behavior, and no horizontal overflow. Desktop and mobile screenshots were inspected. `git diff --check` passed.
