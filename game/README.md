# DearV Private Game

This directory is the native high-fidelity version of DearV. The existing
Next.js PWA remains the lightweight portal and owner-facing content manager.

## Engine

- Godot 4.7.1 stable (MIT, no engine royalties)
- Blender 5.2 LTS for authored meshes, UVs, cloth, LODs and glTF export
- Mobile renderer profiles for iOS/Android; Forward+ quality profile for PC
- Supabase Auth, Postgres and Storage through HTTPS REST APIs

## Non-negotiable production rules

1. The ocean/city/weather outside the windows are geometry, shaders and
   streamed LODs. A flat scenic photograph is never the primary view.
2. Hero furniture and keepsakes are authored assets with real silhouettes,
   bevels, UVs and PBR texture sets. Primitive blockouts never ship.
3. Every interactive prop implements one shared interaction contract and
   persists its state locally first, then to the authenticated cloud room.
4. Lighting ships as baked indirect light plus controllable direct fixtures.
   Switches animate luminance and fixture emission together.
5. Mobile quality is achieved with LODs, occlusion, texture streaming,
   instancing and quality profiles—not by deleting the scene's identity.

## Current vertical-slice contract

- Comfortable direct movement with mouse, keyboard, gamepad and touch look
- Context interaction with no permanently visible joystick
- Stateful doors, switches and faucets
- In-world computer handoff
- Inspectable 3D gifts with story/page metadata
- Stateful openable furniture, refrigerator inventory and a wash/chop/cook/
  plate food pipeline shared by the kitchen appliances
- Offline-first state persistence and Supabase session/data transport
- Procedural ocean shader foundation for a real high-rise coastal world

Open `game/project.godot` with Godot 4.7.1. The project is intentionally kept
inside the existing repository so web and native versions share one schema.

## Remote progress

The optional private Telegram bridge under `supabase/functions/telegram-bridge`
reports cloud validation results and stores owner feedback while the development
computer is offline. Secrets live only in Supabase/GitHub settings. See
`docs/telegram-bridge.md` for the one-time setup contract.
