function showOrHide(element){
    if (element.style.display === 'none') {
        element.style.display = "block";
    } else {
        element.style.display = "none";
    }
}

function submitForm(){
    let trip = {};

    trip["to"] = document.getElementById("start").value;
    trip["end"] = document.getElementById("end").value;
    trip["advanced"] = document.getElementById("advanced-search-drpdwn").value;
    trip["km"] = document.getElementById("extra-km").value;
    trip["travellers"] = document.getElementById("travellers").value;
    console.log(trip)
}
