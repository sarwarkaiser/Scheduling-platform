const fs = require('fs');
const path = require('path');

const clientPath = path.join(process.cwd(), 'node_modules', '@prisma', 'client');
const defaultJsPath = path.join(clientPath, 'default.js');
const pkgJsonPath = path.join(clientPath, 'package.json');
const indexJsPath = path.join(clientPath, 'index.js');
const generatedPath = path.join(process.cwd(), 'node_modules', '.prisma', 'client');

console.log('--- .prisma/client exists? ---');
console.log(fs.existsSync(generatedPath));
if (fs.existsSync(generatedPath)) {
    console.log('Entries in .prisma/client:', fs.readdirSync(generatedPath));
}

console.log('\n--- default.js content ---');
if (fs.existsSync(defaultJsPath)) {
    console.log(fs.readFileSync(defaultJsPath, 'utf8'));
} else {
    console.log('default.js does not exist');
}

console.log('\n--- index.js content ---');
if (fs.existsSync(indexJsPath)) {
    console.log(fs.readFileSync(indexJsPath, 'utf8'));
} else {
    console.log('index.js does not exist');
}

console.log('\n--- package.json content ---');
if (fs.existsSync(pkgJsonPath)) {
    console.log(fs.readFileSync(pkgJsonPath, 'utf8'));
} else {
    console.log('package.json does not exist');
}
