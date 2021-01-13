let map;
let markerOrigin, markerDestination;
let poly, geodesicPoly;
let geocoder;
let service;

function showOrHide(element){
    if (element.style.display === 'none') {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}

function submitForm(){
    let trip = {};

    trip["start"] = document.getElementById("origin").value;
    trip["end"] = document.getElementById("destination").value;
    trip["advanced"] = document.getElementById("advanced-search-drpdwn").value;
    trip["km"] = document.getElementById("extra-km").value; //TODO should be meters
    trip["travellers"] = document.getElementById("travellers").value;
    console.log(trip)
    getDistances(trip)
}

//Function for calculating distance between two points on earth https://en.wikipedia.org/wiki/Haversine_formula
function haversine_distance(mk1, mk2) {
    var R = 3958.8; // Radius of the Earth in miles
    var rlat1 = mk1.position.lat() * (Math.PI/180); // Convert degrees to radians
    var rlat2 = mk2.position.lat() * (Math.PI/180); // Convert degrees to radians
    var difflat = rlat2-rlat1; // Radian difference (latitudes)
    var difflon = (mk2.position.lng()-mk1.position.lng()) * (Math.PI/180); // Radian difference (longitudes)

    var d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat/2)*Math.sin(difflat/2)+Math.cos(rlat1)*Math.cos(rlat2)*Math.sin(difflon/2)*Math.sin(difflon/2)));
    return d;
}

/**
 * Initmap called with callback in google.api src in html
 * @author mikkelaaxman
 */
function initMap(){
    //init the map and zoom in on Denmark
    const myLatlng = {
        lat: 55.53,
        lng: 9.4,
    };
    var destinationIcon =
        "https://chart.googleapis.com/chart?" +
        "chst=d_map_pin_letter&chld=D|FF0000|000000";
    var originIcon =
        "https://chart.googleapis.com/chart?" +
        "chst=d_map_pin_letter&chld=O|FFFF00|000000";
    geocoder = new google.maps.Geocoder();
    service = new google.maps.DistanceMatrixService();

    map = new google.maps.Map(document.getElementById("map"), {
        center: myLatlng,
        zoom: 6,
    });

    //Init the two markers and listeners
    markerOrigin = new google.maps.Marker({
        //  map: null,  //Start invisible, use setMap(map) to show
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: myLatlng,
        icon: originIcon,
    });
    markerDestination = new google.maps.Marker({
        // map: map,
        draggable: true,
        animation: google.maps.Animation.DROP,
        position: myLatlng,
        icon: destinationIcon,
    });
    //listens for dragging of marker ends
    google.maps.event.addListener(markerDestination,'dragend',function(){

        geocodePosition(markerDestination.getPosition(), true)
        updateMarkerPath();
    });
    google.maps.event.addListener(markerOrigin,'dragend',function(){
        geocodePosition(markerOrigin.getPosition(), false)
        updateMarkerPath();
    });

    poly = new google.maps.Polyline({
        strokeColor: "#FF0000",
        strokeOpacity: 1.0,
        strokeWeight: 3,
        map: map,
    });
    geodesicPoly = new google.maps.Polyline({
        strokeColor: "#CC0099",
        strokeOpacity: 1.0,
        strokeWeight: 3,
        geodesic: true,
        map: map,
    });
}

/**
 * The method for getting distance between two addresses for car, train and plane.
 * Creates distance object containing:
 * "flightDistanceValue"    in meters
 * "origin"
 * "destination"
 * "carDistanceText"    i.e. 1.15 km
 * "carDistanceValue"   in meters
 * "carDurationText"    time in plain text
 * "carDurationValue"   in seconds
 * "railDistanceValue"
 * "railDistanceText"
 * "railDurationValue"
 * "railDurationText"   in seconds
 * @param trip
 * @author Mikkelaaxman
 */
