let map = L.map('map').setView([11.018517663012247, 76.93562716614899], 17);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

let buildings = [];

let userLocation = null;
let userMarker = null;

let userIcon = L.icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/128/684/684908.png", // change this
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -30]
});


let isinNavigation = false;
let watchId = null;

let routeControl;

let lastUserMoveTime = 0;

fetch('buildings.json')
    .then(response => response.json())
    .then(data => {
        buildings = data;
        loadMarkers();
    })
    .catch(error => {
        console.error("Error loading JSON:", error);
    });

document.querySelector(".voiceSearch").addEventListener("click", () => {
    startVoice();
})

document.querySelector(".searchBtn").onclick = () => {
    searchLocation();
};
document.querySelector(".navigateBtn").onclick = () => {
    showNavigation();
};

document.querySelector(".directionBtn").onclick = () => {
    navigateRoute();
};

document.querySelector(".current-location").onclick = () => {
    useMyLocation();
};

document.getElementById("searchBox").addEventListener("input", () => {
    showDropdown("searchBox", "searchDropdown");
});

document.getElementById("startBox").addEventListener("input", () => {
    showDropdown("startBox", "startDropdown");
});

document.getElementById("endBox").addEventListener("input", () => {
    showDropdown("endBox", "endDropdown");
});

document.querySelector(".current-location-icon").onclick = () => {
    document.getElementById("startBox").value = "My Location";
    useMyLocation();
}


function loadMarkers(){

    let customIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/128/1397/1397898.png",
        iconSize: [30, 30],
        iconAnchor: [15, 30],
        popupAnchor: [0, -30]
    });

    buildings.forEach(building => {

        L.marker([building.lat, building.lng], {icon: customIcon})
            .addTo(map)
            .bindPopup(building.name);

    });
}

function searchLocation(){
    let input = document.getElementById("searchBox").value.toLowerCase().trim();

    document.getElementById("searchBox").value = "";

    for(let i=0; i<buildings.length; i++){
        if(buildings[i].name.toLowerCase().includes(input)){
            map.setView([buildings[i].lat, buildings[i].lng], 18);
            L.popup()
            .setLatLng([buildings[i].lat, buildings[i].lng])
            .setContent(buildings[i].name)
            .openOn(map);
            return;
        } 
        
    }
    alert("Location not found!");
}

document.getElementById("searchBox").addEventListener("keypress", (e) => {
    if(e.key === "Enter"){
        searchLocation();
    }
});


function showNavigation(){
    isinNavigation = !isinNavigation;

    document.getElementById("navBox").style.display = 
        isinNavigation ? "block" : "none";
}

map.on('movestart', () => {
lastUserMoveTime = Date.now();
});

function useMyLocation(){

    if(!navigator.geolocation){
        alert("Geolocation not supported");
        return;
    }

    if(watchId){
        navigator.geolocation.clearWatch(watchId);
    }

    watchId = navigator.geolocation.watchPosition(
        (position) => {
            let lat = position.coords.latitude;
            let lng = position.coords.longitude;

            userLocation = [lat, lng];

            if(!userMarker){
                userMarker = L.marker([lat, lng], {icon: userIcon})
                    .addTo(map)
                    .bindPopup("You are here");
            } else {
                userMarker.setLatLng([lat, lng]);
            }
                    let now = Date.now();

                    if(now - lastUserMoveTime > 5000){
                        map.setView([lat, lng], 18);
                    }
        }, 
        (error) => {
            console.log(error);
            alert("Location error: " + error.message);
        },
                {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 30000
        }
    );
}


function navigateRoute(){

    let startInput = document.getElementById("startBox").value.toLowerCase().trim();
    let endInput = document.getElementById("endBox").value.toLowerCase().trim();

    let start = null;
    let destination = null;

    for(let i=0; i<buildings.length; i++){

        if(document.getElementById("startBox").value === "My Location"){
            if(startInput === "my location"){
                if(!userLocation){
                    alert("Pleasse enable location first");
                    return;
                }
            start = userLocation;
            }
        }
        
        else if(buildings[i].name.toLowerCase().includes(startInput)){
            start = [buildings[i].lat, buildings[i].lng];
        }
        
        if(buildings[i].name.toLowerCase().includes(endInput)){
            destination = [buildings[i].lat, buildings[i].lng];
        }
    }

    if(!start || !destination){
            alert("Invalid starting point or destination");
            return;
        }

    if(routeControl){
        map.removeControl(routeControl);
    }


    routeControl = L.Routing.control({
        waypoints: [
            L.latLng(start[0], start[1]),
            L.latLng(destination[0], destination[1])
        ],
        routeWhileDragging: false,
        router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1'
        })
    }).addTo(map);
    map.setView(destination, 18);
}

function showDropdown(inputId, dropdownId){

    let input = document.getElementById(inputId).value.toLowerCase();
    let dropdown = document.getElementById(dropdownId);
    
    dropdown.innerHTML = "";

    if(input==="") return;

    buildings.forEach((building) => {

        if(building.name.toLowerCase().includes(input)){

            let option = document.createElement("div");
            option.innerText = building.name;
            dropdown.appendChild(option);

            option.onclick = () => {
                document.getElementById(inputId).value = building.name;
                dropdown.innerHTML = "";
            }
        }
    });
}

function startVoice(){
    let recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    recognition.lang = "en-In";
    recognition.start();

    recognition.onstart = () => {
        console.log("Listening...");
    };

    recognition.onresult = (event) => {
        let speechText = event.results[0][0].transcript.toLowerCase().trim();

        console.log("You said: ", speechText);

        document.getElementById("searchBox").value = speechText;
        searchLocation();
    };

    recognition.onerror = (e) => {
        console.log("Error: " + e.error);
        alert("Voice error: " + e.error) ;
    }
}