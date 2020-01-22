module.exports = {
    "env": {
        "node": true,
        "commonjs": true,
        "browser": false,
        "es6": true,
        "jest/globals": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:jest/recommended",
        "plugin:jest/style",
    ],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "no-console": "off",
        "jest/no-disabled-tests": "warn",
        "jest/no-focused-tests": "error",
        "jest/no-identical-title": "error",
        "jest/prefer-to-have-length": "warn",
        "jest/valid-expect": "error"
    },
    "plugins": ["jest"]
};