const cheerio = require('cheerio');
const postcss = require('postcss');

const maybe = fn => {
	try {
		return fn();
	} catch (err) {
		return false;
	}
};

module.exports = postcss.plugin('postcss-remove-unused', ({html, preserveFlags = {}, selectorFilter}) => {
	const $ = cheerio.load(html);
	let preserve = false;
	// Matches for selectors that contain standalone `:not()` selectors.
	//     **matches**
	//         :not(.foo)
	//         .foo(.foo), :not(.foo)
	//         .bar, :not(.foo), .baz
	//     **doesn't match**
	//         .bar:not(.foo)
	//         .bar :not(.foo)
	//         :not(.foo) .bar
	const STANDALONE_NOT_SELECTOR_RE = /(?:^|,)\s*:not\s*\(.*?\)\s*(?:$|,)/;
	// Matches pseudo-selectors, with a negative-look behind **like** capture group to prevent matching
	// escaped colons.
	//     **matches**
	//         :first-child:hover
	//         :nth-child(2n + 1)
	//         :not('.foo')
	//     **doesn't match**
	//         [ng\:cloak]
	const PSEUDO_SELECTOR_RE = /([^:\\])(?:::?[\w-]+(?:\(.*?\))?)+/g;

	return css => css.walk(node => {
		switch (node.type) {
			case 'rule': {
				if (preserve) {
					return;
				}

				if (node.parent.name === 'keyframes') {
					return;
				}

				if (node.selector) {
					const usedSelectors = [];
					// iterate over each selector in a rule to see if it is used
					node.selector.split(',').forEach(s => {
						if (STANDALONE_NOT_SELECTOR_RE.test(s)) {
							usedSelectors.push(s);
						} else {
							let selector = s.replace(PSEUDO_SELECTOR_RE, '$1');
							if (selectorFilter) {
								selector = selectorFilter(selector);
							}
							if (!maybe(() => $(selector).length === 0)) {
								usedSelectors.push(s);
							}
						}
					});

					if (usedSelectors.length === 0) {
						node.remove();
					} else {
						node.selector = usedSelectors.join(',');
					}
				}

				break;
			}

			case 'comment': {
				const [matches, action, flag] = node.text.match(/pru:(\w+)\((\w+)\)/) || [false];
				if (matches && preserveFlags[flag]) {
					if (action === 'startPreserve') {
						preserve = true;
					} else if (action === 'endPreserve') {
						preserve = false;
					}
				}
				break;
			}

			default: {
				// noop
			}
		}
	});
});
