# Customer login artwork

Source: the user's `login-cart.png` from the supplied FGX images folder. The original is 1672 × 941, 2,382,293 bytes, RGB with a baked-in checkerboard background.

The built-in image generation tool removed that background to create a transparent cutout. Sharp then resized it to 1400 × 788 and encoded WebP at quality 85, alpha quality 100, effort 6, smart subsampling. Final file: `public/assets/images/auth/login-cart.webp`, 301,780 bytes, with alpha preserved. The source PNG is unchanged.

## Background cleanup prompt

Use case: background-extraction. Edit the supplied ecommerce shopping assortment image ONLY to remove the baked-in grey and white checkerboard background, replacing it with true transparent alpha. Keep the exact entire original shopping cart, groceries, food packaging labels, green foliage, yellow hoodie and its hanger, denim jeans, purple and white shoes, laptop, headphones, phone, watch and metal cookware. Preserve the original object arrangement, colors, shapes and lettering as closely as possible. Do not add, remove, rearrange, redraw or crop any objects. Keep all wheels, shoes and edge objects intact. No new background, no floor, no text overlays, no frame. This is a cutout extraction for a web login page, not a redesign.
