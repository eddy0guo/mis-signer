/**
 * Storage store important information
 */

const localStorage = {
  data: {},
  getItem: key => {
    return localStorage.data[key];
  },
  setItem: (key, data) => {
    return (localStorage.data[key] = data);
  },
  removeItem: key => {
    delete localStorage.data[key];
  },
  clear: () => {
    localStorage.data = {};
  },
};

export default {
  get(key) {
    return new Promise((resolve, reject) => {
      let data = localStorage.getItem(key);
      try {
        data = JSON.parse(data);
      } catch (e) {
        console.error(e)
      }
      resolve(data);
    });
  },
  set(key, data) {
    const tmpl_data = {};
    tmpl_data[key] = data;
    return new Promise((resolve, reject) => {
      if (typeof data === 'object') {
        data = JSON.stringify(data);
      }
      localStorage.setItem(key, data);
      resolve();
    });
  },
  remove(key) {
    return new Promise((resolve, reject) => {
      localStorage.removeItem(key);
      resolve();
    });
  },
  clear() {
    return new Promise((resolve, reject) => {
      localStorage.clear();
      resolve();
    });
  },
  setKeypair(data) {
    return this.set('p_a', data);
  },
  getKeypair() {
    return this.get('p_a');
  },
  removeKeypair() {
    return this.remove('p_a');
  },
  setPubKeys(data) {
    return this.set('pubKeys', data);
  },
  getPubKeys() {
    return this.get('pubKeys');
  },
  removePubKeys() {
    return this.remove('pubKeys');
  },
};
