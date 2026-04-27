const fs = require('fs');
const path = require('path');

const filesToProcess = [
    path.join(__dirname, 'public/css/index.css'),
    path.join(__dirname, 'public/css/login.css')
];

const colorMappings = [
    // White / Light Texts
    { regex: /#ffffff|#fff|#fafafa|#f8fafc|#f5f9ff|#eaf3ff/gi, replacement: 'var(--text)' },
    // Muted / Grays
    { regex: /#a1a1aa|#94a3b8|#cbd5e1|#64748b|#475569|#334155/gi, replacement: 'var(--muted)' },
    // Dark / Slate Texts
    { regex: /#0f172a|#1e293b|#020617|#0b1220/gi, replacement: 'var(--text)' },
    // Primary Blues
    { regex: /#3b82f6|#2563eb|#1d4ed8|#38bdf8|#7dd3fc|#bae6fd|#bfdbfe|#dbeafe/gi, replacement: 'var(--primary)' },
    // Accents / Pinks
    { regex: /#ec4899|#d946ef|#22d3ee/gi, replacement: 'var(--accent)' },
    // Specific Background Grays
    { regex: /#e2e8f0/gi, replacement: 'var(--surface-strong)' }
];

filesToProcess.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;

    colorMappings.forEach(mapping => {
        if (mapping.regex.test(content)) {
            content = content.replace(mapping.regex, mapping.replacement);
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated ${path.basename(file)}`);
    } else {
        console.log(`No changes needed for ${path.basename(file)}`);
    }
});
