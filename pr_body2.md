## Changes
- Add VAPID keys configuration (NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY)
- Move package NOTIFIED status update before fire-and-forget push (fixes Vercel serverless teardown issue)
- Remove missing icon path that silently dropped notifications in some browsers
- Web Push notifications now work in production

## Testing
- VAPID keys configured in .env and Vercel ?
- Package status correctly updated to NOTIFIED before response ?
- Push notifications tested on loombox.vercel.app ?

## Production
https://loombox.vercel.app
