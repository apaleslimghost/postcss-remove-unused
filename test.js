const expect = require('@quarterto/chai');
const postcss = require('postcss');
const removeUnused = require('./');

const process = (css, html, options = {}) => postcss([
	removeUnused(Object.assign({html}, options))
]).process(css).toString();

module.exports = {
	'should remove an unused rule'() {
		expect(
			process(`
.foo {
	color: blue;
}

.bar {
	color: red;
}
`,
				'<div class="foo"></div>'
			)
		).to.equal(`
.foo {
	color: blue;
}
`);
	},

	'should leave @keyframes intact'() {
		expect(
			process(`
@keyframes foo {
	0% { color: red }
}
`,
				''
			)
		).to.equal(`
@keyframes foo {
	0% { color: red }
}
`);
	},

	'should leave unqualified :not() intact'() {
		expect(
			process(`
:not(.bar) {
	color: blue;
}
:not(.baz) {
	color: green;
}
`,
				'<div class="foo bar"></div>'
			)
		).to.equal(`
:not(.bar) {
	color: blue;
}
:not(.baz) {
	color: green;
}
`);
	},

	'should test qualified :not() selectors, ignoring the :not()'() {
		expect(
			process(`
.foo:not(.bar) {
	color: blue;
}
.baz:not(.foo) {
	color: red;
}
#bing .foo:not(.bar) {
	color: green;
}
#bing .foo:not(.bar) a {
	color: gray;
}
#bing .foo:not(.bar) span {
	color: yellow;
}
.foo:not(.bar) a {
	color: blue;
}
`,
				'<div id="bing"><div class="foo bar"><span></span></div></div>'
			)
		).to.equal(`
.foo:not(.bar) {
	color: blue;
}
#bing .foo:not(.bar) {
	color: green;
}
#bing .foo:not(.bar) span {
	color: yellow;
}
`);
	},

	'should test pseudoelements based on their parent'() {
		expect(
			process(`
.foo::before {
	color: blue;
}

.bar::before {
	color: red;
}
`,
				'<div class="foo"></div>'
			)
		).to.equal(`
.foo::before {
	color: blue;
}
`);
	},

	'should test double pseudoelements based on their parent'() {
		expect(
			process(`
.foo::hover::before {
	color: blue;
}
.bar::hover::before {
	color: red;
}
`,
				'<div class="foo"></div>'
			)
		).to.equal(`
.foo::hover::before {
	color: blue;
}
`);
	},

	'should test pseudoclasses based on their parent'() {
		expect(
			process(`
.foo:first-child {
	color: blue;
}

.bar:first-child {
	color: red;
}
`,
				'<div class="foo"></div>'
			)
		).to.equal(`
.foo:first-child {
	color: blue;
}
`);
	},

	'should work with attribute selectors'() {
		expect(
			process(`
[title] {
	color: blue;
}
[name] {
	color: red;
}
.foo[title] {
	color: green;
}
`,
				'<div class="foo" title="baz"></div>'
			)
		).to.equal(`
[title] {
	color: blue;
}
.foo[title] {
	color: green;
}
`);
	},

	'should work with attribute selectors containing a ":"'() {
		expect(
			process(`
[foo\\:bar] {
	color: blue;
}
[foo\\:baz] {
	color: red;
}
`,
				'<div foo:bar></div>'
			)
		).to.equal(`
[foo\\:bar] {
	color: blue;
}
`);
	},

	preserveFlags: {
		'should preserve section if flag is true'() {
			expect(
				process(`
.foo {
	color: blue;
}

/* pru:startPreserve(bar) */
.bar {
	color: red;
}
/* pru:endPreserve(bar) */
`,
					'<div class="foo"></div>',
					{preserveFlags: {bar: true}}
				)
			).to.equal(`
.foo {
	color: blue;
}

/* pru:startPreserve(bar) */
.bar {
	color: red;
}
/* pru:endPreserve(bar) */
`);
		},

		'should remove section if flag is false'() {
			expect(
				process(`
.foo {
	color: blue;
}

/* pru:startPreserve(bar) */
.bar {
	color: red;
}
/* pru:endPreserve(bar) */
`,
					'<div class="foo"></div>',
					{preserveFlags: {bar: false}}
				)
			).to.equal(`
.foo {
	color: blue;
}

/* pru:startPreserve(bar) */
/* pru:endPreserve(bar) */
`);
		}
	},

	selectorFilter: {
		'should keep a selector that would otherwise not be kept'() {
			expect(
				process(`
.foo {
	color: blue;
}

.foo.bar {
	color: red;
}
`,
					'<div class="foo"></div>',
					{selectorFilter: selector => selector.replace(/(\.foo)\.bar/g, '$1')}
				)
			).to.equal(`
.foo {
	color: blue;
}

.foo.bar {
	color: red;
}
`);
		}
	}
};
