# SAPGW - Node.js connector for SAP NetWeaver Gateway
This module helps you to connect your Node.js application to SAP NetWeaver Gateway.
SAP Gateway offers access to business data in SAP ERP, CRM, SRM etc. Communication with SAP Gateway is 
based on [OData](http://odata.org), using the AtomPub XML format 

## Install

    npm install sapgw

## Usage

The module exports a constructor Gateway, which you can use to configure a Gateway service.

Currently the following methods are provided:

* request( id, callback): fetch an entity or collection from the Gateway service
* metadata (callback): fetch the metadata description and pass as JavaScript object to callback function 
* collections (callback): fetch the collections (consumption model) and pass as JavaScript to callback

The example.js file shows how to use the module. 

    node example.js

```javascript
var Gateway = require('sapgw'),
    eyes = require('eyes'),
    inspect = eyes.inspector({ maxLength: false });

var flightService = new Gateway({
    username: 'USERNAME',
    password: 'PASSWORD',
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


// Try calling any of these functions :
//getFlights()

//getCollections();

//getMetadata();

```



