# Rollback Plan

## Client OTA (Expo Update)
1. In case of critical client crash or severe bug, publish an immediate rollback update using EAS Update pointing to the previous stable git commit tag.
2. If binary level rollback is required, submit an emergency expedited patch build to Apple App Store and Google Play Store.

## Gateway Server (Fly.io)
1. Run `fly releases` to view recent deployment history.
2. Run `fly deploy --image <previous-stable-image>` or `fly rollback` to immediately revert traffic to the previous healthy container version.
3. Verify `/health` endpoint and check error rates in logging dashboard.
