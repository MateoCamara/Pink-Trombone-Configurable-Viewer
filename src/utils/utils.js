// utils.js

export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function interpolateArrayValues(arr, step) {
    const interpolated = [];
    for (let i = 0; i < arr.length - 1; i++) {
        const start = arr[i];
        const end = arr[i + 1];
        interpolated.push(start);
        const interval = (end - start) / (step + 1);
        for (let j = 1; j <= step; j++) {
            interpolated.push(start + interval * j);
        }
    }
    interpolated.push(arr[arr.length - 1]);
    return interpolated;
}

// Calcula tenseness y loudness a partir del voiceness y actualiza el elemento dado
export function setVoiceness(voiceness) {
    // Clip the input voiceness value to the range [0, 1]
    const clampedVoiceness = Math.min(Math.max(voiceness, 0), 1);

    // Compute tenseness and ensure it stays in the [0, 1] range
    const tenseness = Math.min(Math.max(1 - Math.cos(clampedVoiceness * Math.PI * 0.5), 0), 1);

    // Calculate loudness from tenseness
    const loudness = Math.pow(tenseness, 0.25);

    // Set the values on pinkTromboneElement
    pinkTromboneElement.tenseness.value = tenseness;
    pinkTromboneElement.loudness.value = loudness;
}

