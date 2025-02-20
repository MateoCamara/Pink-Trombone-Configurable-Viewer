import {} from "./PinkTrombone.js";
import PinkTromboneUI from "./graphics/PinkTromboneUI.js";
import { sleep, interpolateArrayValues, setVoiceness } from "./utils/utils.js";

// Polyfill for AudioContext
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const loop = false;

// Helper function to play the sound sequence
async function playSoundSequence(
    freqs,
    voicenesses,
    tongueIndexes,
    tongueDiams,
    lipDiams,
    constrictionIndexes,
    constrictionDiams
) {
    do {
        for (let i = 0; i < freqs.length; i++) {
            // Update frequency and vocal tract parameters
            pinkTromboneElement.frequency.value = freqs[i];
            setVoiceness(voicenesses[i]);
            pinkTromboneElement.tongue.index.value = tongueIndexes[i];
            pinkTromboneElement.tongue.diameter.value = tongueDiams[i];
            lipConstriction.diameter.value = lipDiams[i];
            tractConstriction.index.value = constrictionIndexes[i];
            tractConstriction.diameter.value = constrictionDiams[i];
            await sleep(10);
        }
    } while (loop);
}

const dynamicEventHandlers = {
    roy: async function (event, cfg) {
        const steps = cfg.steps || 10;
        // Destructure configuration parameters
        let {
            freqs,
            voicenesses,
            tongue_indexes,
            tongue_diams,
            lip_diams,
            constriction_indexes,
            constriction_diams,
            // Optional: throat_diams,
        } = cfg;

        // Interpolate values for smooth transitions
        freqs = interpolateArrayValues(freqs, steps);
        voicenesses = interpolateArrayValues(voicenesses, steps);
        tongue_indexes = interpolateArrayValues(tongue_indexes, steps);
        tongue_diams = interpolateArrayValues(tongue_diams, steps);
        lip_diams = interpolateArrayValues(lip_diams, steps);
        constriction_indexes = interpolateArrayValues(constriction_indexes, steps);
        constriction_diams = interpolateArrayValues(constriction_diams, steps);
        // throat_diams = interpolateArrayValues(throat_diams, steps);

        await playSoundSequence(
            freqs,
            voicenesses,
            tongue_indexes,
            tongue_diams,
            lip_diams,
            constriction_indexes,
            constriction_diams
        );
        return 1;
    }
    // You can register more dynamic handlers as needed.
};

class PinkTromboneElement extends HTMLElement {
    constructor() {
        super();
        this._animationFrameObservers = [];
        window.customElements.whenDefined("pink-trombone").then(() => {
            // Attach system event listeners
            this.attachSystemEventListeners();
            // Load dynamic event configurations from manifest files
            this.loadDynamictractConfigs();
        });
    }

