/**
 * Cache store unimportant information
 */
import { CONSTANT } from '../constant'


const localStorage = {
	data:{}
}
localStorage.getItem = function(key){
	return localStorage.data[key]
}
localStorage.setItem = function(key,data){
	return localStorage.data[key] = data
}
localStorage.removeItem = function(key){
	delete localStorage.data[key]
}
localStorage.clear = function(){
	localStorage.data = {}
}

function get(key) {
	let data = localStorage.getItem(key)
	try {
		data = JSON.parse(data)
	} catch (e) {}
	return data
}

function set(key, data) {
	let tmpl_data = {}
	tmpl_data[key] = data
	if (typeof data == 'object') {
		data = JSON.stringify(data)
	}
	localStorage.setItem(key, data)
}

function remove(key) {
	localStorage.removeItem(key)
}

function clear() {
	localStorage.clear()
}




export default {
	//service logic
	getNetwork() {
		return get('network') || CONSTANT.DEFAULT_NETWORK;
	},
	setNetwork(value) {
		return set('network', value);
	},
	removeNetwork() {
		return remove('network');
	},
	getCustomNetwork() {
		return get('customNetwork') || [];
	},
	setCustomNetwork(value) {
		return set('customNetwork', value);
	},
	removeCustomNetwork() {
		return remove('customNetwork');
	},
	getAssetInfo() {
		return get('assetInfoes') || {};
	},
	setAssetInfo(value) {
		return set('assetInfoes', value);
	},
	removeAssetInfo(k) {
		return remove('assetInfoes')
	}
}