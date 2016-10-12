/*

    Bare bones tests-framework, runs if included on the page. Results
    are shown in the console.

    To include in page open site with the #tests fragment. For example:
    ../index.html#tests
    https://www.duties.ch#tests

    Testsfunctions are functions which begin with 'test';

*/
function assert(condition, message) {
    if (!condition) {
        console.log('✗ ' + message);
    }
}


function runTests() {
    var prefix = 'test';
    var tests = [];
    var count = 0;

    each(Object.keys(window), function(key) {
        if (key.indexOf(prefix) == 0) {
            console.log("Running " + key);

            try {
                window[key]();    
            } catch(e) {
                console.log(e);
            }
            
            count++;
        }
    })

    console.log('Ran ' + count + ' tests');
}


function equal(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
}


function testEachChars() {
    var elements = [];

    each('abc', function(char) {
        elements.push(char);
    });

    assert (equal(elements,['a', 'b', 'c']), "each works with chars");
}


function testEachSelector() {
    var count = 0;

    eachElement('body', function() {
        count++;
    });

    assert (count == 1, "each works with selectors");
}


function testParseFloatDefault() {
    assert (parseFloatDefault('321', 123) == 321, "parse float success");
    assert (parseFloatDefault('foobar', 123) == 123, "parse float fallback");
}


function testRoundToFiveCents() {
    assert (roundToFiveCents(1.11) == 1.10, "round down");
    assert (roundToFiveCents(1.14) == 1.15, "round up");
}


function testExtend() {
    assert (equal(extend(
            {'a': 'b'}
         ), {'a': 'b'}
    ), "identity");

    assert (equal(extend(
            {'a': 'b'}, {'c': 'd'}
         ), {'a': 'b', 'c': 'd'}
    ), "binary merge");

    assert (equal(extend(
            {'a': 'b'}, {'c': 'd'}, {'e': 'f'}
         ), {'a': 'b', 'c': 'd', 'e': 'f'}
    ), "ternary merge");

    assert (equal(extend(
            {'a': 'b'}, {'a': '1'}
         ), {'a': '1'}
    ), "override");
}


function testPostfinanceFormula() {
    var result = calculateDuties({
        price: 200,
        shipping: 33.50,
        fee: 16,
        storage: 13,
        taxrate: 0.08
    });

    assert (result.price == 200.00, "price");
    assert (result.shipping == 33.50, "shipping")
    assert (result.fee == 16.00, "fee");
    assert (result.storage == 13.00, "storage");
    assert (result.taxrate == 0.08, "taxrate");
    assert (result.worth == 233.50, "worth");
    
    assert (result.vat == 21.55, "vat");
    assert (result.expenses == 7.00, "expenses");
    assert (result.duty == 36.00, "duty");
    assert (result.costs == 57.55, "total taxes");
    assert (result.total == 291.05, "total costs");
}


runTests();