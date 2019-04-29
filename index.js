const fs = require('fs');
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

function insertBeforeLastOccurrence(stringToSearch, stringToFind, stringToInsert) {
    let n = stringToSearch.lastIndexOf(stringToFind);
    if (n < 0) return stringToSearch;
    return stringToSearch.substring(0, n) + stringToInsert + stringToSearch.substring(n);
}

function sassConvert(doc, options) {

    console.log(options);

    return (sass.renderSync({
        data: doc,
        includePaths: [`${options.path}`],
        outputStyle: options.compress !== false ? 'compressed' : 'expanded'
    }))['css'].toString(); //expanded, compressed
}

function jsMinify(doc, jsSourceMap) {
    let sourcemap = jsSourceMap ? 'inline' : false;

    return transform(doc, {
        presets: [
            '@babel/preset-env',
            ['minify']
        ],
        comments: false,
        sourceMaps: sourcemap,
    });
}

function concatFiles(dirName, pathArray, jsSourceMap, options) {
    let extension = pathArray[0].split('.').pop() === 'js' ? 'js' : 'css';
    let filename = extension === 'js' ? 'main.js' : 'style.css';
    let jsFile;
    let jsString = '';

    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName);
    }

    if (extension === 'js') {
        pathArray.forEach( itemPath => {
            jsFile = fs.existsSync(itemPath) && fs.readFileSync(itemPath, 'utf8');
            jsString += `(function(){${jsFile}}());`;
        });

        jsString = jsMinify(jsString, jsSourceMap)['code'];

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
    let destination = options.dest ? `${options.dest}${filename}` : filename;

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
        let extra = includes[index]['extra'];

        if (includes[index]['noTemplate']) {
            template = '';
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
                let currentPath = `${modulePath}/style.css`;
                cssFilesPath += `${styleInsert.replace(/%s/g, currentPath)}\n`;
            }

            if (extra && extra['js']) {
                extra['js'].forEach( jsItem => {
                    jsFilesPath += `${jsInsert.replace(/%s/g, `${modulePath}/${jsItem}.js`)}\n`;
                });
            }

            if (extra && extra['css']) {
                extra['css'].forEach( cssItem => {
                    cssFilesPath += `${styleInsert.replace(/%s/g, `${modulePath}/${cssItem}.css`)}\n`;
                });
            }
        }
    });

    if (options.onePlace && jsFilesPathArr.length) {
        concatFiles(destination, jsFilesPathArr, options.jsSourceMap);
        jsFilesPath = `${jsInsert.replace(/%s/g, './main.js')}`;
    }

    if (options.onePlace && cssFilesPathArr.length) {
        concatFiles(destination, cssFilesPathArr, null, options);
        cssFilesPath = `${styleInsert.replace(/%s/g, `./style.css`)}`;
    }

    if (options.insert) {
        modifiedFile = insertBeforeLastOccurrence(modifiedFile, options.insert.css, `${cssFilesPath}\n`);
        modifiedFile = insertBeforeLastOccurrence(modifiedFile, options.insert.js, `${jsFilesPath}\n`);
    } else {
        modifiedFile = insertBeforeLastOccurrence(modifiedFile, options.insertPlace, `${cssFilesPath}\n${jsFilesPath}\n`);
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