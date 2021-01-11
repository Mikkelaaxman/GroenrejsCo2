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
    trip["km"] = document.getElementById("extra-km").value;
    trip["travellers"] = document.getElementById("travellers").value;
    console.log(trip)
    getDistances(trip)
}

let map;

//Initmap called with callback in google.api src in html
function initMap(){
    //init the map and zoom in on europe
    map = new google.maps.Map(document.getElementById("map"), {
        center: {
            lat: 55.53,
            lng: 9.4,
        },
        zoom: 6,
    });
}

/*TODO send array videre til ny calc function der sender vehicle og km til output view?
*  vis rute på kort?
* */

function getDistances(trip) {
    "use strict";
    let distances = {};
    var bounds = new google.maps.LatLngBounds();
    var markersArray = [];
    var origin1 = trip["start"].toString();
    var destinationA = trip["end"].toString();
    var destinationIcon =
        "https://chart.googleapis.com/chart?" +
        "chst=d_map_pin_letter&chld=D|FF0000|000000";
    var originIcon =
        "https://chart.googleapis.com/chart?" +
        "chst=d_map_pin_letter&chld=O|FFFF00|000000";


    var geocoder = new google.maps.Geocoder();
    var service = new google.maps.DistanceMatrixService();
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
                var outputDiv = document.getElementById("output");
                outputDiv.innerHTML = "";   //TODO show results properly

                //Showing origin and destination markers on map
                deleteMarkers(markersArray);  //TODO markers arent being deleted
                var showGeocodedAddressOnMap = function showGeocodedAddressOnMap(
                    asDestination
                ) {
                    var icon = asDestination ? destinationIcon : originIcon;
                    return function (results, status) {
                        if (status === "OK") {
                            map.fitBounds(bounds.extend(results[0].geometry.location));
                            markersArray.push(
                                new google.maps.Marker({
                                    map: map,
                                    position: results[0].geometry.location,
                                    icon: icon,
                                })
                            );
                        } else {
                            alert("Geocode was not successful due to: " + status);
                        }
                    };
                };

                for (var i = 0; i < originList.length; i++) {
                    var results = response.rows[i].elements;
                    geocoder.geocode(
                        {
                            address: originList[i],
                        },
                        showGeocodedAddressOnMap(false)
                    );

                    for (var j = 0; j < results.length; j++) {
                        geocoder.geocode(
                            {
                                address: destinationList[j],
                            },
                            showGeocodedAddressOnMap(true)
                        );
                        outputDiv.innerHTML +=
                            originList[i] +
                            " to " +
                            destinationList[j] +
                            ": " +
                            results[j].distance.text +
                            " in " +
                            results[j].duration.text +
                            "<br>";

                        distances["origin"] = originList[i]
                        distances["destination"] = destinationList[j]
                        distances["vehicle"] = "Car";    //TODO set vehicle
                        distances["distance"] = results[j].distance.text;
                        distances["duration"] = results[j].duration.text;
                        calcCo2(distances);
                        return;
                    }
                }
            }
        }
    );
}

function calcCo2(distances){
    let km = parseInt(distances["distance"].toString());

    let co2 = {}; // kg co2 / km
    co2["km"] = km;
    co2["carElectric"] = (km * 60) / 1000; //advanced
    co2["carHybrid"] = (km * 80) / 1000; //advanced
    co2["carFossil"] = (km * 120) / 1000; //result
    co2["train"] = (km * 40) / 1000; //result
    co2["bus"] = (km * 80) / 1000; //result
    co2["domesticFlight"] = (km * 180) / 1000; //advanced
    co2["longDistFlight"] = (km * 220) / 1000; //result
    console.log(co2);
    appendResult(co2);
}

function appendResult(object){
    let result = document.getElementById("output");
    let advancedResult = document.getElementById("advanced-result");
    let resultDiv = document.getElementById("result-table");
    let advancedResultDiv = document.getElementById("advanced-result-table");

    if (resultDiv !== null){
        resultDiv.remove();
        advancedResultDiv.remove();
    }

    result.insertAdjacentHTML("afterend", "<div id='result-table'><table><tr><th>Transportmiddel</th><th>kg CO<sub>2</sub>/km</th></tr> " +
        "<tr><td>Fossilbil</td><td>" + object['carFossil'] + "</td></tr>" +
        "<tr><td>Train</td><td>" + object['train'] + "</td></tr> " +
        "<tr><td>Bus</td><td>" + object['bus'] + "</td></tr>" +
        "<tr><td>Fly</td><td>" + object['longDistFlight'] + "</td></tr></table></div>");
    console.log("has been appended")

    advancedResult.insertAdjacentHTML("afterbegin", "<div id='advanced-result-table'><table><tr><th>Transportmiddel</th><th>kg CO<sub>2</sub>/km</th><th>Udregning</th></tr> " +
        "<tr><td>Elbil</td><td>" + object['carElectric'] + "</td><td> (" + object['km'] + " * 60CO<sub>2</sub>/g) / 1000 = " + object['carElectric'] + "</td></tr>" +
        "<tr><td>Hybridbil</td><td>" + object['carHybrid'] + "</td><td> (" + object['km'] + " * 80CO<sub>2</sub>/g) / 1000 = " + object['carHybrid'] + "</td></tr>" +
        "<tr><td>Fossilbil</td><td>" + object['carFossil'] + "</td><td> (" + object['km'] + " * 120CO<sub>2</sub>/g) / 1000 = " + object['carFossil'] + "</td></tr>" +
        "<tr><td>Train</td><td>" + object['train'] + "</td><td> (" + object['km'] + " * 40CO<sub>2</sub>/g) / 1000 = " + object['train'] + "</td></tr> " +
        "<tr><td>Bus</td><td>" + object['bus'] + "</td><td> (" + object['km'] + " * 80CO<sub>2</sub>/g) / 1000 = " + object['bus'] + "</td></tr>" +
        "<tr><td>Indenrigsfly</td><td>" + object['domesticFlight'] + "</td><td> (" + object['km'] + " * 180CO<sub>2</sub>/g) / 1000 = " + object['domesticFlight'] + "</td></tr>" +
        "<tr><td>Udenrigsfly</td><td>" + object['longDistFlight'] + "</td><td> (" + object['km'] + " * 220CO<sub>2</sub>/g) / 1000 = " + object['longDistFlight'] + "</td></tr></table></div>"
    );
}

function deleteMarkers(markersArray) {
    for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
    }

    markersArray = [];
}
