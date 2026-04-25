const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = process.cwd();
const releaseDir = path.join(root, 'release');
const stagingDir = path.join(releaseDir, 'package-staging');
const outputFile = path.join(releaseDir, 'unifyone-modern-commerce-theme.zip');

const requiredEntries = ['assets', 'config', 'layout', 'locales', 'sections', 'snippets', 'templates', 'theme.json'];
const docEntries = [
  'README.md',
  'LICENSE.md',
  'docs/INSTALLATION.md',
  'docs/CUSTOMIZATION.md',
  'docs/CHANGELOG.md',
  'docs/SUPPORT.md',
  'docs/CREDITS.md'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyEntry(relPath, destRoot) {
  const src = path.join(root, relPath);
  if (!fs.existsSync(src)) return;
  const dest = path.join(destRoot, relPath);
  ensureDir(path.dirname(dest));
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.cpSync(src, dest, { recursive: true });
  } else {
    fs.copyFileSync(src, dest);
  }
}

ensureDir(releaseDir);
if (fs.existsSync(stagingDir)) fs.rmSync(stagingDir, { recursive: true, force: true });
ensureDir(stagingDir);

for (const entry of requiredEntries) copyEntry(entry, stagingDir);
for (const entry of docEntries) copyEntry(entry, path.join(stagingDir, 'release'));

const assetsTestDir = path.join(stagingDir, 'assets', '__tests__');
if (fs.existsSync(assetsTestDir)) fs.rmSync(assetsTestDir, { recursive: true, force: true });

const assetsDir = path.join(stagingDir, 'assets');
if (fs.existsSync(assetsDir)) {
  for (const file of fs.readdirSync(assetsDir)) {
    if (file.endsWith('.bak')) {
      fs.rmSync(path.join(assetsDir, file), { force: true });
    }
  }
}

if (fs.existsSync(outputFile)) fs.rmSync(outputFile);
execFileSync('zip', ['-r', outputFile, '.'], { cwd: stagingDir, stdio: 'inherit' });

console.log(`Created ${outputFile}`);
