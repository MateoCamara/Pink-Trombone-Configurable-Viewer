# Dynamic Button Configuration

This application dynamically creates buttons based on JSON configuration files placed in the **tract_configs** folder. A manifest file lists which JSON files to load.

## Folder Structure

A recommended folder structure is:

```
src/
 ├── audio/
 ├── graphics/
 ├── tract/
 ├── configs/
 └── tract_configs/
      ├── manifest.json
      ├── example_button.json
      └── ... (other JSON files)
```

## Manifest File

The `manifest.json` file specifies the configuration files to load. For example:

```json
{
  "files": [
    "example_config.json"
  ]
}
```

Add the names of the configuration files you want to appear in the interface.

## Example Configuration File

An example configuration file (`example_config.json`) might look like this:

```json
{
  "name": "roy",
  "enabled": true,
  "config": {
    "steps": 10,
    "freqs": [120.23903289, 133.40241249, ...],
    "voicenesses": [0.4582711, 0.67411638, ...],
    "tongue_indexes": [20.94535448, 18.86890586, ...],
    "tongue_diams": [2.08678874, 2.40020183, ...],
    "lip_diams": [0.83980944, 0.90567957, ...],
    "constriction_indexes": [39.62685315, 39.69299466, ...],
    "constriction_diams": [0.98437021, 1.09932966, ...]
  }
}
```

- **name**: The identifier and label for the button.
- **enabled**: Set to `false` to disable the button.
- **config**: Contains calculated parameters.
    - **steps**: Number of interpolated values between each calculated value.
    - **freqs**, **voicenesses**, **tongue_indexes**, **tongue_diams**, **lip_diams**, **constriction_indexes**, **constriction_diams**: Arrays of calculated values for synthesis.

### Explanation of `steps`

`steps` relates to time. It indicates how many intermediate values are interpolated between each calculated value in the arrays. Considering Pink Trombone operates at 48 kHz and each step has 512 samples, each step corresponds to approximately 0.01067 seconds (512 samples / 48,000 samples per second).

## How It Works

1. **Loading Configurations:**  
   When the application starts, it reads the `manifest.json` file in the **tract_configs** folder and loads each listed JSON file.

2. **Creating Buttons:**  
   For each configuration, a button is created dynamically. The button’s label is taken from the `"name"` field, and additional behavior is configured based on the JSON properties.

3. **Customization:**  
   To change the number of buttons or their settings, simply add, remove, or modify the JSON files in **tract_configs** and update the manifest accordingly.

## Additional Notes

- Ensure that all JSON files are valid.
- To disable a button, set `"enabled": false` in its configuration file.
- To extend or customize the button logic, modify the GUI code (e.g., in `ButtonsUI.js`).

## Acknowledgments

Based on [Neil's Thapen Pink Trombone](https://dood.al/pinktrombone/) and the [Programmable version of the pink trombone](https://github.com/zakaton/Pink-Trombone)