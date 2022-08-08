class MiniLoader {
    constructor(loader) {
        this.loader = loader;
    }

    add() {
        this.loader.classList.add("active");
        this.loader.style.backgroundImage = 'url("images/loader.svg")';
    }

    remove() {
        setTimeout(() => {
            this.loader.classList.remove("active");
            this.loader.style.backgroundImage = "";
        }, 500);
    }
}
