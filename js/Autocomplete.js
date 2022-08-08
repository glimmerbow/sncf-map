class Autocomplete {
    constructor(form, search, map) {
        this.form = form;
        this.loading = false;
        this.form.classList.add("autocomplete__form");
        this.search = search;
        this.map = map;
        this.url = "https://nominatim.openstreetmap.org/search";
        this.fetchOptions = {
            method: "GET",
            mode: "cors",
            cache: "default",
        };

        this.eventHandlers();
    }

    eventHandlers() {
        if (this.search) {
            this.search.setAttribute("autocomplete", "nope");

            this.search.addEventListener(
                "input",
                this.delay((e) => {
                    if (!this.loading) {
                        this.getResults();
                    }
                }, 750)
            );

            this.search.addEventListener("focus", (e) => {
                this.showList();
                this.map.zoomToSearch(this.search);
            });

            document.body.addEventListener("click", (e) => {
                if (!e.target.closest(".autocomplete__form")) {
                    this.hideList();
                }
            });
        }
    }

    getResults() {
        this.cleanCurrentValue();

        if (this.search.value.trim().length > 2) {
            this.loading = true;
            this.fetch();
        }
    }

    fetch() {
        const searchQuery = this.search.value.trim();
        const url =
            this.url +
            "?" +
            new URLSearchParams({
                format: "geojson",
                limit: 5,
                q: encodeURI(searchQuery),
            });

        // Get cache
        const hash = url.hashCode();
        const cachedData = localStorage.getItem(hash);
        if (cachedData) {
            // console.log(cachedData);
            return this.responseHandler(JSON.parse(cachedData));
        } else {
            fetch(url, this.fetchOptions)
                .then((response) => {
                    return response.json();
                })
                .then((response) => {
                    // Set cache
                    localStorage.setItem(hash, JSON.stringify(response));
                    // Handle the API response
                    return this.responseHandler(response);
                })
                .catch((err) => {
                    // There was an error
                    console.warn("Something went wrong.", err);
                });
        }
    }

    responseHandler(response) {
        if (response) {
            this.updateResultsList(response);
            this.loading = false;
        }
    }

    updateResultsList(response) {
        const parent = this.search.closest("label");

        if (parent) {
            let resultsList = parent.querySelector(".autocomplete__results");

            if (resultsList) {
                resultsList.remove();
            }

            resultsList = document.createElement("ul");
            resultsList.classList.add("autocomplete__results");
            parent.appendChild(resultsList);

            if (response.features.length > 0) {
                response.features.forEach((feature) => {
                    let newItem = document.createElement("li");
                    newItem.innerHTML = feature.properties.display_name;
                    newItem.setAttribute(
                        "address",
                        feature.properties.display_name
                    );
                    newItem.setAttribute(
                        "lat",
                        feature.geometry.coordinates[1]
                    );
                    newItem.setAttribute(
                        "lon",
                        feature.geometry.coordinates[0]
                    );
                    resultsList.appendChild(newItem);
                    newItem.addEventListener("click", (e) => {
                        e.preventDefault();
                        this.selectResult(newItem);
                    });
                });
            } else {
                // No results
                let newItem = document.createElement("li");
                newItem.classList.add("no-result");
                newItem.textContent =
                    document.documentElement.lang == "fr-FR"
                        ? "Pas de résultat, veuillez essayer avec une autre adresse"
                        : "No result, please try again";
                resultsList.appendChild(newItem);
            }
        }
    }

    cleanCurrentValue() {
        this.search.removeAttribute("lat");
        this.search.removeAttribute("lon");

        if (this.submit) {
            this.submit.setAttribute("disabled", "disabled");
        }
    }

    selectResult(item) {
        this.search.setAttribute("lat", item.getAttribute("lat"));
        this.search.setAttribute("lon", item.getAttribute("lon"));
        this.search.value = item.getAttribute("address");

        if (this.submit) {
            this.submit.removeAttribute("disabled");
        }

        // Remove autocomplete results
        item.parentNode.remove();
    }

    getResultsList() {
        const parent = this.search.closest("div");

        if (parent) {
            return parent.querySelector(".autocomplete__results");
        }

        return null;
    }

    showList() {
        const resultsList = this.getResultsList();

        if (resultsList) {
            resultsList.removeAttribute("style");
        }
    }

    hideList() {
        const resultsList = this.getResultsList();

        if (resultsList) {
            resultsList.style.display = "none";
        }
    }

    delay(callback, ms) {
        var timer = 0;
        return function () {
            var context = this,
                args = arguments;
            clearTimeout(timer);
            timer = setTimeout(function () {
                callback.apply(context, args);
            }, ms || 0);
        };
    }
}
