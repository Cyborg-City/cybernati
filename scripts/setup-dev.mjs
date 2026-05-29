import { existsSync, rmSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const astroCacheDir = path.join(projectRoot, '.astro');
const viteCacheDir = path.join(projectRoot, 'node_modules', '.vite');

console.log('⚙️ Setting up development environment...');

// Wipe .astro completely so content layer and route cache are fresh every dev run
try {
  if (existsSync(astroCacheDir)) {
    console.log(`Cleaning .astro cache: ${astroCacheDir}`);
    rmSync(astroCacheDir, { recursive: true, force: true });
  }
  mkdirSync(astroCacheDir, { recursive: true });
} catch (error) {
  console.error(`Failed to clean .astro: ${error.message}`);
}

// Wipe Vite cache completely so modules are re-resolved
try {
  if (existsSync(viteCacheDir)) {
    console.log(`Cleaning Vite cache: ${viteCacheDir}`);
    rmSync(viteCacheDir, { recursive: true, force: true });
  }
  mkdirSync(viteCacheDir, { recursive: true });
} catch (error) {
  console.error(`Failed to clean Vite cache: ${error.message}`);
}

console.log('✅ Development environment setup complete.');
