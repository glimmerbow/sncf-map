class ColorModes {
    constructor() {
        this.toggle = document.querySelector(".color__toggle");
        this.day = "🌞";
        this.night = "🌙";

        this.onLoad();
        this.eventHandlers();
    }

    onLoad() {
        if (
            this.isDarkMode() ||
            (localStorage.getItem("inverted-colors") == 1 && this.toggle)
        ) {
            this.enableDarkMode();
        }
    }

    eventHandlers() {
        if (this.toggle) {
            this.toggle.addEventListener("click", (e) => {
                e.preventDefault();

                document.body.classList.toggle("inverted-colors");

                if (document.body.classList.contains("inverted-colors")) {
                    this.toggle.textContent = this.day;
                    localStorage.setItem("inverted-colors", 1);
                } else {
                    this.toggle.textContent = this.night;
                    localStorage.removeItem("inverted-colors");
                }
            });
        }
    }

    enableDarkMode() {
        document.body.classList.add("inverted-colors");
        this.toggle.textContent = this.day;
    }

    isDarkMode() {
        return (
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        );
    }
}
