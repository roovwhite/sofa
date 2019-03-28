const fs = require('fs');
const through = require('through2').obj;
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

function templateEngine(file, dir) {
    let string = file.contents.toString();
    let array = string.match(rgx);
    let includes;
    let template;
    let cssFilesPath = '';
    let jsFilesPath = '';

    /**
     * Get {Object} parameters
     */
    includes = array.map( item => {
        let str = item.replace('@sofa:', '');

        return JSON.parse(str.replace(';', ''));
    });

    array.forEach( (item, index) => {
        let modulePath = `${dir['path']}/${includes[index]['module']}`;
        let extra = includes[index]['extra'];

        template = fs.readFileSync(`${modulePath}/${html}`, 'utf8');
        string = string.replace(item, template);

        if (fs.existsSync(`${modulePath}/${style}`)) {
            let currentPath = `${modulePath}/style.css`;
            cssFilesPath += `${styleInsert.replace(/%s/g, currentPath)}\n`;
        }

        if (extra && extra['js']) {
            extra['js'].forEach( item => {
                jsFilesPath += `${jsInsert.replace(/%s/g, `${modulePath}/${item}.js`)}\n`;
            });
        }

        if (extra && extra['css']) {
            extra['css'].forEach( item => {
                cssFilesPath += `${styleInsert.replace(/%s/g, `${modulePath}/${item}.css`)}\n`;
            });
        }
    });

    string = insertBeforeLastOccurrence(string, '</body>', `${cssFilesPath}\n${jsFilesPath}`);

    return string;
}

module.exports = path => {

    return through( (file, encoding, callback) => {
        let fileModify = templateEngine(file, path);

        file.contents = Buffer.from(fileModify);

        callback(null, file);
    });
};