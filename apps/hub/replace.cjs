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
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js') || filePath.endsWith('.css')) {
    filesToReplace.push(filePath);
  }
});

filesToReplace.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Replace ph4ntom and tru5t globally, EXCEPT in specific tailwind colors:
  // ph4ntom-purple, ph4ntom-green, ph4ntom-accent, ph4ntom-light, ph4ntom-dark, ph4ntom-darker, ph4ntom-red
  
  // Safe way: Replace globally and then fix the colors back, or regex with negative lookahead?
  // Let's use regex with a replacer function.
  
  content = content.replace(/ph4ntom/gi, (match, offset, string) => {
    const nextChars = string.substr(offset + match.length, 7);
    if (nextChars.startsWith('-purple') || 
        nextChars.startsWith('-green') || 
        nextChars.startsWith('-accent') || 
        nextChars.startsWith('-light') || 
        nextChars.startsWith('-dark') ||
        nextChars.startsWith('-red')) {
      return match; // Keep as is
    }
    
    // Slugs: ph4ntom-wallet-simulator -> phantom-wallet-simulator
    // So for everything else, we replace with Phantom.
    // If original was uppercase P, make it Phantom. If lowercase p, make it phantom.
    if (match === match.toLowerCase()) return "phantom";
    if (match === match.toUpperCase()) return "PHANTOM";
    return "Phantom";
  });

  content = content.replace(/tru5t/gi, (match) => {
    if (match === match.toLowerCase()) return "trust";
    if (match === match.toUpperCase()) return "TRUST";
    return "Trust";
  });
  
  content = content.replace(/tru5yt/gi, (match) => {
    if (match === match.toLowerCase()) return "trust";
    if (match === match.toUpperCase()) return "TRUST";
    return "Trust";
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', filePath);
  }
});
