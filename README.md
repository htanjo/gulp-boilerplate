# Gulp Boilerplate
> Boilerplate for gulp project.

## Getting started
Make sure to install [Node.js](https://nodejs.org/).  
If you prefer `gulp` command to `npm run *`, install gulp globally: `npm install -g gulp`

### Install dependencies
```sh
$ npm install
```

This installs both build system modules and dependent libraries for the project.

### Start development
```sh
$ npm start
```

This starts local development server and "watch" tasks.  
When you save a source code, it will be compiled and reload browser automatically.

## Structure

```
gulp-boilerplate/
├── app/                 : Application files
│   ├── styles/          : Stylesheets
│   ├── scripts/         : Scripts
│   ├── images/          : Images
│   │   └── _sprites/    : Base images for spritesheet
│   └── index.html       : Index page
├── dist/                : Production files (Not tracked in Git)
├── tasks/               : Additional gulp tasks
├── gulpfile.js          : Base gulp config
└── package.json         : Package information including dependencies
```

## Build tasks

| Command              | Gulp task     | Summary                                       |
|----------------------|---------------|-----------------------------------------------|
| **`npm start`**      | `gulp serve`  | Start local development server.               |
| **`npm run build`**  | `gulp`        | Lint code and build to production files.      |
| **`npm run deploy`** | `gulp deploy` | Deploy production files to `gh-pages` branch. |
