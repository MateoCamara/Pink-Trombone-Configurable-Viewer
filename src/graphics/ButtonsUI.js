class ButtonsUI {
    constructor() {
        // Main container element
        this._container = document.createElement("div");
        Object.assign(this._container.style, {
            display: "grid",
            flexDirection: "column",
            position: "absolute",
            top: "0",
            right: "0",
        });
        // Object to store dynamically created buttons
        this._buttons = {};
    }

    // Static async method to create an instance and load configurations
    static async create() {
        const instance = new ButtonsUI();
        const configs = await instance.loadConfigs();
        instance.createButtons(configs);
        instance.addMuteButtonListeners();
        return instance;
    }

    // Getter for the container node
    get node() {
        return this._container;
    }

    // Load the manifest and configuration files
    async loadConfigs() {
        try {
            // Manifest expected format: { "files": ["btn1.json", "btn2.json", ...] }
            const response = await fetch('./src/tract_configs/manifest.json');
            if (!response.ok) throw new Error("Error loading manifest");
            const manifest = await response.json();

            // Fetch configuration files concurrently
            const configs = await Promise.all(
                manifest.files.map(async fileName => {
                    try {
                        const res = await fetch(`./src/tract_configs/${fileName}`);
                        if (!res.ok) {
                            console.error(`Failed to load ${fileName}`);
                            return null;
                        }
                        return res.json();
                    } catch (err) {
                        console.error(`Error loading ${fileName}:`, err);
                        return null;
                    }
                })
            );
            return configs.filter(Boolean);
        } catch (error) {
            console.error("Error loading configurations:", error);
            return [];
        }
    }

    // Create buttons based on configuration objects
    createButtons(configs) {
        configs.forEach(config => {
            // Destructure config with defaults
            const { name, isParameter = false, parameterPath = name } = config;
            const button = this._createButton(name, isParameter, parameterPath);
            this._buttons[name] = button;
        });
    }

    // Add special listeners for the "mute" button
    addMuteButtonListeners() {
        const muteButton = this._createButton("mute", false, "");

        // On resume, update button text and value
        muteButton.addEventListener("didResume", () => {
            muteButton.innerText = "mute";
            muteButton.value = true;
        });

        // On mute, update button text and value
        muteButton.addEventListener("didMute", () => {
            muteButton.innerText = "unmute";
            muteButton.value = false;
        });

        // Dispatch "resume" event on click
        muteButton.addEventListener("click", event => {
            event.target.dispatchEvent(new CustomEvent("resume", { bubbles: true }));
        });
    }

    // Create and configure a button element
    _createButton(buttonName, isParameter = false, parameterPath) {
        const button = document.createElement("button");
        button.id = buttonName;
        button.value = true;
        button.innerText = (isParameter ? "disable " : "") + buttonName;

        Object.assign(button.style, {
            width: "100%",
            flex: "1",
            margin: "2px",
            borderRadius: "20px",
            backgroundColor: "pink",
            border: "solid red",
        });

        this._container.appendChild(button);

        if (isParameter) {
            // Toggle state for parameter buttons
            button.addEventListener("click", () => {
                button.value = !button.value; // Toggle boolean value
                const prefix = button.value ? "disable" : "enable";
                button.innerText = `${prefix} ${button.id}`;
                // Dispatch custom events for parameter change
                button.dispatchEvent(new CustomEvent("setParameter", {
                    bubbles: true,
                    detail: {
                        parameterName: parameterPath || buttonName,
                        newValue: button.value ? 1 : 0,
                    },
                }));
                button.dispatchEvent(new CustomEvent("message", {
                    bubbles: true,
                    detail: {
                        type: "toggleButton",
                        parameterName: buttonName,
                        newValue: button.value,
                    },
                }));
            });
        } else if (buttonName !== "mute") {
            // For non-parameter buttons (except "mute"), dispatch events on click
            button.addEventListener("click", () => {
                button.dispatchEvent(new CustomEvent(buttonName, {
                    bubbles: true,
                    detail: {
                        parameterName: parameterPath || buttonName,
                        newValue: button.value ? 1 : 0,
                    },
                }));
                button.dispatchEvent(new CustomEvent("message", {
                    bubbles: true,
                    detail: {
                        type: "toggleButton",
                        parameterName: buttonName,
                        newValue: button.value,
                    },
                }));
            });
        }
        return button;
    }
}

export default ButtonsUI;
