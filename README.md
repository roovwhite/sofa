# sofa
simplified adding CSS and JS from modules to HTML pages using Gulp

**Structure:**

```
|_modules
|       |_breadcrumbs
|       |           |_popup.js
|       |           |_style.scss
|       |           |_template.html
|       |           |_yellow-line.scss
|       |_menu
|             |_floating.js
|             |_style.scss
|             |_template.html
|
|_index.html
```

**gulp:**

```
const gulp = require('gulp');
const sofa = require('gulp-sofa-module');

function htmlBuild() {
    return gulp.src(path.to.html)
        .pipe(/* Any plugins */)
        .pipe(sofa({path:'./modules'}))
        .pipe(gulp.dest(config.build.html))
}
```
_path_ _{String}_ - directory path

_onePlace_ _{Boolean}_ - put all the module files in one directory with the name of the page. By default "false"
(styles - presently only *.scss)

_jsSourceMap_ _{Boolean}_ - include inline sourcemap in js file. By default "false".

_dest_ _{String}_ - destination folder (must match the gulp.dest)

**index.html**

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sofa</title>
</head>
<body>
@sofa:{"module":"menu"};
@sofa:{"module":"breadcrumbs", "extra":{"js":["popup"],"css":["yellow-line"]}};
</body>
</html>
```

**index.html (transformed)**

```
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Sofa</title>
</head>
<body>
<ul class="menu">
    <li class="menu__item">Menu:</li>
    <li class="menu__item"><a href="#">About</a></li>
    <li class="menu__item"><a href="#">One page</a></li>
    <li class="menu__item menu__current">Two page</li>
</ul>
<ul class="breadcrumbs">
    <li class="breadcrumbs__item"><a href="#">Home</a></li>
    <li class="breadcrumbs__item"><a href="#">Group</a></li>
    <li class="breadcrumbs__item breadcrumbs__current breadcrumbs_yellow">Subgroup</li>
</ul>

<link type="text/css" rel="stylesheet" href="./modules/menu/style.css">
<link type="text/css" rel="stylesheet" href="./modules/breadcrumbs/style.css">
<link type="text/css" rel="stylesheet" href="./modules/breadcrumbs/yellow-line.css">

<script type="text/javascript" src="./modules/breadcrumbs/popup.js"></script>
</body>
</html>
```

**Options**

_"module"_ _{String}_ directory name (or folder path)

_"extra"_: _{Object}_ - names of additional files

_excludeTemplate_: _{Boolean}_ - exclude html templates from processing. By default "false".