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
    },
    ups: function(country, price, shipping) {
        var dutyfee = Math.max((price + shipping) * 0.03, 25.15);

        return dutyfee;
    }
}

// vat by product type
var vatByProductType = {
    any: 0.081,
    books: 0.026,
    food: 0.026,
    magazines: 0.026,
    pharmaceuticals: 0.026
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
            vatOnWorth: 18.70
            duty: 29.00,
            vatOnDuty: 2.30,
            costs: 50.00,
            total: 283.50,
            limit: 63.00,
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
    r.vatOnWorth = _(r.worth * r.taxrate);
    r.vatOnDuty = _(r.duty * r.taxrate);
    r.totalDuty = r.duty + r.vatOnDuty
    r.costs = r.vatOnWorth + r.totalDuty;
    r.total = r.worth + r.costs;

    // Per https://www.post.ch/en/business-solutions/exports-imports-and-customs-clearance/imports/faqs-about-imports-customs-and-vat,
    // consignments are exempt from duties if the goods do not exceed 65 CHF for
    // products with VAT 7.7% and 200 CHF for products with VAT 2.5%. These
    // limits are basically rounded up values for the resulting VAT being below
    // 5 CHF.
    r.limit = Math.ceil(5.0 / r.taxrate);
    r.hasToPay = r.worth > r.limit;

    return r;
}