    // Attach fixed system events (requestAnimationFrame, resume, setParameter, etc.)
    attachSystemEventListeners() {
        // requestAnimationFrame event
        this.addEventListener("requestAnimationFrame", (event) => {
            if (!this._animationFrameObservers.includes(event.target)) {
                this._animationFrameObservers.push(event.target);
            }
            event.target.dispatchEvent(
                new CustomEvent("didRequestAnimationFrame")
            );
            event.stopPropagation();
        });

        // resume event (toggle audio context state)
        this.addEventListener("resume", (event) => {
            if (this.audioContext.state === "running") {
                // Suspend audio (mute)
                this.audioContext.suspend().then(() => {
                    event.target.dispatchEvent(new CustomEvent("didMute"));
                });
            } else {
                // Resume audio (unmute) and start sound production
                this.audioContext.resume().then(() => {
                    this.pinkTrombone.start();
                    event.target.dispatchEvent(new CustomEvent("didResume"));
                });
            }
        });

        // setParameter event to update audio parameters
        this.addEventListener("setParameter", (event) => {
            const parameterName = event.detail.parameterName;
            const audioParam = parameterName
                .split(".")
                .reduce((obj, prop) => obj[prop], this.parameters);
            const newValue = Number(event.detail.newValue);

            if (event.detail.type === "linear") {
                audioParam.linearRampToValueAtTime(
                    newValue,
                    this.audioContext.currentTime + event.detail.timeOffset
                );
            } else {
                audioParam.value = newValue;
            }

            event.target.dispatchEvent(
                new CustomEvent("didSetParameter", { detail: event.detail })
            );
            event.stopPropagation();
        });

        // getParameter event to retrieve audio parameter value
        this.addEventListener("getParameter", (event) => {
            const parameterName = event.detail.parameterName;
            const audioParam = parameterName
                .split(".")
                .reduce((obj, prop) => obj[prop], this.parameters);
            const value = audioParam.value;
            event.detail.value = value;
            event.target.dispatchEvent(
                new CustomEvent("didGetParameter", { detail: event.detail })
            );
            event.stopPropagation();
        });

        // newConstriction event to create a new constriction
        this.addEventListener("newConstriction", (event) => {
            const { index, diameter } = event.detail;
            const constriction = this.newConstriction(index, diameter);
            event.detail.constrictionIndex = constriction._index;
            event.target.dispatchEvent(
                new CustomEvent("didNewConstriction", { detail: event.detail })
            );
            event.stopPropagation();
        });

        // setConstriction event to update an existing constriction
        this.addEventListener("setConstriction", (event) => {
            const constrictionIndex = Number(event.detail.constrictionIndex);
            const constriction = this.constrictions[constrictionIndex];

            if (constriction) {
                const { index, diameter } = event.detail;
                const indexValue = index || constriction.index.value;
                const diameterValue = diameter || constriction.diameter.value;

                if (event.detail.type === "linear") {
                    constriction.index.linearRampToValueAtTime(
                        indexValue,
                        event.detail.endTime
                    );
                    constriction.diameter.linearRampToValueAtTime(
                        diameterValue,
                        event.detail.endTime
                    );
                } else {
                    constriction.index.value = indexValue;
                    constriction.diameter.value = diameterValue;
                }

                event.target.dispatchEvent(
                    new CustomEvent("didSetConstriction")
                );
            }
            event.stopPropagation();
        });

        // getConstriction event to retrieve constriction parameters
        this.addEventListener("getConstriction", (event) => {
            const constrictionIndex = Number(event.detail.constrictionIndex);
            const constriction = this.constrictions[constrictionIndex];
            event.target.dispatchEvent(
                new CustomEvent("didGetConstriction", {
                    detail: {
                        index: constriction.index.value,
                        diameter: constriction.diameter.value,
                    },
                })
            );
            event.stopPropagation();
        });

        // removeConstriction event to delete a constriction
        this.addEventListener("removeConstriction", (event) => {
            const constrictionIndex = Number(event.detail.constrictionIndex);
            const constriction = this.constrictions[constrictionIndex];
            this.removeConstriction(constriction);
            event.target.dispatchEvent(
                new CustomEvent("didRemoveConstriction", { detail: event.detail })
            );
            event.stopPropagation();
        });

        // getProcessor event to retrieve the audio processor
        this.addEventListener("getProcessor", (event) => {
            this.getProcessor().then((processor) => {
                event.target.dispatchEvent(
                    new CustomEvent("didGetProcessor", {
                        detail: { processor },
                    })
                );
            });
            event.stopPropagation();
        });

        // Enable UI if the "UI" attribute is present
        if (this.getAttribute("UI") !== null) this.enableUI();

        // Dispatch load event when initialization is complete
        this.dispatchEvent(new Event("load"));
    }

    // Load and attach dynamic event configurations from JSON manifest
    async loadDynamictractConfigs() {
        try {
            const response = await fetch("./src/tract_configs/manifest.json");
            if (!response.ok) throw new Error("Error loading event manifest");
            const manifest = await response.json();
            const tractConfigs = [];

            for (const fileName of manifest.files) {
                const res = await fetch(`./src/tract_configs/${fileName}`);
                if (res.ok) {
                    const config = await res.json();
                    tractConfigs.push(config);
                } else {
                    console.error(`Failed to load ${fileName}`);
                }
            }
            this.attachDynamicEventListeners(tractConfigs);
        } catch (error) {
            console.error("Error loading event configurations:", error);
        }
    }

    // Attach each dynamic event based on its configuration and registered handler
    attachDynamicEventListeners(tractConfigs) {
        tractConfigs.forEach((config) => {
            if (!config.enabled) return;
            const eventName = config.name;
            const handler = dynamicEventHandlers[eventName];
            if (handler) {
                this.addEventListener(eventName, async (event) => {
                    await handler.call(this, event, config.config);
                });
            } else {
                console.warn(`No registered handler for event ${eventName}`);
            }
        });
    }