function getDistances(trip) {
    "use strict";

    let distances = {};
    var bounds = new google.maps.LatLngBounds();
    var origin1 = trip["start"].toString();
    var destinationA = trip["end"].toString();

    service.getDistanceMatrix(
        {
            origins: [origin1], //More origins or destinations can be added
            destinations: [destinationA],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
        },
        function (response, status) {
            if (status !== "OK") {
                alert("Error was: " + status);
            } else {
                var originList = response.originAddresses;
                var destinationList = response.destinationAddresses;

                geocoder.geocode({ address: originList[0] }, (results, status) => {
                    if (status === "OK") {
                        map.fitBounds(bounds.extend(results[0].geometry.location));
                        markerOrigin.setPosition(results[0].geometry.location);
                        markerOrigin.setMap(map);

                    } else {
                        alert("Geocode was not successful for the following reason: " + status);
                    }
                });
                geocoder.geocode({ address: destinationList[0] }, (results, status) => {
                    if (status === "OK") {
                        map.fitBounds(bounds.extend(results[0].geometry.location));
                        markerDestination.setPosition(results[0].geometry.location);
                        markerDestination.setMap(map);

                        updateMarkerPath(); //Draw a new line between points

                    } else {
                        alert("Geocode was not successful for the following reason: " + status);
                    }
                });
                //finding distance by plane:
                distances["flightDistanceValue"]=haversine_distance(markerOrigin, markerDestination);

                //Adding car route info to distances object
                distances["origin"] = originList[0];
                distances["destination"] = destinationList[0];
                distances["carDistanceText"] = response.rows[0].elements[0].distance.text;
                distances["carDistanceValue"] = response.rows[0].elements[0].distance.value;
                distances["carDurationText"] = response.rows[0].elements[0].duration.text;
                distances["carDurationValue"] = response.rows[0].elements[0].duration.value;

            }
        }
    );
    //Finding distance by RAIL (trains, subway etc)
    service.getDistanceMatrix({
            origins: [origin1], //More origins or destinations can be added
            destinations: [destinationA],
            travelMode: 'TRANSIT',
            transitOptions:
                {
                    // arrivalTime: Date,    // OPTIONAL Defaults to now (that is, the current time) if no value is specified for either departureTime or arrivalTime
                    // departureTime: Date,
                    modes: ['RAIL'],
                    // routingPreference: TransitRoutePreference
                },
            unitSystem: google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
        },
        function (response, status) {
            if (status !== "OK") {
                alert("Error was: " + status);
            } else {
                //TODO Vi tager bare første resultat fra google, måske find den korteste
                //TODO Bug i response.rows[0].elements[0].distance.value, tror den ikke overskriver korrekt
                distances["railDistanceValue"] = response.rows[0].elements[0].distance.value;
                distances["railDistanceText"] = response.rows[0].elements[0].distance.text;
                distances["railDurationValue"] = response.rows[0].elements[0].duration.value;
                distances["railDurationText"] = response.rows[0].elements[0].duration.text;
                calcCo2(distances, trip);
            }
        }
    );
}

/**
 * Takes a position (perhaps from marker.getPosition()) and a boolean for placement,
 * and returns address to the correct input field in html
 * @param pos
 * @param asDestination Boolean: false if origin, true if destination
 * @author mikkelaaxman
 */
function geocodePosition(pos, asDestination) {
    var field = asDestination ? document.getElementById("destination") : document.getElementById("origin");
    geocoder.geocode({
        latLng: pos
    }, function(responses) {
        if (responses && responses.length > 0) {
            field.value = String(responses[0].formatted_address);
        } else {
            alert("Cannot determine address at this location")
        }
    });
}

/**
 * Draws a geodesic line (curves with the earth) between the two markers
 * @author mikkelaaxman
 */
function updateMarkerPath() {

    var path = [markerOrigin.getPosition(), markerDestination.getPosition()];
    //  poly.setPath(path);
    geodesicPoly.setPath(path);

    //Heading of path in degrees.
    const heading = google.maps.geometry.spherical.computeHeading(
        path[0],
        path[1]
    );
    console.log("Heading" + String(heading));
}

function calcCo2(distances, trip){
    let km = (distances["carDistanceValue"] / 1000).toString();
    km = parseFloat(km.replace(/,/g, ''));
    km = (km + parseFloat(trip["km"])) * (parseFloat(trip["travellers"]) + 1);

    let co2 = {}; // kg co2 / km
    co2["km"] = km;
    co2["carElectric"] = ((km * 60) / 1000).toFixed(4); //advanced
    co2["carHybrid"] = ((km * 80) / 1000).toFixed(4); //advanced
    co2["carFossil"] = ((km * 120) / 1000).toFixed(4); //result
    co2["train"] = ((km * 40) / 1000).toFixed(4); //result
    co2["bus"] = ((km * 80) / 1000).toFixed(4); //result
    co2["domesticFlight"] = ((km * 180) / 1000).toFixed(4); //advanced
    co2["longDistFlight"] = ((km * 220) / 1000).toFixed(4); //result
    co2["extraKm"] = trip["km"];
    co2["extraTravellers"] = trip["travellers"];
    co2["extraTransType"] = trip["advanced"];
    co2["extraCO2"] = 0;
    calculateExtra(co2);
    appendResult(co2);
}

//todo: antal folk i bil obs
function calculateExtra(object){
    let cars = 1;
    let fullAmount = parseFloat(object["extraTravellers"]) + 1;

    for (let i = 0; i < fullAmount; i++) { if (i % 4 === 0){ cars = (i / 4) + 1; } }

    if (object["extraTransType"] === 'Hybridbil') { object["extraCO2"] = ((parseFloat(object["extraKm"]) * 80) / 1000) * cars; }
    if (object["extraTransType"] === 'Elbil') { object["extraCO2"] = ((parseFloat(object["extraKm"]) * 60) / 1000) * cars; }
    if (object["extraTransType"] === 'Fossilbil') { object["extraCO2"] = ((parseFloat(object["extraKm"]) * 120) / 1000) * cars; }

    if(object["extraTransType"] === 'Indenrigsfly'){ object["extraCO2"] = (parseFloat(object["extraKm"]) * 180) / 1000; }
    if(object["extraTransType"] === 'Udenrigsfly'){ object["extraCO2"] = (parseFloat(object["extraKm"]) * 220) / 1000; }
    if(object["extraTransType"] === 'Tog'){ object["extraCO2"] = (parseFloat(object["extraKm"]) * 40) / 1000; }
    if(object["extraTransType"] === 'Bus'){ object["extraCO2"] = (parseFloat(object["extraKm"]) * 80) / 1000; }
}

