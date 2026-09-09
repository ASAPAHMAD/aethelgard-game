# Aethelgard: Echoes of the First Sun - Character Asset Directory

Place your external Rodin Gen-2.5 3D character asset in this directory as:

```
aethelgard-hero.glb
```

Full path:
```
public/assets/characters/aethelgard-hero.glb
```

The game engine is configured to automatically load this file using Three.js `GLTFLoader`.
When this file is present, the engine automatically normalizes its scale, aligns ground contact, enables shadow casting, and binds animation states.
If the file is absent, the engine seamlessly uses the procedural anatomical character system as a fallback.
