# postcss-remove-unused

parse html and remove css rules that don't match

## installation

```sh
npm install --save postcss-remove-unused
```

## usage

```js
const postcss = require('postcss');
const removeUnused = require('postcss-remove-unused');

postcss([
	removeUnused({html: '<h1 class="foo">hello</h1>'})
]).process(css);
```

postcss-remove-unused parses your html string with [cheerio](https://github.com/cheeriojs/cheerio) and removes any css rules that don't match elements in the html. if there's a css rule it can't determine statically, such as pseudoclasses, it's left in.

### `preserveFlags`

if you need to conditionally preserve some blocks of css (e.g. some pages have lazy-loaded content), surround the css with `/* pru:startPreserve(flag) */` and `/* pru:endPreserve(flag) */` comments, then set the flag name in `preserveFlags` in the options:

#### style.css
```css
h1 {
	font-size: 3em;
}

/* pru:startPreserve(lazy) */
.lazy-load {
	color: red;
}
/* pru:endPreserve(lazy) */
```

#### render-css.js
```js
const postcss = require('postcss');
const removeUnused = require('postcss-remove-unused');

function renderCss(css, html, hasLazyLoad) {
	return postcss([
		removeUnused({
			html,
			preserveFlags: {
				lazy: hasLazyLoad
			}
		})
	]).process(css);
}
```

## prior art

postcss-remove-unused is heavily inspired by [uncss](https://github.com/giakki/uncss). there's a few major differences:

- postcss-remove-unused can only be used as a postcss plugin, and doesn't support standalone use or loading html from files
- uncss uses phantomjs, whereas postcss-remove-unused uses cheerio. in practice, this means:
	- uncss can determine what css rules are being used far more accurately and almost always produces smaller output
	- uncss can load multiple stylesheets
	- uncss only needs to be given the html file and can load stylesheets from `<link>` and `<style>` tags
	- postcss-remove-unused is an order of magnitude faster; on moderately-sized html and css it typically runs in less than a second
- uncss is far more configurable and battle-tested

## licence

isc. &copy; matt brennan
