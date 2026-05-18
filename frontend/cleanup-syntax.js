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
        
        // Fix: ${variable} -> ${variable}
        content = content.replace(/\$\{([^`}]*)`}/g, '${$1}');

        if (content !== originalContent) {
            fs.writeFileSync(file, content, 'utf8');
            console.log(`Cleaned: ${file}`);
        }
    });
});
