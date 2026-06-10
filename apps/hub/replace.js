const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (f === 'node_modules' || f === '.next' || f === '.git') return;
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const filesToReplace = [];
walk(__dirname, (filePath) => {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.md')) {
    filesToReplace.push(filePath);
  }
});

filesToReplace.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // We want to replace phantom with Phantom, and trust with Trust, 
  // but avoid replacing inside class names like ph4ntom-purple or URLs like /phantom-wallet-simulator.
  // A safe way: replace Phantom/phantom only if it's NOT followed by a hyphen or alphanumeric.
  // Actually, wait, the user said "replace trust and phantom with trust and phantom. in seo and copy both"
  // If it's a URL in blog-data like slug: "phantom-wallet-simulator", maybe they DO want it replaced, maybe not.
  // Usually SEO implies slugs and titles.
  // Wait, if it's a tailwind class it is `phantom-` or `trust-`.
  
  // Let's use a regex that matches phantom but not followed by a hyphen (unless it's in a URL? URLs have hyphens too).
  // If we just replace it globally, but restore the Tailwind classes?
  
  // Let's just use regex to replace text.
  let newContent = content.replace(/phantom/gi, (match, offset, string) => {
    // Check if it's part of a tailwind class (e.g. text-ph4ntom-purple, bg-ph4ntom-accent)
    // or a variable name. 
    // If it is followed by -purple, -green, -accent, -light, don't replace.
    let nextChars = string.substr(offset + match.length, 7);
    if (nextChars.startsWith('-purple') || nextChars.startsWith('-green') || nextChars.startsWith('-accent') || nextChars.startsWith('-light')) {
      return match; // preserve original case
    }
    // Also if it's part of `phantom-` and we don't know it, we should be careful.
    // Let's just replace everything else with Phantom.
    // If original was all lowercase or uppercase, maybe preserve it, but "Phantom" is what they asked for.
    return match === match.toLowerCase() ? "phantom" : "Phantom";
  });

  newContent = newContent.replace(/trust/gi, (match, offset, string) => {
    // Check if followed by any tailwind colors or anything?
    // Trust didn't have tailwind colors as far as I know, but let's be careful.
    return match === match.toLowerCase() ? "trust" : "Trust";
  });
  
  newContent = newContent.replace(/trust/gi, (match) => {
    return match === match.toLowerCase() ? "trust" : "Trust";
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', filePath);
  }
});
