# Transparent logo for dark mode

- Tool: built-in `image_gen` image editing with `transparent_background: true`.
- Edit target: `public/hotel-logo.png`.
- Selected output: `public/hotel-logo-transparent.png` (RGBA PNG, 1602 × 982).
- Usage: the shared Logo component displays this asset in dark mode; light mode uses the original asset.
- Verification: both top corners have alpha 0; checked the header and footer image visibility in the browser and visually checked the logo on the dark page background.

## Final edit prompt

```text
Use case: background-extraction. The single input is the edit target, an existing small blue suitcase logo with a thin airplane outline. Produce a production-clean transparent PNG cutout of this EXACT original mark. Remove the pale white rectangular background, including the background inside the suitcase's open handle. Preserve the exact original thin blue airplane OUTLINE (do NOT fill the plane or enlarge it), the suitcase silhouette, curved white stripe, blue gradients, original wheels, and original thin handle. No redesign. Fully transparent outside the mark, smooth clean antialiased boundaries, no colored speckles, no blue mist, no halo, no stray opaque pixels or noise in the background. Maintain the original landscape canvas and logo placement. Only background removal; no other visual changes.
```
