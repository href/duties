// all browsers but webkit seem to add a hidden select padding, which we
// need to account for to get the correct select width
var profile = {
    // account for builtin <select /> paddings
    selectPadding: (function(ua) {
        if (ua.indexOf("iPad") > -1) return 1;
        if (ua.indexOf("iPhone") > -1) return 1;
        if (ua.indexOf("WebKit") === -1) return 6;
        if (ua.indexOf("Edge") > -1) return 5;

        return 0;
    })(window.navigator.userAgent)
};


// calculate the width of the text with the given font properties
// can be done with canvas.measureText, but this is a more cross-browser
// compatible solution
function estimateTextWidth(text, fontWeight, fontSize, fontFamily) {
    var el = document.createElement('el');
    el.innerHTML = text;

    el.style.fontWeight = fontWeight;
    el.style.fontSize = fontSize;
    el.style.fontFamily = fontFamily;
    el.style.visibility = 'hidden';

    document.querySelector('body').parentNode.insertBefore(el, null);

    var width = el.offsetWidth;
    el.remove();
    return width;
}


// tighten the select width of *this* element
function tightenSelectWidth() {
    var text = this.options[this.options.selectedIndex].text;

    var width = estimateTextWidth(text,
        getComputedProperty(this, 'font-weight'),
        getComputedProperty(this, 'font-size'),
        getComputedProperty(this, 'font-family')
    );

    this.style.width = width + profile.selectPadding + 'px';
}


// conditional elements use a "data-show-if" attribute, including the
// input value another element needs for the block to show.
//
// e.g. <div data-show-if="email=info@example.org">
function setupConditionalElement(element) {
    var condition = element.dataset.showIf.split("=");
    var name = condition[0];
    var value = condition[1];
    var display = getComputedProperty(element, 'display');

    var target = document.querySelector('[name="' + name + '"]');

    ensure(target, function() {
        window.target = target;

        if (target.value === value) {
            element.style.display = display;
        } else {
            element.style.display = 'none';
        }
    });
}


/*
    The text in select boxes can't be right aligned, unless we change the
    direction to right-to-left, which is a bad hack.

    What we can do however, is estimate the length of the currently shown
    text of the selectbox and tighten the width of the select box to just
    this text.

    To do this we need to estimate the size of the text in the select box
    and then adjust the width
*/
ready(function() {
    eachElement('select', function(el) {
        ensure(el, tightenSelectWidth);
    });
});


/*
    When users click on an input element we want the whole text to be selected
*/
ready(function() {
    eachElement('input[type="number"]', function(el) {
        el.addEventListener('click', function() {
            this.select();

            try {
                this.selectionStart = 0;
                this.selectionEnd = 999;
            } catch (error) {
                // Chrome doesn't support selections done this way
            }
        });
    });
});


/*
    Whenever the number element is changed, format it nicely and make sure
    the default value is 0.00.
*/
ready(function() {
    var formatNumber = function() {
        var value = roundToFiveCents(parseFloatDefault(this.value, 0))

        // firefox will ignore our formatting, but everywhere else it works
        this.value = value.toFixed(2);
    };

    eachElement('input[type="number"]', function(el) {
        ensure(el, formatNumber);
    });
});


/*
    Load javascript files lazily by looking at html fragments.
*/
ready(function() {
    var hasFragment = function(url, fragment) {
        return url.indexOf(fragment) > -1;
    };

    eachElement('*[data-if-fragment]', function(el) {
        if (hasFragment(window.location.href, el.dataset.ifFragment)) {
            loadjs(el.dataset.src);
        }
    });
});


/*
    Setup form block dependencies.
*/
ready(function() {
    eachElement('*[data-show-if]', setupConditionalElement);
});


/*
    Hookup the calcuation machinery
*/
ready(function() {
    var form = document.querySelector('form');

    var changeResultMood = function(type) {
        eachElement('.negative', function(el) {
            el.style.display = type == 'positive' && 'none' || 'block';
        });
        eachElement('.positive', function(el) {
            el.style.display = type == 'positive' && 'block' || 'none';
        });
    }

    var updateResult = function() {
        var result = calculateDuties(parametersByForm(form));

        if (result.hasToPay) {
            changeResultMood('negative');
        } else {
            changeResultMood('positive');
        }

        eachElement('.result-costs', function(el) {
            el.innerHTML = result.costs.toFixed(2);
        });

        eachElement('.result-vat', function(el) {
            if ((result.price + result.shipping) === 0) {
                el.innerHTML = '0.00';
            } else {
                el.innerHTML = result.vat.toFixed(2);
            }
        });

        eachElement('.result-duty', function(el) {
            el.innerHTML = result.duty.toFixed(2);
        });

        eachElement('.result-taxrate', function(el) {
            if ((result.taxrate * 1000 % 10) > 0) {
                el.innerHTML = (result.taxrate * 100).toFixed(1);
            } else {
                el.innerHTML = (result.taxrate * 100).toFixed(0);
            }
        });
    }

    eachElement('form input, form select', function(el) {
        ensure(el, updateResult);
    });
})
