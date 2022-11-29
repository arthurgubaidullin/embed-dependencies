# nx-embed-dependencies

This plugin for [Nx](https://nx.dev) helps injecting local dependencies into a package.

## Getting started

### Install

Using npm:

`npm install @arthurgubaidullin/embed-dependencies --save-dev`

### Configure project

Add a target to `project.json` to the library you want to build with dependencies.

```json
{
  // ...
  "targets": {
    // ...
    "embed-dependencies": {
      "executor": "@arthurgubaidullin/nx-embed-dependencies:run",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist-with-deps/embed-dependencies"
      }
    }
  }
  // ...
}
```

### Configure Nx pipeline

Also update your `nx.json`.

```json
{
  // ...
  "targetDefaults": {
    // ...
    "embed-dependencies": {
      "dependsOn": ["build"]
      // ...
    }
  }
}
```

## License

MIT.
