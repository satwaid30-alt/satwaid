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
        let lines = content.split('\n');
        let modified = false;

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];

            // Fix: className={`... (no closing `})
            // If a line has ={` and it's not closed on the same line or next few lines
            if (line.includes('={`') && !line.includes('`}') && !line.includes('`}')) {
                // Check if it's closed in the next few lines
                let found = false;
                for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
                    if (lines[j].includes('`}') || lines[j].includes('`}')) {
                        found = true;
                        break;
                    }
                    // If we see another attribute or tag close, it's probably broken
                    if (lines[j].trim().startsWith('className=') || lines[j].trim().startsWith('href=') || lines[j].trim().startsWith('onClick=') || lines[j].trim().startsWith('>')) {
                        break;
                    }
                }

                if (!found) {
                    // It's probably broken. Let's try to find where it SHOULD end.
                    // Usually it ends right before the next attribute or >
                    if (line.includes('={`') && !line.includes('`')) {
                         // This is a complex case, skip for now or fix manually
                    }
                }
            }
        }

        // Simpler approach: many files have:
        // className={`...
        //     ...
        //     `}
        // >
        // This is missing the ` after }
        
        let newContent = content;
        
        // Fix Pattern: className={`... `} (missing `)
        newContent = newContent.replace(/(className|href|key|src|title)=\{\s*`([^`}]*)\}/g, (match, attr, p2) => {
            if (!p2.includes('`')) {
                return `${attr}={\`${p2}\`}`;
            }
            return match;
        });

        // Fix Pattern: } (at end of multiline attribute) followed by > or another attribute
        // Usually missing ` before }
        // We'll look for:
        // }
        // >
        // and replace with
        // }`
        // >
        // Wait, the ` should be BEFORE the } if it's a template literal.
        // e.g. className={`...
        //      ...
        //      `}`}
        
        // Fix: } (missing `) before >
        newContent = newContent.replace(/}\s*>/g, (match) => {
             // This is too risky to automate blindly.
             return match;
        });

        // Let's use the patterns I found in dashboard/page.js
        
        // Fix: } followed by newline and > (common for multiline className)
        // Check if there was an unclosed ` earlier.
        
        // Actually, the most common error is:
        // className={`... `}
        // instead of
        // className={`...`}
        
        // Another common error:
        // href={`...
        //`} className="...
        
        newContent = newContent.replace(/href=\{`([^`}]*)\s+(className|onClick|target|rel)=/g, 'href={`$1`} $2=');
        newContent = newContent.replace(/className=\{`([^`}]*)\s+(onClick|onMouseEnter|onMouseLeave|style|id|disabled|type)=/g, 'className={`$1`} $2=');

        // Fix: } at the end of a line that started with className={`
        // but missing the ` before }
        let lines2 = newContent.split('\n');
        for (let i = 0; i < lines2.length; i++) {
            if (lines2[i].includes('className={`') && !lines2[i].includes('`}') && lines2[i].includes('}')) {
                // If it contains } but no ` before it
                let lastBrace = lines2[i].lastIndexOf('}');
                let lastBacktick = lines2[i].lastIndexOf('`');
                if (lastBacktick < lines2[i].indexOf('className={`') + 12 || lastBacktick < 0) {
                     // No closing backtick found for this line's className
                     lines2[i] = lines2[i].slice(0, lastBrace) + '`}' + lines2[i].slice(lastBrace + 1);
                }
            }
        }
        newContent = lines2.join('\n');

        if (newContent !== originalContent) {
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`Refined Fixed: ${file}`);
        }
    });
});
