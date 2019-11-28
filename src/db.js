import db from './did/models/db'

export default callback => {
	// connect to a database if needed, then pass it to `callback`:
	callback(db);
}
