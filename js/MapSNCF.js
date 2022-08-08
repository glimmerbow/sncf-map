class MapSNCF {
    constructor() {
        this.map;

        this.headers = new Headers();
        this.headers.append("Authorization", window.sncfAPIKey);
        // this.url = "https://api.navitia.io/v1/journeys";
        this.url = "https://api.navitia.io/v1/coverage/sncf/journeys";
        this.urlDeparture =
            "https://api.navitia.io/v1/coverage/sncf/stop_areas/";
        this.fetchOptions = {
            method: "GET",
            headers: this.headers,
            mode: "cors",
            cache: "default",
        };
        this.from = document.querySelector("#from");
        this.to = document.querySelector("#to");
        this.datetime = document.querySelector("#datetime");
        this.departure = document.querySelector("#departure");
        this.max_nb_transfers = document.querySelector("#max_nb_transfers");
        this.journeysList = document.querySelector("ul.journeys__list");
        this.resetButton = document.querySelector(".journey__reset");

        this.defaultStyle = {
            // color: this.randColor(),
            color: "#FFF",
            weight: 5,
            opacity: 0.65,
            // onEachFeature: this.onEachFeature.bind(this),
        };

        this.activeStyles = {
            color: "var(--primary-color)",
            opacity: 1,
        };

        this.travelerTypes = [
            "standard",
            "slow_walker",
            "fast_walker",
            "luggage",
            "wheelchair",
        ];

        this.loader = new MiniLoader(document.querySelector(".loader"));

        this.initMap();
        this.eventHandlers();
    }

    initMap() {
        this.map = L.map("map").setView([46.498, 2.208], 6);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap",
            className: "map-tiles",
        }).addTo(this.map);

        this.map.zoomControl.remove();

        L.control
            .zoom({
                position: "bottomleft",
            })
            .addTo(this.map);
    }

    resetMap() {
        this.map.remove();
        this.initMap();
    }

    eventHandlers() {
        if (this.resetButton) {
            this.resetButton.addEventListener("click", (e) => {
                e.preventDefault();

                this.from.value = "";
                this.from.removeAttribute("sncf-id");
                this.to.value = "";
                this.to.removeAttribute("sncf-id");

                this.clearJourneysList();
                this.resetMap();
                toggleJourneysList(false);
            });
        }

        document.addEventListener("click", (e) => {
            if (
                e.target.classList.contains("journey__title") ||
                e.target.closest(".journey__title")
            ) {
                const journey = e.target.closest(".journey");

                if (journey) {
                    journey.classList.toggle("open");
                }
            } else if (!e.target.closest(".journey")) {
                this.unlightJourneys();
            }
        });
    }

    searchAPI() {
        const fromPlace = {
            lat: this.from.getAttribute("lat"),
            lon: this.from.getAttribute("lon"),
        };
        const toPlace = {
            lat: this.to.getAttribute("lat"),
            lon: this.to.getAttribute("lon"),
        };

        const url =
            this.url +
            "?" +
            new URLSearchParams({
                from: `${fromPlace.lon};${fromPlace.lat}`,
                to: `${toPlace.lon};${toPlace.lat}`,
                items_per_page: 10,
            });
        // const url =
        //     "https://api.navitia.io/v1/coverage/sncf/journeys?from=2.35144%3B48.85374&to=3.08716%3B45.77400&";
        // const url =
        //     "https://api.navitia.io/v1/coverage/sncf/journeys?from=4.84329%3B45.74476&to=2.34867%3B48.85726&";

        console.log(url);

        fetch(url, this.fetchOptions)
            .then((response) => response.json())
            .then((response) => {
                this.addToMap(response);
            });
    }
    searchAPI_SNCF() {
        this.loader.add();

        const fromPlaceId = this.from.getAttribute("sncf-id");
        const toPlaceId = this.to.getAttribute("sncf-id");

        let urlArgs = {
            from: fromPlaceId,
            to: toPlaceId,
            // items_per_page: 10,
            min_nb_journeys: 10,
            // direct_path: "none",
            // max_nb_transfers: 2,
            datetime: this.getUserDate(),
        };

        const travelerType = this.getTravelerType();

        if (travelerType != this.travelerTypes[0]) {
            urlArgs.traveler_type = travelerType;
        }
        const userTransfers = this.getUserTransfers();
        if (userTransfers) {
            urlArgs.max_nb_transfers = userTransfers;
        }

        const url = this.url + "?" + new URLSearchParams(urlArgs);

        // Get cache
        const hash = url.hashCode();
        // console.log(hash);
        const cachedData = localStorage.getItem(hash);
        if (cachedData && !window.forceCache) {
            // console.log(cachedData);
            this.addToMap(JSON.parse(cachedData));
            this.loader.remove();
        } else {
            fetch(url, this.fetchOptions)
                .then((response) => response.json())
                .then((response) => {
                    // Set cache
                    localStorage.setItem(hash, JSON.stringify(response));
                    // Handle the API response
                    this.addToMap(response);
                    this.loader.remove();
                });
        }
    }

    addToMap(response) {
        console.log(response);
        if (response.journeys && response.journeys.length > 0) {
            this.resetMap();
            this.clearJourneysList();
            response.journeys.forEach((journey, index) => {
                let geojson = [];

                if (!window.currentJourneysLayersCoordinates[index]) {
                    window.currentJourneysLayersCoordinates[index] = [];
                }

                journey.sections.forEach((section) => {
                    if (section.geojson) {
                        geojson.push(section.geojson);
                    }

                    if (section.from) {
                        const fromData = this.setMarkerOfSection(section.from);
                    }

                    if (section.to) {
                        const toData = this.setMarkerOfSection(section.to);
                    }
                });

                let layer = L.geoJSON(geojson, {
                    ...this.defaultStyle,
                    ...{
                        onEachFeature: function (feature, layer) {
                            if (feature.coordinates.length) {
                                feature.coordinates.forEach((coord) => {
                                    if (coord.length == 2) {
                                        window.currentJourneysLayersCoordinates[
                                            index
                                        ].push([coord[1], coord[0]]);
                                    }
                                });
                            }
                        },
                    },
                });

                // layer.on("click", function (e) {
                //     layer.setStyle({
                //         color: "#000",
                //     });
                // });

                layer.addTo(this.map);

                window.currentJourneysLayers.push(layer);

                this.addJourneyToList(
                    journey,
                    window.currentJourneysLayers.length - 1
                );
            });
        } else {
            const errorMessage = document.createElement("p");
            errorMessage.classList.add("journey__no-result");
            errorMessage.textContent = "Pas de trajet pour cette recherche 😭";
            this.journeysList.appendChild(errorMessage);
        }
    }

    randColor() {
        return "#" + Math.floor(Math.random() * 16777215).toString(16);
    }

    setMarkerOfSection(sectionElement) {
        switch (sectionElement.embedded_type) {
            case "address":
                this.addMarker(
                    sectionElement.address.coord,
                    sectionElement.name
                );
                break;
            case "stop_point":
                this.addMarker(
                    sectionElement.stop_point.coord,
                    sectionElement.name
                );
                break;
        }
    }

    addMarker(coord, tooltip) {
        if (coord && coord.lat && coord.lon) {
            L.marker([coord.lat, coord.lon])
                .bindTooltip(tooltip, {
                    // permanent: true,
                    direction: "top",
                    offset: [-15, -10],
                })
                .addTo(this.map);
        }
    }

    zoomToSearch(searchInput) {
        const lat = searchInput.getAttribute("lat");
        const lon = searchInput.getAttribute("lon");

        if (lat && lon) {
            this.map.flyTo([lat, lon], 12);
        }
    }

    searchAPIDeparture() {
        const departurePlaceId = this.departure.getAttribute("sncf-id");

        if (!departurePlaceId) {
            return;
        }

        const url =
            this.urlDeparture +
            departurePlaceId +
            "/departures?" +
            new URLSearchParams({
                // from_datetime: "20220805T000000",
                from_datetime: this.getUserDate(),
                items_per_page: 30,
            });

        // Get cache
        const hash = url.hashCode();
        const cachedData = localStorage.getItem(hash);
        if (cachedData) {
            console.log(cachedData);
            return this.addToMapDepartures(JSON.parse(cachedData));
        } else {
            fetch(url, this.fetchOptions)
                .then((response) => response.json())
                .then((response) => {
                    // Set cache
                    localStorage.setItem(hash, JSON.stringify(response));
                    // Handle the API response
                    this.addToMapDepartures(response);
                });
        }
    }

    addToMapDepartures(response) {
        this.resetMap();
        this.clearJourneysList();
        toggleJourneysList(false);
        // console.log(response);
        if (response.departures && response.departures.length > 0) {
            response.departures.forEach((departure) => {
                let geojson = [
                    {
                        type: "LineString",
                        coordinates: [
                            [
                                parseFloat(departure.stop_point.coord.lon),
                                parseFloat(departure.stop_point.coord.lat),
                            ],
                            [
                                parseFloat(
                                    departure.route.direction.stop_area.coord
                                        .lon
                                ),
                                parseFloat(
                                    departure.route.direction.stop_area.coord
                                        .lat
                                ),
                            ],
                        ],
                    },
                ];
                // console.log(geojson);
                L.geoJSON(geojson, {
                    color: this.randColor(),
                    weight: 5,
                    opacity: 0.65,
                }).addTo(this.map);
            });
        }
    }

    clearJourneysList() {
        if (this.journeysList) {
            this.journeysList.innerHTML = "";
        }
    }

    addJourneyToList(journey, index) {
        if (this.journeysList) {
            let li = document.createElement("li");
            let journeyInfo = document.createElement("div");
            let fromPlace = document.createElement("strong");
            let toPlace = document.createElement("strong");
            let otherInfos = document.createElement("div");
            let small = document.createElement("small");
            let co2 = document.createElement("small");
            let departureTime = document.createElement("time");
            let arrivalTime = document.createElement("time");

            journeyInfo.classList.add("journey__title");

            const fromName = journey.sections[0].from.name;
            const toName =
                journey.sections[journey.sections.length - 1].to.name;
            fromPlace.textContent = fromName;
            toPlace.textContent = toName;

            departureTime.textContent = journey.departure_date_time.toHours();
            arrivalTime.textContent = journey.arrival_date_time.toHours();

            journeyInfo.appendChild(departureTime);
            journeyInfo.appendChild(fromPlace);
            journeyInfo.appendChild(arrivalTime);
            journeyInfo.appendChild(toPlace);

            small.textContent = this.getJourneyDuration(journey.durations);
            co2.textContent =
                Math.round(journey.co2_emission.value) +
                journey.co2_emission.unit;

            // li.setAttribute('data-json', JSON.stringify(journey));
            li.setAttribute("data-layer-index", index);

            if (journey.type == "best") {
                let best = document.createElement("span");
                best.classList.add("best");
                best.textContent = "Meilleur trajet";
                li.appendChild(best);
            }

            otherInfos.classList.add("journey__other-infos");
            otherInfos.appendChild(small);
            otherInfos.appendChild(co2);

            li.classList.add("journey");

            journeyInfo.addEventListener(
                "click",
                this.highlightJourney.bind(this),
                false
            );
            li.appendChild(journeyInfo);

            li.appendChild(otherInfos);

            let ulSections = this.getJourneySections(journey);
            li.appendChild(ulSections);

            this.journeysList.appendChild(li);
        }
    }

    getJourneySections(journey) {
        let ulSections = document.createElement("ul");
        ulSections.classList.add("journey__sections");
        // ulSections.style.height = Math.round(journey.duration / 100) + "px";

        journey.sections.forEach((section) => {
            // console.log(section);

            if (section.duration <= 0) {
                return;
            }

            const liSection = document.createElement("li");
            liSection.classList.add(section.type);

            const decoration = document.createElement("span");
            decoration.classList.add("decoration");

            switch (section.type) {
                case "waiting":
                    let span = document.createElement("span");
                    span.textContent =
                        "Correspondance : " +
                        section.duration.toString().toHHMM();
                    span.classList.add("transfer");

                    liSection.appendChild(decoration);
                    liSection.appendChild(span);

                    break;
                default:
                    const times = this.getTimesOfJourneySection(section);

                    if (times) {
                        liSection.appendChild(times);

                        liSection.appendChild(decoration);

                        const places = this.getPlacesOfJourneySection(section);
                        liSection.appendChild(places);
                    }

                    break;
            }

            if (section.duration / 60 > 50) {
                liSection.style.height =
                    Math.round(section.duration / 60) + 10 + "px";
            }

            ulSections.appendChild(liSection);
        });

        return ulSections;
    }

    getJourneyDuration(durations) {
        return durations.total.toString().toHHMM();
    }

    getTimesOfJourneySection(section) {
        const durationTime = section.duration.toString().toHHMM();

        if (durationTime == "00min") {
            return null;
        }

        let times = document.createElement("div");
        times.classList.add("times");

        let startDate = document.createElement("time");
        startDate.classList.add("startDate");
        startDate.textContent = section.departure_date_time.toHours();

        let duration = document.createElement("time");
        duration.classList.add("duration");
        duration.textContent = durationTime;

        let endDate = document.createElement("time");
        endDate.classList.add("endDate");
        endDate.textContent = section.arrival_date_time.toHours();

        times.appendChild(startDate);
        times.appendChild(duration);
        times.appendChild(endDate);

        return times;
    }
    getPlacesOfJourneySection(section) {
        let places = document.createElement("div");
        places.classList.add("places");

        let labelTime = "";

        if ((section.type = "transfer" && section.transfer_type == "walking")) {
            labelTime = "Marche ";
        }

        if (section.display_informations) {
            labelTime =
                section.display_informations.commercial_mode +
                " N°" +
                section.display_informations.headsign;
        }

        let startPlace = document.createElement("time");
        startPlace.classList.add("startPlace");
        startPlace.textContent = section.from.name;
        places.appendChild(startPlace);

        if (labelTime != "") {
            let labelTimeNode = document.createElement("span");
            labelTimeNode.classList.add("labelTime");
            labelTimeNode.textContent = labelTime;
            places.appendChild(labelTimeNode);
        }

        let endPlace = document.createElement("time");
        endPlace.classList.add("endPlace");
        endPlace.textContent = section.to.name;
        places.appendChild(endPlace);

        // liSection.textContent =
        //     section.from.name +
        //     "<=>" +
        //     section.to.name +
        //     " " +
        //     labelTime +
        //     " : " +
        //     section.duration.toString().toHHMM();

        return places;
    }

    highlightJourney(e) {
        const journey = e.target.closest(".journey");

        if (journey) {
            const index = journey.getAttribute("data-layer-index") || null;

            journey.classList.add("active");

            if (index != null) {
                if (window.currentJourneysLayers[index]) {
                    window.currentJourneysLayers[index].setStyle(
                        this.activeStyles
                    );

                    this.map.flyToBounds(
                        window.currentJourneysLayersCoordinates[index],
                        { padding: [25, 25] }
                    );
                }
            }
        }
    }

    unlightJourneys() {
        if (window.currentJourneysLayers.length > 0) {
            window.currentJourneysLayers.forEach((journey, index) => {
                journey.setStyle(this.defaultStyle);

                const journeyNode = document.querySelector(
                    `.journey[data-layer-index="${index}"]`
                );

                if (journeyNode) {
                    journeyNode.classList.remove("active");
                    journeyNode.classList.remove("open");
                }
            });
        }
    }

    highlightLayer(feature, layer) {
        layer.setStyle((feature) => {
            return {
                fillColor: "orange",
                color: "white",
            };
        });
    }

    onEachFeature(feature, layer) {
        // https://gis.stackexchange.com/a/246919
        // var pointLayer = L.geoJSON(null, {
        //     pointToLayer: function (feature, latlng) {
        //         label = String(feature.properties.name); // Must convert to string, .bindTooltip can't use straight 'feature.properties.attribute'
        //         return new L.CircleMarker(latlng, {
        //             radius: 1,
        //         })
        //             .bindTooltip(label, { permanent: true, opacity: 0.7 })
        //             .openTooltip();
        //     },
        // });
        // pointLayer.addData(data_points);
        // mymap.addLayer(pointLayer);
        // layer.bindTooltip(String(feature.properties.name), {
        //     permanent: true,
        // });
        console.log(feature, layer);
        layer.on("mouseover", (e) => {
            console.log("mouseover");
            // layer.setIcon(highlightMarker);
            // layer.openTooltip();
            this.highlightLayer(feature, layer);
        });
        layer.on("mouseout", (e) => {
            console.log("mouseout");
            // layer.setIcon(defaultMarker);
            // layer.closeTooltip();
        });
    }

    getUserDate() {
        const userDate = getDateFromIso(this.datetime.value);
        let date = new Date();

        if (userDate.getTime() > date.getTime()) {
            date = userDate;
        }

        const formattedDate =
            [
                date.getFullYear(),
                ("0" + (date.getMonth() + 1)).slice(-2),
                ("0" + date.getDate()).slice(-2),
            ].join("") +
            "T" +
            [
                ("0" + (date.getHours() + 1)).slice(-2),
                ("0" + date.getMinutes()).slice(-2),
                ("0" + date.getSeconds()).slice(-2),
            ].join("");

        return formattedDate;
    }

    getTravelerType() {
        this.travelerType = document.querySelector(
            '[name="traveler_type"]:checked'
        );

        if (
            this.travelerType &&
            this.travelerTypes.includes(this.travelerType.value)
        ) {
            return this.travelerType.value;
        }

        return this.travelerTypes[0];
    }

    getUserTransfers() {
        let transfers = parseInt(this.max_nb_transfers.value) || null;

        return transfers ? Math.min(transfers, 10) : 0;
    }
}
