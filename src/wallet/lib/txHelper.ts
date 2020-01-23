'use strict';
let ethers = require('@spinlee/ethers');

module.exports = {
  makeFullTupleTypeDefinition (typeDef) {
    if (typeDef && typeDef.type.indexOf('tuple') === 0 && typeDef.components) {
      const innerTypes = typeDef.components.map((innerType) => innerType.type);
      return `tuple(${innerTypes.join(',')})${this.extractSize(typeDef.type)}`;
    }
    return typeDef.type;
  },

  encodeParams (funABI, args) {
    const types = [];
    if (funABI.inputs && funABI.inputs.length) {
      for (let i = 0; i < funABI.inputs.length; i++) {
        const type = funABI.inputs[i].type;
        types.push(type.indexOf('tuple') === 0 ? this.makeFullTupleTypeDefinition(funABI.inputs[i]) : type);
        if (args.length < types.length) {
          args.push('');
        }
      }
    }

    // NOTE: the caller will concatenate the bytecode and this
    //       it could be done here too for consistency
    const abiCoder = new ethers.utils.AbiCoder();
    return abiCoder.encode(types, args);
  },

  encodeFunctionId (funABI) {
    if (funABI.type === 'fallback') return '0x';
    let abi = new ethers.utils.Interface([funABI]);
    abi = abi.functions[funABI.name];
    return abi.sighash;
  },

  sortAbiFunction (contractabi) {
    // Sorts the list of ABI entries. Constant functions will appear first,
    // followed by non-constant functions. Within those t wo groupings, functions
    // will be sorted by their names.
    return contractabi.sort(function (a, b) {
      if (a.constant === true && b.constant !== true) {
        return 1;
      } else if (b.constant === true && a.constant !== true) {
        return -1;
      }
      // If we reach here, either a and b are both constant or both not; sort by name then
      // special case for fallback and constructor
      if (a.type === 'function' && typeof a.name !== 'undefined') {
        return a.name.localeCompare(b.name);
      } else if (a.type === 'constructor' || a.type === 'fallback') {
        return 1;
      }
    });
  },

  getConstructorInterface (abi) {
    const funABI = { name: '', inputs: [], type: 'constructor', outputs: [] };
    if (typeof abi === 'string') {
      try {
        abi = JSON.parse(abi);
      } catch (e) {
        console.log('exception retrieving ctor abi ' + abi);
        return funABI;
      }
    }

    for (let i = 0; i < abi.length; i++) {
      if (abi[i].type === 'constructor') {
        funABI.inputs = abi[i].inputs || [];
        break;
      }
    }

    return funABI;
  },

  serializeInputs (fnAbi) {
    let serialized = '(';
    if (fnAbi.inputs && fnAbi.inputs.length) {
      serialized += fnAbi.inputs.map((input) => { return input.type; }).join(',');
    }
    serialized += ')';
    return serialized;
  },

  extractSize (type) {
    const size = type.match(/([a-zA-Z0-9])(\[.*\])/);
    return size ? size[2] : '';
  },

  getFunction (abi, fnName) {
    for (let i = 0; i < abi.length; i++) {
      const fn = abi[i];
      if (fn.type === 'function' && fnName === fn.name + '(' + fn.inputs.map((value) => {
        if (value.components) {
          // we extract the size (if array) and append it later
          const size = this.extractSize(value.type);
          return `(${value.components.map((value) => { return value.type; }).join(',')})${size}`;
        } else {
          return value.type;
        }
      }).join(',') + ')') {
        return fn;
      }
    }
    return null;
  },

  getFallbackInterface (abi) {
    for (let i = 0; i < abi.length; i++) {
      if (abi[i].type === 'fallback') {
        return abi[i];
      }
    }
  },

  /**
    * return the contract obj of the given @arg name. Uses last compilation result.
    * return null if not found
    * @param {String} name    - contract name
    * @returns contract obj and associated file: { contract, file } or null
    */
  getContract: (contractName, contracts) => {
    for (const file in contracts) {
      if (contracts[file][contractName]) {
        return { object: contracts[file][contractName], file };
      }
    }
    return null;
  },

  /**
    * call the given @arg cb (function) for all the contracts. Uses last compilation result
    * stop visiting when cb return true
    * @param {Function} cb    - callback
    */
  visitContracts: (contracts, cb) => {
    for (const file in contracts) {
      for (const name in contracts[file]) {
        if (cb({ name, object: contracts[file][name], file })) return;
      }
    }
  },

  inputParametersDeclarationToString (abiinputs) {
    const inputs = (abiinputs || []).map((inp) => inp.type + ' ' + inp.name);
    return inputs.join(', ');
  },

};
