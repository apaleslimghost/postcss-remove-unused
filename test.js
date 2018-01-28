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

	'should leave :not() intact'() {
		expect(
			process(`
.foo:not(.bar) {
	color: red;
}
`,
				'<div class="foo bar"></div>'
			)
		).to.equal(`
.foo:not(.bar) {
	color: red;
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
