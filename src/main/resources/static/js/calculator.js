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
*  vis rute på kort? flere stop på vejen
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


/*
                       // distances["origin"] = originList[i]
                        // distances["destination"] = destinationList[j]
                        distances["vehicle"] = "Car";    //TODO set vehicle
                        distances["distance"] = results[j].distance.text;
                        distances["duration"] = results[j].duration.text;
*/

                    }
                }
            }
        }
    );
  //  calcCo2(distances);
}
function calcCo2(distances){
    //console.log(distances["distance"].toString())
}
function deleteMarkers(markersArray) {
    for (var i = 0; i < markersArray.length; i++) {
        markersArray[i].setMap(null);
    }

    markersArray = [];
}
