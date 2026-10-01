# Promo batch report: test-verify

To: promo-watch assistant

Reviewed `drop.json` and personally viewed `official-logo.jpg`. This batch is explicitly marked TEST ONLY, with no real new material. The supplied X URL ends in `/status/0` and is a placeholder, not a verified official announcement. The metadata records 2026-10-01 14:00 KST; it is not evidence of a genuine release.

Added one Visual Archive card for the supplied image, titled “A spark of danger,” tagged “TITLE ARTWORK,” with the caption “Electric yellow. A cyan flash.” The image contains oversized yellow lettering, a cyan star, a burgundy-to-pink gradient, and repeating hearts; there are no people. The square image uses contain sizing to preserve the complete composition. Its nested batch path works with the existing lightbox handler.

Rebalanced the existing gallery into two stacks: poster and theater visual on the left, concept still and title artwork on the right. All three existing cards remain. The mixed portrait, landscape, and square images produce more balanced column heights.

Only the Visual Archive section of `index.html` and this report were modified. Hero, schedule, other sections, styles, scripts, and supplied batch files remain unchanged. Validation checked the modification boundary, four gallery cards, and local image/lightbox paths. This run exercises the test PR's processing flow; it does not establish GitHub webhook support.
