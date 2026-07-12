const fs = require('fs');
const path = require('path');

// Read the corrupted file
const filePath = path.join(__dirname, 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');
const originalLength = content.length;

// Apply systematic regex replacements in order
const fixes = [
    // Fix closing tags: '< /tagname >' => '</tagname>'
    [/< \/(\w+) >/g, '</$1>'],
    // Fix opening tags: '< tagname' => '<tagname'
    [/< (\w+)/g, '<$1'],
    // Fix closing angle brackets: 'tagname >' => 'tagname>'
    [/(\w+) >/g, '$1>'],
    // Fix self-closing tags with space: '/ >' => '/>'
    [/ \/ >/g, '/>'],
    // Fix JSX expression opening braces: '{ ' => '{'
    [/\{\s+/g, '{'],
    // Fix JSX expression closing braces: ' }' => '}'
    [/\s+\}/g, '}'],
    // Fix attribute assignments: ' = ' => '='
    [/ = /g, '='],
    // Fix optional chaining: '? .' => '?.'
    [/\?\s+\./g, '?.'],
    // Fix null coalescing: '? ?' => '??'
    [/\?\s+\?/g, '??'],
];

let fixCount = 0;
fixes.forEach(([pattern, replacement]) => {
    const matches = content.match(pattern) || [];
    fixCount += matches.length;
    content = content.replace(pattern, replacement);
});

// Write back the fixed content
fs.writeFileSync(filePath, content, 'utf8');
console.log(`✅ Fixed ${fixCount} corruption patterns`);
console.log(`Original size: ${originalLength} bytes`);
console.log(`New size: ${content.length} bytes`);
console.log('App.js has been corrected!');