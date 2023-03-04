// courier fee calculation
var courierFees = {
    post: function(country, price, shipping, taxrate, over1t) {
        var dutyfee = 16.00;
        var expenses = (price + shipping) * 0.03;

        switch(country) {
            case 'austria':
            case 'germany':
            case 'italy':
            case 'france':
                dutyfee = 11.50;
                break;
        }

        return Math.min(dutyfee + expenses, 70.0);
    },
    dhl: function(country, price, shipping, taxrate, over1t) {
        var dutyfee = (price < 1000.00 && !over1t) && 19.00 || 39.50;
        var expenses = (price + shipping) * taxrate * 0.02;

        return dutyfee + expenses;
    }
}

// vat by product type
var vatByProductType = {
    any: 0.077,
    books: 0.025,
    food: 0.025,
    magazines: 0.025,
    pharmaceuticals: 0.025
}

// same as parseFloat, but with a default if parsing impossible
function parseFloatDefault(number, defaultValue) {
    var parsed = parseFloat(number);

    if (isNaN(parsed)) {
        return defaultValue;
    }

    return parsed;
}


// round to five cents
function roundToFiveCents(number) {
    return Math.round((number * 100)/5) * 5 / 100;
}

// takes a form element and returns the calculateDuties parameters
function parametersByForm(form) {

    var getValue = function(selector) {
        return form.querySelector(selector).value;
    };

    var isChecked = function(selector) {
        return form.querySelector(selector).checked;
    };

    var getPrice = function() {
        return parseFloatDefault(getValue('input[name="price"]'), 0.00);
    };

    var getShipping = function() {
        return parseFloatDefault(getValue('input[name="shipping"]'), 0.00);
    };

    var isOver1t = function() {
        return getValue('select[name="weight"]') == 'heavy';
    };

    var getTaxRate = function() {
        return vatByProductType[getValue('select[name="product"]')];
    };

    var getFee = function() {
        var courier = getValue('select[name="courier"]');
        var country = getValue('select[name="country"]');

        return courierFees[courier](
            country,
            getPrice(),
            getShipping(),
            getTaxRate(),
            isOver1t()
        );
    };

    return {
        price: getPrice(),
        shipping: getShipping(),
        fee: getFee(),
        taxrate: getTaxRate()
    };
}


/*
    calculates the duties

    for example:

        var result = calculateDuties({
            price: 200,
            shipping: 33.50,
            fee: 16,
            storage: 0,
            taxrate: 0.08
        });

    returns:

        {
            price: 200.00,
            shipping: 33.50,
            worth: 233.50,
            fee: 16.00,
            storage: 233.50,
            taxrate: 0.08,
            vat: 21.00,
            duty: 29.00,
            costs: 50.00,
            total: 283.50,
            hasToPay: true,
        }

    Note: storage defaults to zero
*/
function calculateDuties(parameters) {
    var r = extend({storage: 0}, parameters);

    for (key in r) {
        r[key] = parseFloatDefault(r[key], 0);
    }

    var _ = roundToFiveCents;

    r.worth = _(r.price + r.shipping);
    r.duty = _(r.fee + r.storage);
    r.vat = _((r.worth + r.duty) * r.taxrate);
    r.costs = _(r.vat + r.duty);
    r.total = _(r.worth + r.costs);
    r.hasToPay = r.vat >= 5.0;

    return r;
}
