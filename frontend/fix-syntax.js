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

        // Pattern: className={`... " `} -> className={`...` }
        content = content.replace(/className={`([^`}]*)`}/g, 'className={`$1`}');
        
        // Pattern: className={"... ` } -> className={"... `}
        content = content.replace(/className={"([^"}]*)}/g, (match, p1) => {
            if (p1.endsWith('`')) {
                return `className={"${p1.slice(0, -1)}"` + '}';
            }
            return match;
        });

        // More general fixes for template literals closed by quotes
        content = content.replace(/`([^`}]*)"}/g, '`$1`}');
        content = content.replace(/"([^"}]*)`}/g, '"$1"}');

        // Fix className={`...`} followed by quote/backtick
        content = content.replace(/className={`([^`}]*)`["`]}/g, 'className={`$1`}');
        
        // Fix for ${...} followed by incorrect closure
        content = content.replace(/}\s*["`]}/g, '}');

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Fixed: ${file}`);
        }
    });
});
