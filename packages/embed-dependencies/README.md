# nx-embed-dependencies

This plugin for [Nx](https://nx.dev) helps injecting local dependencies into a package.

## Getting started

### Install

Using npm:

`npm install @arthurgubaidullin/nx-embed-dependencies --save-dev`

### Configure project

Add a target to `project.json` to the library you want to build with dependencies.

```jsonc
{
  // ...
  "targets": {
    // ...
    "embed-dependencies": {
      "executor": "@arthurgubaidullin/nx-embed-dependencies:run",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/lib-with-dependencies"
      }
    }
  }
  // ...
}
```

### Configure Nx pipeline

Also update your `nx.json`.

```jsonc
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

## Caveats

If you are using [grouped libraries](https://nx.dev/more-concepts/grouping-libraries), then their names must be valid.

**Correct**

`@workspace/commom-my-lib`

**Incorrect**

`@workspace/commom/my-lib`

### Recomendation

When creating a project in folder, use the `--importPath` option.

## License

MIT.
