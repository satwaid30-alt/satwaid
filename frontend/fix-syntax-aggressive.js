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
        
        // Fix: className={`... `} -> className={`...` }
        // We match className={` until we find } and check if it has a trailing "
        content = content.replace(/(className|href|key|src|title)=\{\s*`([^}]*)\`}/g, '$1={`$2`}');
        
        // Fix: className={"... ` } -> className={"... " }
        content = content.replace(/(className|href|key|src|title)=\{\s*\"([^}]*)`}/g, '$1={"$2"}');

        // Fix multiline className endings
        // Pattern: ... ${...} ... " }
        // Replaced with: ... ${...} ... ` }
        content = content.replace(/className=\{`([\s\S]*?)\"\s*}/g, (match, p1) => {
            return 'className={`' + p1 + '`}';
        });

        // Fix multiline href endings
        content = content.replace(/href=\{`([\s\S]*?)\"\s*}/g, (match, p1) => {
            return 'href={`' + p1 + '`}';
        });

        // Fix multiline key endings
        content = content.replace(/key=\{`([\s\S]*?)\"\s*}/g, (match, p1) => {
            return 'key={`' + p1 + '`}';
        });

        // Fix cases where a backtick is missing before }
        content = content.replace(/`([\s\S]*?)\s*}/g, (match, p1) => {
            // If it contains ${ but no closing ` before the }
            if (p1.includes('${') && !p1.includes('`')) {
                return '`' + p1 + '`}';
            }
            return match;
        });

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Aggressive Fixed: ${file}`);
        }
    });
});
