String.prototype.hashCode = function () {
    var hash = 0,
        i,
        chr;
    if (this.length === 0) return hash;
    for (i = 0; i < this.length; i++) {
        chr = this.charCodeAt(i);
        hash = (hash << 5) - hash + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
};
String.prototype.toHHMMSS = function () {
    let sec_num = parseInt(this, 10); // don't forget the second param
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - hours * 3600) / 60);
    let seconds = sec_num - hours * 3600 - minutes * 60;

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }
    if (seconds < 10) {
        seconds = "0" + seconds;
    }
    return hours + ":" + minutes + ":" + seconds;
};

String.prototype.toHHMM = function () {
    let sec_num = parseInt(this, 10); // don't forget the second param
    let hours = Math.floor(sec_num / 3600);
    let minutes = Math.floor((sec_num - hours * 3600) / 60);

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    if (hours < 1) {
        return minutes + "min";
    } else {
        return hours + "h" + minutes;
    }
};

String.prototype.toHours = function () {
    let date = getDateFromIso(this.toString());
    let hours = date.getHours();
    let minutes = date.getMinutes();

    if (hours < 10) {
        hours = "0" + hours;
    }
    if (minutes < 10) {
        minutes = "0" + minutes;
    }

    return hours + ":" + minutes;
};

Date.prototype.addDays = function (days) {
    let date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
};

function eventDispatcher(eventName, node = document) {
    console.log(eventName, node);
    return node.dispatchEvent(
        new CustomEvent(eventName, {
            bubbles: true,
            cancelable: true,
            detail: this,
        })
    );
}

function toggleJourneysList(show = true) {
    const journeysToggle = document.querySelector(".journeys__list__toggle");
    const journeysHolder = document.querySelector(".journeys__list__holder");

    if (journeysHolder) {
        if (show) {
            journeysToggle.textContent = "<";
            journeysHolder.classList.add("open");
        } else {
            journeysToggle.textContent = ">";
            journeysHolder.classList.remove("open");
        }
    }
}

function getDateFromIso(date) {
    const { year, month, day, hours, minutes, seconds } = date.match(
        /(?<year>\d{4})(?<month>\d{2})(?<day>\d{2})T(?<hours>\d{2})(?<minutes>\d{2})(?<seconds>\d{2})/,
        "ig"
    ).groups;
    return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}`);
}

function toYYYYMMDD(date, separator = "-") {
    return [
        date.getFullYear(),
        ("0" + (date.getMonth() + 1)).slice(-2),
        ("0" + date.getDate()).slice(-2),
    ].join(separator);
}

function updateDateTime() {
    const dateTime = document.querySelector("#datetime");
    const frontDateTime = document.querySelector("#front_datetime");

    if (dateTime && frontDateTime && frontDateTime.value) {
        const currentUserDate = new Date(frontDateTime.value);

        dateTime.value = toYYYYMMDD(currentUserDate, "") + "T000000";
    }
}

window.forceCache = false;
window.currentJourneysLayers = [];
window.currentJourneysLayersCoordinates = [];
window.currentJourneysMarkers = [];

window.addEventListener("DOMContentLoaded", () => {
    // Handle api key
    window.sncfAPIKey = localStorage.getItem("sncf-api-key") || "";
    const apiInput = document.querySelector("#api_key");

    if (apiInput) {
        apiInput.value = window.sncfAPIKey;

        function setAPIKey(e) {
            window.sncfAPIKey = apiInput.value;
            localStorage.setItem("sncf-api-key", window.sncfAPIKey);
        }

        apiInput.addEventListener("input", setAPIKey);
        apiInput.addEventListener("paste", setAPIKey);
    }

    // Handle day choice
    const frontDateTime = document.querySelector("#front_datetime");

    if (frontDateTime) {
        const today = toYYYYMMDD(new Date());
        frontDateTime.setAttribute("min", today);
        frontDateTime.value = today;
        frontDateTime.setAttribute("max", toYYYYMMDD(new Date().addDays(20)));
        updateDateTime();
    }

    frontDateTime.addEventListener("change", updateDateTime);

    const saveSearchInstance = new SaveSearch();
    const invertSearchInstance = new InvertSearch();
    const mapInstance = new MapSNCF();
    const form = document.querySelector(".search");

    if (form) {
        const autocompleteInstanceFrom = new AutocompleteSNCF(
            form,
            form.querySelector("#from"),
            mapInstance
        );
        const autocompleteInstanceTo = new AutocompleteSNCF(
            form,
            form.querySelector("#to"),
            mapInstance
        );

        const submit = form.querySelector("button.between");

        if (submit) {
            submit.addEventListener("click", (e) => {
                e.preventDefault();

                mapInstance.searchAPI_SNCF();
                toggleJourneysList();
            });

            document.addEventListener("launch-map-search", () => {
                mapInstance.searchAPI_SNCF();
                toggleJourneysList();
            });
        }
        const departures = form.querySelector("button.departures");
        const departure = form.querySelector("#departure");

        if (departures && departure) {
            const autocompleteInstanceDepartures = new AutocompleteSNCF(
                form,
                departure,
                mapInstance
            );

            departures.addEventListener("click", (e) => {
                e.preventDefault();

                mapInstance.searchAPIDeparture();
            });
        }
    }

    const journeysToggle = document.querySelector(".journeys__list__toggle");
    const journeysHolder = document.querySelector(".journeys__list__holder");

    if (journeysHolder && journeysToggle) {
        journeysToggle.addEventListener("click", (e) => {
            e.preventDefault();

            toggleJourneysList(!journeysHolder.classList.contains("open"));
        });
    }

    const colorModesInstance = new ColorModes();

    // const journeyDate = document.querySelector(".journey__date");
    // const dateTime = document.querySelector("#datetime");

    // if (journeyDate && dateTime) {
    //     const date = getDateFromIso(dateTime.value);

    //     if (date) {
    //         journeyDate.textContent = [
    //             ("0" + date.getDate()).slice(-2),
    //             ("0" + (date.getMonth() + 1)).slice(-2),
    //             date.getFullYear(),
    //         ].join("/");
    //     }
    // }

    const advancedToggle = document.querySelector(".journey__advanced__toggle");
    const advancedSettings = document.querySelector(".journey__advanced");

    if (advancedToggle && advancedSettings) {
        advancedToggle.addEventListener("click", (e) => {
            e.preventDefault();

            advancedSettings.classList.toggle("open");

            if (advancedSettings.classList.contains("open")) {
                advancedToggle.textContent = "Masquer les options avancées";
            } else {
                advancedToggle.textContent = "Afficher les options avancées";
            }
        });
    }
});
