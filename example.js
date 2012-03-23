var Gateway = require('../../node-sapgw/sapgw'),
    eyes = require('eyes'),
    inspect = eyes.inspector({ maxLength: false });

var flightService = new Gateway({
    username: 'USERNAME',  // replace
    password: 'PASSWORD',  // replace
    host: 'gw.esworkplace.sap.com',
    service: '/sap/opu/odata/IWBEP/RMTSAMPLEFLIGHT_2'
})

function getFlights () {
    flightService.request('FlightCollection', function (flights) {
        inspect(flights);
    });
};

function getFirstFlight () {
    flightService.request('FlightCollection', function (flights) {
        var firstFlight = flights[0];

        flightService.request(firstFlight.id, function (flight) {
            inspect(flight)
        });

    });
};

function getMetadata () {
    flightService.metadata(function (metadata) {
        inspect(metadata)
    })
}

function getCollections () {
    flightService.collections(function (collections) {
        inspect(collections)
    })
}



getFlights()

//getMetadata();

//getCollections();