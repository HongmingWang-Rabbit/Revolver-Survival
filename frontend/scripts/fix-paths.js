import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const buildDir = 'build';
const indexPath = join(buildDir, 'index.html');

// Read index.html
let html = readFileSync(indexPath, 'utf-8');

// Replace absolute paths with relative paths
html = html.replace(/href="\//g, 'href="./');
html = html.replace(/src="\//g, 'src="./');
html = html.replace(/import\("\//g, 'import("./');

// Write back
writeFileSync(indexPath, html);

console.log('Fixed paths in index.html to be relative');
