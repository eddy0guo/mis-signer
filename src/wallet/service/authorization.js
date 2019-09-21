import Storage from 'storage';


const maxAuthorizationAge = 7 * 24 * 60 * 60 * 1000;

export default class Authorization {

  constructor() {
    this.licensores = {};
    this.init();
  }

  async init() {
    this.activeWltId = await Storage.get("activeWltId");
    this.licensores = await Storage.get(`licensores_${this.activeWltId}`);

    if (!this.licensores) {
      this.licensores = {};
    }
  }

  addLicensor(licensor) {
    licensor.authorizationTime = new Date().valueOf();
    this.licensores[licensor.licensorId] = licensor;
    Storage.set(`licensores_${this.activeWltId}`, this.licensores);
  }

  removeLicensor(licensorId) {
    delete(this.licensores, licensorId);
    Storage.set(`licensores_${this.activeWltId}`, this.licensores);
  }

  async getLicensor(licensorId) {
   
    this.activeWltId = await Storage.get("activeWltId");
    this.licensores = await Storage.get(`licensores_${this.activeWltId}`)||{};

    const licensor = this.licensores[licensorId];
    if (licensor) {
      const lastAuthorizationTime = licensor.authorizationTime;
      if (maxAuthorizationAge > (new Date().valueOf() - lastAuthorizationTime)) {
        return licensor;
      } else {
        return null;
      }
    }
    return null;
  }
}