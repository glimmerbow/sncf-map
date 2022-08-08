class InvertSearch {
    constructor() {
        this.invert = document.querySelector(".journey__invert");
        this.from = document.querySelector("#from");
        this.to = document.querySelector("#to");

        this.eventHandlers();
    }

    eventHandlers() {
        if (this.invert) {
            this.invert.addEventListener("click", (e) => {
                e.preventDefault();
                this.invertJourney();
            });
        }
    }

    invertJourney() {
        if (this.from && this.to) {
            const toValue = this.to.value;
            const toSNCFId = this.to.getAttribute("sncf-id");

            this.to.setAttribute("sncf-id", this.from.getAttribute("sncf-id"));
            this.to.value = this.from.value;

            this.from.setAttribute("sncf-id", toSNCFId);
            this.from.value = toValue;
        }
    }
}
