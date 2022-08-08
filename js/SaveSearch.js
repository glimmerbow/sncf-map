class SaveSearch {
    constructor() {
        this.save = document.querySelector(".journey__save");
        this.from = document.querySelector("#from");
        this.to = document.querySelector("#to");

        this.eventHandlers();
    }

    eventHandlers() {
        this.retrieveJourneyData();

        if (this.save) {
            this.save.addEventListener("click", (e) => {
                e.preventDefault();
                this.saveJourney();
            });
        }
    }

    saveJourney() {
        if (
            this.from &&
            this.to &&
            this.from.value != "" &&
            this.to.value != ""
        ) {
            localStorage.setItem(
                "from-sncf-id",
                this.from.getAttribute("sncf-id")
            );
            localStorage.setItem("from-value", this.from.value);
            localStorage.setItem("to-sncf-id", this.to.getAttribute("sncf-id"));
            localStorage.setItem("to-value", this.to.value);

            this.saveTravelerType();
        }
    }

    retrieveJourneyData() {
        if (this.from && this.to) {
            this.from.setAttribute(
                "sncf-id",
                localStorage.getItem("from-sncf-id")
            );
            this.from.value = localStorage.getItem("from-value");
            this.to.setAttribute("sncf-id", localStorage.getItem("to-sncf-id"));
            this.to.value = localStorage.getItem("to-value");

            this.setTravelerType();

            if (this.from.value != "") {
                setTimeout(() => {
                    eventDispatcher("launch-map-search");
                }, 1000);
            }
        }
    }

    saveTravelerType() {
        const travelerType = document.querySelector(
            '[name="traveler_type"]:checked'
        );

        if (travelerType) {
            localStorage.setItem("traveler-type", travelerType.value);
        }
    }

    setTravelerType() {
        const travelerType = localStorage.getItem("traveler-type");

        if (travelerType) {
            const checkbox = document.querySelector(
                `[name="traveler_type"][value="${travelerType}"]`
            );

            if (checkbox) {
                checkbox.checked = true;
            }
        }
    }
}
