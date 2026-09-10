// Merges every Mixamo animation-only FBX under public/assets/animations/ into a single
// GLB containing animation tracks bound to the shared Mixamo skeleton (no meshes, no
// duplicated skin/textures). Re-run this whenever an FBX clip is added, renamed, or removed.
//
// Usage: npm run convert-animations
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

const ROOT = process.cwd();
const ANIMATIONS_DIR = path.join(ROOT, 'public/assets/animations');
const OUTPUT_FILE = path.join(ANIMATIONS_DIR, 'animation-atlas.glb');

// three's GLTFExporter reads binary buffers back out via FileReader, which only exists
// in browsers. Polyfill the two calls it needs on top of the Blob that's already global in Node.
class NodeFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      this.onloadend?.();
    });
  }
  readAsDataURL(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = `data:${blob.type};base64,${Buffer.from(buf).toString('base64')}`;
      this.onloadend?.();
    });
  }
}
globalThis.FileReader = globalThis.FileReader || NodeFileReader;

function findFbxFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFbxFiles(full));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.fbx')) {
      results.push(full);
    }
  }
  return results;
}

function toArrayBuffer(buffer) {
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
}

async function main() {
  const fbxFiles = findFbxFiles(ANIMATIONS_DIR).sort();
  if (fbxFiles.length === 0) {
    console.error(`No .fbx files found under ${ANIMATIONS_DIR}`);
    process.exit(1);
  }

  const loader = new FBXLoader();
  const clips = [];
  const seenNames = new Set();
  let skeletonRoot = null;
  let totalInputBytes = 0;

  for (const file of fbxFiles) {
    const clipName = path.basename(file);
    if (seenNames.has(clipName)) {
      console.warn(`Skipping duplicate clip name "${clipName}" from ${file}`);
      continue;
    }

    const raw = fs.readFileSync(file);
    totalInputBytes += raw.byteLength;

    const parsed = loader.parse(toArrayBuffer(raw), path.dirname(file) + '/');
    const clip = parsed.animations[0];
    if (!clip) {
      console.warn(`No animation clip found in ${file}, skipping.`);
      continue;
    }

    const renamed = clip.clone();
    renamed.name = clipName;
    clips.push(renamed);
    seenNames.add(clipName);

    // Any one of these FBX exports carries the full Mixamo bone hierarchy needed as the
    // export target for track node names; keep the first one as the scene we export.
    if (!skeletonRoot) {
      skeletonRoot = parsed;
      skeletonRoot.name = 'MixamoSkeletonRoot';
    }

    console.log(`Loaded "${clipName}" (${clip.tracks.length} tracks, ${clip.duration.toFixed(2)}s)`);
  }

  console.log(`\nExporting ${clips.length} clips onto shared skeleton...`);

  const exporter = new GLTFExporter();
  const glb = await exporter.parseAsync(skeletonRoot, {
    binary: true,
    animations: clips,
    onlyVisible: false,
    forceIndices: false
  });

  const outBuffer = Buffer.from(glb);
  fs.writeFileSync(OUTPUT_FILE, outBuffer);

  const mb = n => (n / (1024 * 1024)).toFixed(2);
  console.log(`\nWrote ${OUTPUT_FILE}`);
  console.log(`Input:  ${fbxFiles.length} FBX files, ${mb(totalInputBytes)} MB total`);
  console.log(`Output: 1 GLB file, ${mb(outBuffer.byteLength)} MB`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
