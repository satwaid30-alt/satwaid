const fs = require('fs');
const path = require('path');

function walk(dir, done) {
    let results = [];
    fs.readdir(dir, (err, list) => {
        if (err) return done(err);
        let pending = list.length;
        if (!pending) return done(null, results);
        list.forEach(file => {
            file = path.resolve(dir, file);
            fs.stat(file, (err, stat) => {
                if (stat && stat.isDirectory()) {
                    if (file.includes('node_modules') || file.includes('.next')) {
                        if (!--pending) done(null, results);
                    } else {
                        walk(file, (err, res) => {
                            results = results.concat(res);
                            if (!--pending) done(null, results);
                        });
                    }
                } else {
                    if (file.endsWith('.js') || file.endsWith('.jsx')) {
                        results.push(file);
                    }
                    if (!--pending) done(null, results);
                }
            });
        });
    });
}

const frontendDir = 'd:\\oky\\Koding\\blog-reptile\\frontend';

walk(frontendDir, (err, files) => {
    if (err) throw err;
    files.forEach(file => {
        let content = fs.readFileSync(file, 'utf8');
        let originalContent = content;
        
        let newContent = content;
        
        // Pattern: href={`...`} className="... (missing closing backtick and brace)
        newContent = newContent.replace(/href=\{`([^`}]*)\s+className=/g, 'href={`$1`} className=');
        newContent = newContent.replace(/href=\{`([^`}]*)\s+onClick=/g, 'href={`$1`} onClick=');
        newContent = newContent.replace(/href=\{`([^`}]*)\s+target=/g, 'href={`$1`} target=');
        
        // Pattern: className={`... `} (missing `)
        newContent = newContent.replace(/(className|href|key|src|title)=\{\s*`([^`}]*)\}/g, (match, attr, p2) => {
            if (!p2.includes('`')) {
                return `${attr}={\`${p2}\`}`;
            }
            return match;
        });

        // More aggressive: any attribute starting with ={` and ending with } but no ` in between
        newContent = newContent.replace(/([a-zA-Z]+)=\{\s*`([^`}]*)\}/g, (match, attr, p2) => {
            if (!p2.includes('`')) {
                return `${attr}={\`${p2}\`}`;
            }
            return match;
        });

        // Fix line-by-line unclosed attributes
        let lines = newContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            // Fix unclosed className={`...`} that ends with >
            // Example: className={`...` } > -> className={`...`} >
            // But if it's missing the backtick: className={`... `} > -> className={`...`} >
            if (line.includes('className={`') && line.includes('`}') && line.includes('>') && !line.includes('`}')) {
                 let lastBrace = line.lastIndexOf('}');
                 let lastBacktick = line.lastIndexOf('`');
                 if (lastBacktick < line.indexOf('className={`') + 10) {
                      lines[i] = line.slice(0, lastBrace) + '`}' + line.slice(lastBrace + 1);
                 }
            }

            // Fix unclosed href={`...`} that ends with >
            if (line.includes('href={`') && line.includes('`}') && line.includes('>') && !line.includes('`}')) {
                 let lastBrace = line.lastIndexOf('}');
                 let lastBacktick = line.lastIndexOf('`');
                 if (lastBacktick < line.indexOf('href={`') + 7) {
                      lines[i] = line.slice(0, lastBrace) + '`}' + line.slice(lastBrace + 1);
                 }
            }
        }
        newContent = lines.join('\n');

        // Fix multiline className endings
        // Pattern:
        //    ...
        //    }
        // >
        // Replaced with:
        //    ...
        //    }`}
        // >
        // We'll search for } followed by > on the next line if the current block started with className={`
        let lines3 = newContent.split('\n');
        for (let i = 0; i < lines3.length - 1; i++) {
            if (lines3[i].trim() === '`}' && lines3[i+1].trim().startsWith('>') && !lines3[i].includes('`')) {
                // Check if we are inside a JSX tag and a className={` was opened
                // This is hard to be 100% sure, but we can look back a few lines
                let foundOpen = false;
                for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
                    if (lines3[j].includes('className={`') || lines3[j].includes('href={`')) {
                        foundOpen = true;
                        break;
                    `}
                    if (lines3[j].includes('<')) break;
                }
                if (foundOpen) {
                    lines3[i] = lines3[i].replace('}', '`}');
                }
            }
        }
        newContent = lines3.join('\n');

        if (newContent !== originalContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Final Fixed: ${file}`);
        }
    });
});