function appendResult(object){
    let result = document.getElementById("output");
    let forBar = document.getElementById("for-bar-chart");
    let advancedResult = document.getElementById("advanced-result");
    let resultDiv = document.getElementById("result-table");
    let advancedResultDiv = document.getElementById("advanced-result-table");
    let barChart = document.getElementById("bar-container");
    let extra = document.getElementById("extra-km-div");
    // let amount = document.getElementById("travelllers");
    let km = parseFloat(object["km"]) - parseFloat(object["extraKm"]);
    let extraCO2 = parseFloat(object["extraCO2"]);

    if (resultDiv !== null){
        resultDiv.remove();
        advancedResultDiv.remove();
        barChart.remove();
        forBar.insertAdjacentHTML("afterend","<div id='bar-container' style='width: 31vw; height:60vh'></div>");
    }

    if (extra !== null){
        extra.remove();
    }

    // if (object["extraKm"] !== '0' || object["extraTravellers"] !== '0') {
    //     result.insertAdjacentHTML("afterend", "<div id='extra-km-div'>Der er valgt " + object["extraKm"] + "km ekstra via " + object["extraTransType"].toLowerCase() +
    //         " for " + object["extraTravellers"] + " ekstra personer." +
    //         " for " + object["extraTravellers"] + " ekstra personer." +
    //         " Dette er " + extraCO2 + "CO<sub>2</sub>/kg ekstra.</div>")
    // }

    result.insertAdjacentHTML("afterend", "<div id='result-table'>" +
        "<table class='styled-table' id='result-table'><tr><th>Transportmiddel</th><th class='right-align'>kg CO<sub>2</sub></th></tr> " +
        "<tr class='active-row'><td>Train</td><td class='right-align'>" + object['train'] + "</td></tr> " +
        "<tr><td>Bus</td><td class='right-align'>" + object['bus'] + "</td></tr>" +
        "<tr><td>Fossilbil</td><td class='right-align'>" + object['carFossil'] + "</td></tr>" +
        "<tr><td>Fly</td><td class='right-align'>" + object['longDistFlight'] + "</td></tr>" +
        "<tr><td>Ekstra</td><td class='right-align'>" + extraCO2 + "</td></tr></table></div>");


    advancedResult.insertAdjacentHTML("afterbegin", "<div id='advanced-result-table'><table class='styled-table' id='advanced-table'><tr><th>Transportmiddel</th><th>kg CO<sub>2</sub></th><th class='right-align'>Udregning</th></tr> " +
        "<tr class='active-row'><td>Train</td><td>" + object['train'] + "</td><td class='right-align'> (" + object['km'] + " * 40CO<sub>2</sub>/g) / 1000 = " + object['train'] + "</td></tr> " +
        "<tr><td>Bus</td><td>" + object['bus'] + "</td><td class='right-align'> (" + object['km'] + " * 80CO<sub>2</sub>/g) / 1000 = " + object['bus'] + "</td></tr>" +
        "<tr><td>El-bil</td><td>" + object['carElectric'] + "</td><td class='right-align'> (" + object['km'] + " * 60CO<sub>2</sub>/g) / 1000 = " + object['carElectric'] + "</td></tr>" +
        "<tr><td>Hybridbil</td><td>" + object['carHybrid'] + "</td><td class='right-align'> (" + object['km'] + " * 80CO<sub>2</sub>/g) / 1000 = " + object['carHybrid'] + "</td></tr>" +
        "<tr><td>Fossilbil</td><td>" + object['carFossil'] + "</td><td class='right-align'> (" + object['km'] + " * 120CO<sub>2</sub>/g) / 1000 = " + object['carFossil'] + "</td></tr>" +
        "<tr><td>Indenrigsfly</td><td>" + object['domesticFlight'] + "</td><td class='right-align'> (" + object['km'] + " * 180CO<sub>2</sub>/g) / 1000 = " + object['domesticFlight'] + "</td></tr>" +
        "<tr><td>Udenrigsfly</td><td>" + object['longDistFlight'] + "</td><td class='right-align'> (" + object['km'] + " * 220CO<sub>2</sub>/g) / 1000 = " + object['longDistFlight'] + "</td></tr></table></div>"
    );

    createBarChart(object);
}

function createBarChart(object){
    anychart.onDocumentReady(function() {

        let data = {
            header: ["Transport", "CO2/kg"],
            rows: [
                ["Tog", object["train"]],
                ["Bus", object["bus"]],
                ["El-bil", object["carElectric"]],
                ["Hybridbil", object["carHybrid"]],
                ["Fossilbil", object["carFossil"]],
                ["IndenrigsFly", object["domesticFlight"]],
                ["Udenrigsfly", object["longDistFlight"]]
            ]};

        let chart = anychart.bar();
        chart.data(data);
        chart.title("CO2 forbrug");
        chart.container("bar-container");
        chart.draw();
    });
}
