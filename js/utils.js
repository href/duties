// call the given function for each item in the list
function each(items, fn) {
    for (var i = 0; i < items.length; i++) {
        fn(items[i], i);
    }
}

// call the given function for element matching the selector
function eachElement(selector, fn) {
    return each(document.querySelectorAll(selector), fn);
}


// call the given function once the everyone else is done
function defer(fn) {
    setTimeout(fn, 0);
}


// merge the given objects, accepts n arguments
function extend() {
    var result = {};

    each(arguments, function(o) {
         for (var attrname in o) {
            result[attrname] = o[attrname];
        }
    });

    return result;
}


// ensures that the given function is always run against the given input's
// value - first with the initial value and then whenever it's changed
function ensure(el, fn) {
    el.addEventListener('change', fn);
    fn.call(el);
}

// lightweight implementation of jquery's document.ready
function ready(fn) {
    if (document.readyState === "complete") {
        defer(fn);
    } else {
        document.addEventListener("DOMContentLoaded", fn, false);
    }
}


// dynamically load the given js file
function loadjs(url) {
    var el = document.createElement('script');
    el.type = 'text/javascript';
    el.src = url;
    document.body.appendChild(el);
}


// return the computed css property of the given element
function getComputedProperty(element, property) {
    return window.getComputedStyle(element, null).getPropertyValue(property);
}
