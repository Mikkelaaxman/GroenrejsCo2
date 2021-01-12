var test = require('unit.js');
describe('Creation of object', function(){
    it('Creation of object', function(){
        let trip = {};
        trip["km"] = 3;
        trip["travellers"] = 2;
        trip["advanced"] = 'Fossilbil';

        let co2 = '';

        test
            .when('"co2" becomes an object', function(){
                co2 = {
                    km: '657',
                    carElectric: (657 * 60) / 1000,
                    carHybrid: (657 * 180) / 1000,
                    carFossil: (657 * 120) / 1000,
                    extraKm: trip["km"]
                };
            })
            .then('test the "co2" object', function(){
                test
                    .object(co2)
                    .hasValue('657')
                    .hasProperty('extraKm')
                    .hasProperty('carElectric', (657 * 60) / 1000)
                    .contains({carFossil: (657 * 120) / 1000})
                ;
            })
    });
});

describe('Math assertions', function () {
    it('Assertion of number of cars and extra co2', function(){
        let cars = 1;
        let fullAmount = 5 + 1; //5 extra travellers chosen

        let object = {
            extraTransType: 'Hybridbil',
            extraCO2: 0,
            extraKm: 5 //5km med hybridbil er valgt.
        };

        for (let i = 0; i < fullAmount; i++) { if (i % 4 === 0){ cars = (i / 4) + 1; } }

        if (object["extraTransType"] === 'Hybridbil') { object["extraCO2"] = ((parseFloat(object["extraKm"]) * 80) / 1000) * cars; }

        test.assert(cars === 2);
        test.assert(object["extraCO2"] === 0.8);
    });

    it('Assertion of correct math', function(){
        let km = 657;
        let co2Hybrid = 80
        let fullco2 = (km * co2Hybrid) / 1000;

        test.assert(fullco2 === 52.56);
    });
});
