import { Router } from 'express';

export default (options) => {
	if(options)console.log(options)

	let api = Router();
	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json('hello bot');
	});

	return api;
}