    // Produce sound by interpolating and applying sound parameters
    async produceSound(
        freqs,
        voicenesses,
        tongue_indexes,
        tongue_diams,
        lip_diams,
        constriction_indexes,
        constriction_diams
    ) {
        const steps = 5;
        freqs = interpolateArrayValues(freqs, steps);
        voicenesses = interpolateArrayValues(voicenesses, steps);
        tongue_indexes = interpolateArrayValues(tongue_indexes, steps);
        tongue_diams = interpolateArrayValues(tongue_diams, steps);
        lip_diams = interpolateArrayValues(lip_diams, steps);
        constriction_indexes = interpolateArrayValues(constriction_indexes, steps);
        constriction_diams = interpolateArrayValues(constriction_diams, steps);
        // Optional: throat_diams = interpolateArrayValues(throat_diams, steps);

        await playSoundSequence(
            freqs,
            voicenesses,
            tongue_indexes,
            tongue_diams,
            lip_diams,
            constriction_indexes,
            constriction_diams
        );
        // Reset lip constriction after loop ends
        lipConstriction.diameter.value = 0;
        return 1;
    }

    // Enable the UI component
    enableUI() {
        if (!this.UI) {
            this.UI = new PinkTromboneUI();
            this.appendChild(this.UI.node);
        }
        this.UI.show();
    }

    // Disable the UI component
    disableUI() {
        if (this.UI) {
            this.UI.hide();
            this.stopUI();
        }
    }

    // Start the UI animation loop
    startUI() {
        if (this.UI) {
            this._isRunning = true;
            window.requestAnimationFrame((highResTimeStamp) => {
                this._requestAnimationFrameCallback(highResTimeStamp);
            });
        }
    }

    // Stop the UI animation loop
    stopUI() {
        this._isRunning = false;
    }

    // Specify observed attributes for the custom element
    static get observedAttributes() {
        return ["UI"];
    }

    // Handle attribute changes
    attributeChangedCallback(name, oldValue, newValue) {
        if (name === "UI") {
            newValue !== null ? this.enableUI() : this.disableUI();
        }
    }

    // Set up the audio context and load the Pink Trombone
    setAudioContext(audioContext = new window.AudioContext()) {
        this.pinkTrombone = audioContext.createPinkTrombone();
        this.loadPromise = this.pinkTrombone.loadPromise.then(() => {
            this.parameters = this.pinkTrombone.parameters;
            for (const parameterName in this.pinkTrombone.parameters) {
                this[parameterName] = this.pinkTrombone.parameters[parameterName];
            }
            return this.pinkTrombone;
        });
        return this.loadPromise;
    }

    // Getter for audioContext
    get audioContext() {
        if (this.pinkTrombone) return this.pinkTrombone.audioContext;
        throw "Audio Context has not been set";
    }

    // Setter for audioContext
    set audioContext(audioContext) {
        this.setAudioContext(audioContext);
    }

    // Connect the Pink Trombone node
    connect() {
        if (this.pinkTrombone) return this.pinkTrombone.connect(...arguments);
    }

    // Disconnect the Pink Trombone node
    disconnect() {
        if (this.pinkTrombone) return this.pinkTrombone.disconnect(...arguments);
    }

    // Start sound production and UI
    start() {
        if (this.pinkTrombone) {
            this.pinkTrombone.start();
            this.startUI();
        } else {
            throw "Pink Trombone hasn't been set yet";
        }
    }

    // Stop sound production and UI
    stop() {
        if (this.pinkTrombone) {
            this.pinkTrombone.stop();
            this.stopUI();
        } else {
            throw "Pink Trombone hasn't been set yet";
        }
    }

    // Internal callback for requestAnimationFrame
    _requestAnimationFrameCallback(highResTimeStamp) {
        if (this._isRunning) {
            this._animationFrameObservers.forEach((observer) => {
                observer.dispatchEvent(
                    new CustomEvent("animationFrame", {
                        detail: { highResTimeStamp },
                    })
                );
            });
            window.requestAnimationFrame((ts) =>
                this._requestAnimationFrameCallback(ts)
            );
        }
    }

    // Getter for constrictions from the Pink Trombone
    get constrictions() {
        return this.pinkTrombone.constrictions;
    }

    // Create a new constriction
    newConstriction(...args) {
        return this.pinkTrombone.newConstriction(...args);
    }

    // Remove an existing constriction
    removeConstriction(constriction) {
        return this.pinkTrombone.removeConstriction(constriction);
    }

    // Retrieve the audio processor
    getProcessor() {
        return this.pinkTrombone.getProcessor();
    }
}

// Define the custom element if applicable
if (
    document.createElement("pink-trombone").constructor === HTMLElement
) {
    window.customElements.define("pink-trombone", PinkTromboneElement);
}

export default PinkTromboneElement;
