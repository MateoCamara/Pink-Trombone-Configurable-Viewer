import TractUI from "./TractUI.js";
import GlottisUI from "./GlottisUI.js";
import ButtonsUI from "./ButtonsUI.js";

class PinkTromboneUI {
    constructor() {
        this._tractUI = new TractUI();
        this._glottisUI = new GlottisUI();

        // Creamos el contenedor principal de la GUI
        this._container = document.createElement("div");
        this._container.style.height = "100%";
        this._container.style.width = "100%";
        this._container.style.display = "grid";
        this._container.style.gridTemplateRows = "auto 200px 100px";
        this._container.style.gridTemplateColumns = "auto 100px";
        this._container.style.gridRowGap = "5px";

        // Agregamos la interfaz del tracto
        this._container.appendChild(this._tractUI.node);
        this._tractUI.node.id = "tractUI";
        this._tractUI.node.style.gridColumn = "1 / span 2";
        this._tractUI.node.style.gridRow = "1 / span 2";

        // Agregamos la interfaz de la glotis
        this._container.appendChild(this._glottisUI.node);
        this._glottisUI.node.id = "glottisUI";
        this._glottisUI.node.style.gridColumn = "1 / span 2";
        this._glottisUI.node.style.gridRow = "3";

        // Llamamos al método asíncrono para crear la GUI de botones
        ButtonsUI.create().then((buttonsUI) => {
            this._buttonsUI = buttonsUI;
            this._buttonsUI.node.id = "buttonsUI";
            this._buttonsUI.node.style.zIndex = 1;
            this._buttonsUI.node.style.gridColumn = "2";
            this._buttonsUI.node.style.gridRow = "2";
            this._container.appendChild(this._buttonsUI.node);
        });

        // Propagación de eventos "message" a todos los hijos del contenedor
        this._container.addEventListener("message", (event) => {
            event.stopPropagation();
            Array.from(this._container.children).forEach((child) => {
                if (child !== event.target) {
                    child.dispatchEvent(new CustomEvent("message", {
                        detail: event.detail,
                    }));
                }
            });
        });
    }

    get node() {
        return this._container;
    }

    show() {
        this.node.style.display = "grid";
    }

    hide() {
        this.node.style.display = "none";
    }
}

export default PinkTromboneUI;
