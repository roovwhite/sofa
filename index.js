const fs = require('fs');
const path = require('path');
const sass = require('sass');
const postcss = require('postcss');
const through = require('through2').obj;
const transform = require("@babel/core").transformSync;
const autoprefixer = require('autoprefixer');
const concat = require('concat');
const rgx = /@sofa:(.*?);/g;

let html = 'template.html';
let style = 'style.scss';
let jsInsert = '<script type="text/javascript" src="%s"></script>';
let styleInsert = '<link type="text/css" rel="stylesheet" href="%s">';

function insertBeforeLastOccurrence(stringToSearch, stringToFind, stringToInsert, clearTag) {
    let n = stringToSearch.lastIndexOf(stringToFind);
    if (n < 0) return stringToSearch;

    if (clearTag) {
        stringToSearch = stringToSearch.replace(stringToFind, '');
    }

    return stringToSearch.substring(0, n) + stringToInsert + stringToSearch.substring(n);
}

function sassConvert(doc, options) {

    return (sass.renderSync({
        data: doc,
        includePaths: [`${options.path}`],
        outputStyle: options.compress !== false ? 'compressed' : 'expanded'
    }))['css'].toString(); //expanded, compressed
}

function jsMinify(doc, options) {

    let sourcemap = options.jsSourceMap ? 'inline' : false;
    let compressed = options.compress !== false ? 'minify' : '';

    return transform(doc, {
        presets: [
            '@babel/preset-env',
            [compressed]
        ],
        comments: false,
        sourceMaps: sourcemap,
    });
}

function checkDest(dest) {
    let destination = dest;

    if (destination.slice(-1) !== '/') {
        destination += '/';
    }

    return destination;
}

function concatFiles(dirName, pathArray, options) {
    let extension = pathArray[0].split('.').pop() === 'js' ? 'js' : 'css';
    let filename = extension === 'js' ? 'main.js' : 'style.css';
    let sep = path.sep;
    let initDir = path.isAbsolute(dirName) ? sep : '';
    let jsString = '';
    let jsFile;

    if (!fs.existsSync(dirName)) {
        dirName.split(sep).reduce((parentDir, childDir) => {
            let curDir = path.resolve(parentDir, childDir);

            if (!fs.existsSync(curDir)) {
                fs.mkdirSync(curDir);
            }

            return curDir;
        }, initDir);
    }

    if (extension === 'js') {
        pathArray.forEach( itemPath => {
            jsFile = fs.existsSync(itemPath) && fs.readFileSync(itemPath, 'utf8');
            jsString += `(function(){${jsFile}}());`;
        });

        jsString = jsMinify(jsString, options)['code'];

        fs.writeFileSync(`${dirName}/${filename}`, jsString, err => {
            if (err) {
                return console.error(err);
            }
        });
    }

    if (extension === 'css') {
        concat(pathArray)
            .then( result => {
                let css = sassConvert(result, options);

                postcss([ autoprefixer ]).process(css, {from: 'undefined'}).then(function (cssResult) {
                    cssResult.warnings().forEach(function (warn) {
                        console.warn(warn.toString());
                    });

                    fs.writeFileSync(`${dirName}/${filename}`, cssResult.css, err => {
                        if (err) {
                            return console.error(err);
                        }
                    });
                });
            });
    }
}

function templateEngine(file, options) {
    let filename = ((file.path).replace(/^.*[\\\/]/, '') ).split('.').slice(0, -1).join('.');
    let modifiedFile = file.contents.toString();
    let array = modifiedFile.match(rgx);
    let includes;
    let template;
    let cssFilesPath = '';
    let jsFilesPath = '';
    let cssFilesPathArr = [];
    let jsFilesPathArr = [];
    let destinationFolder = options.dest ? `${checkDest(options.dest)}${filename}` : filename;

    if (!array || !array.length) return;

    /**
     * Get {Object} parameters
     */
    includes = array.map( item => {
        let str = item.replace('@sofa:', '');

        return JSON.parse(str.replace(';', ''));
    });

    array.forEach( (item, index) => {
        let modulePath = `${options.path}/${includes[index]['module']}`;
        let pathBuild = options.pathBuild ? `${options.pathBuild}/${includes[index]['module']}` : `${options.path}/${includes[index]['module']}`;
        let extra = includes[index]['extra'];

        if (includes[index]['noTemplate']) {
            template = '';
        } else if (includes[index]['anotherTemplate']) {
            template = fs.readFileSync(`${modulePath}/${includes[index]['anotherTemplate']}.html`, 'utf8');
        } else {
            template = fs.readFileSync(`${modulePath}/${html}`, 'utf8');
        }

        modifiedFile = modifiedFile.replace(item, template);

        if (options.onePlace) {

            if (extra && extra['js']) {
                extra['js'].forEach( jsItem => {
                    jsFilesPathArr.push(`${modulePath}/${jsItem}.js`);
                });
            }

            cssFilesPathArr.push(`${modulePath}/${style}`);

            if (extra && extra['css']) {
                extra['css'].forEach( cssItem => {
                    cssFilesPathArr.push(`${modulePath}/${cssItem}.scss`);
                });
            }
        } else {

            if (fs.existsSync(`${modulePath}/${style}`)) {
                cssFilesPath += `${styleInsert.replace(/%s/g, `${pathBuild}/style.css`)}\n`;
            }

            if (extra && extra['js']) {
                extra['js'].forEach( jsItem => {
                    jsFilesPath += `${jsInsert.replace(/%s/g, `${pathBuild}/${jsItem}.js`)}\n`;
                });
            }

            if (extra && extra['css']) {
                extra['css'].forEach( cssItem => {
                    cssFilesPath += `${styleInsert.replace(/%s/g, `${pathBuild}/${cssItem}.css`)}\n`;
                });
            }
        }
    });

    if (options.onePlace && jsFilesPathArr.length) {
        concatFiles(destinationFolder, jsFilesPathArr, options);
        jsFilesPath = `${jsInsert.replace(/%s/g, './main.js')}`;
    }

    if (options.onePlace && cssFilesPathArr.length) {
        concatFiles(destinationFolder, cssFilesPathArr, options);
        cssFilesPath = `${styleInsert.replace(/%s/g, `./style.css`)}`;
    }

    if (options.inserts) {
        modifiedFile = insertBeforeLastOccurrence(modifiedFile, options.inserts.css, `${cssFilesPath}`, true);
        modifiedFile = insertBeforeLastOccurrence(modifiedFile, options.inserts.js, `${jsFilesPath}`, true);
    } else if (options.insertPlace) {
        modifiedFile = insertBeforeLastOccurrence(modifiedFile, options.insertPlace, `${cssFilesPath}\n${jsFilesPath}\n`);
    } else {
        modifiedFile = insertBeforeLastOccurrence(modifiedFile, '</head>', `${cssFilesPath}\n${jsFilesPath}\n`);
    }

    if (modifiedFile && options.onePlace) {
        fs.writeFileSync(`${destinationFolder}/index.html`, Buffer.from(modifiedFile), err => {
            if (err) {
                return console.error(err);
            }
        });
    }

    return modifiedFile;
}

module.exports = options => {

    return through( (file, encoding, callback) => {
        let fileModify = templateEngine(file, options);

        if (!fileModify) return;

        file.contents = Buffer.from(fileModify);

        callback(null, file);
    });
};