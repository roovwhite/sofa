# sofa
Simplified adding CSS and JS from modules to HTML pages using Gulp

**Structure:**

```
/
|- modules/
|       |- breadcrumbs/
|       |               |- popup.js
|       |               |- style.scss
|       |               |- template.html
|       |               |- yellow-line.scss
|       |- menu/
|               |- floating.js
|               |- style.scss
|               |- template.html
|
|- example.html
```

**gulp:**

```
const gulp = require('gulp');
const sofa = require('gulp-sofa-module');

function htmlBuild() {
    return gulp.src(path.to.html)
        .pipe(/* Any plugins */)
        .pipe(sofa({path:'./modules', inserts:{'js': '<!--forJS-->', css: '<!--forCSS-->'}}))
        .pipe(gulp.dest(path.build))
}
```
**Options for gulp**

/ **_required fields_** /

_path_ _{String}_ - path to the directory with modules

/ **_optional fields_** /

_insertPlace_ _{String}_ - tag before which links to files (js, css) will be established
( example: `sofa({insertPlace: '</body>'})` )
**(if not specified, default is insert before the '<\/head>')**

_inserts_ _{Object}_ - tags, before which links (separately for js and css) to files
will be set ( example: `sofa({inserts: {'js': '<!--forJS-->', css: '<!--forCSS-->'}` )
**(if not specified, default is insert before the '<\/head>')**

_compress_ _{Boolean}_ - compress files. By default "true".

_jsSourceMap_ _{Boolean}_ - include inline sourcemap in js file. By default "false".

_onePlace_ _{Boolean}_ - put all the module files in one directory with the name of the page.
By default "false" (**styles - currently only * .scss is supported**) **!required _'dest'_ option**

_dest_ _{String}_ - destination folder (must match the gulp.dest). For "onePlace".

**index.html**

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sofa</title>
    <!--forCSS-->
</head>
<body>
@sofa:{"module":"menu", "extra":{"js":["floating"]}, "anotherTemplate": "another"};
@sofa:{"module":"breadcrumbs", "extra":{"js":["popup"],"css":["yellow-line"]}};

<!--forJS-->
</body>
</html>
```
**Options for html**

_"module"_ _{String}_ directory name (or folder path)

_"extra"_: _{Object}_ - names of additional files

_noTemplate_: _{Boolean}_ - exclude html templates from processing. By default "false"

_anotherTemplate_: _{String}_ - html template name instead of default template.

**index.html (transformed)**

```
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sofa</title>
    <link type="text/css" rel="stylesheet" href="./modules/menu/style.css">
    <link type="text/css" rel="stylesheet" href="./modules/breadcrumbs/style.css">
    <link type="text/css" rel="stylesheet" href="./modules/breadcrumbs/yellow-line.css">
</head>
<body>
<ul class="menu">
    <li class="menu__item">Menu another:</li>
    <li class="menu__item"><a href="#">About Us</a></li>
    <li class="menu__item"><a href="#">Red page</a></li>
    <li class="menu__item menu__current">Blue page</li>
</ul>
<ul class="breadcrumbs">
    <li class="breadcrumbs__item"><a href="#">Home</a></li>
    <li class="breadcrumbs__item"><a href="#">Group</a></li>
    <li class="breadcrumbs__item breadcrumbs__current breadcrumbs_yellow">Subgroup</li>
</ul>

<script type="text/javascript" src="./modules/breadcrumbs/popup.js"></script>
</body>
</html>
```