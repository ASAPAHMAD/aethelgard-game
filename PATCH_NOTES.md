# Aethelgard Runtime Fixes

## Fixed

### 1. Master FBX production proxy
- Fixed the `/api/character-asset` streaming lifecycle.
- Removed the incorrect `req.on('close')` stream destruction behavior.
- The proxy now keeps the 41.9 MiB FBX streaming until the outgoing response finishes.
- If the browser actually disconnects early, the upstream fetch is aborted safely.
- Added safer handling for aborted/disconnected requests so the server does not attempt a second HTTP response.
- Preserved same-origin CORS and the hardcoded GitHub release asset restriction.

### 2. Third-person WASD movement
- Fixed the camera-relative movement inversion caused by the extra `+ Math.PI`.
- W/Up now moves camera-forward.
- S/Down now moves camera-backward.
- A/Left now moves camera-left.
- D/Right now moves camera-right.
- Character facing follows the actual movement direction.
- Dodge direction uses the same corrected camera-relative convention.

## Important
The project dependencies were not installed in this inspection environment, so a full Vite/TypeScript production build could not be executed here. The source-level changes are isolated to `server.ts` and `src/components/game/WorldEngine3D.tsx`.
