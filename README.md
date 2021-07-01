## Installation

```
npm install
```

## Running

Start the typescript compiler in watch mode:

```
npx webpack -w
```

This will make a directory named "dist" containing a static webpage that runs the app.

Example command to serve:
```
python -m http.server -d dist
```

## Production Build

```
npx webpack --mode production
```
