import {local,origin} from '../config/database'
import mongoose from 'mongoose'

const local_db = mongoose.createConnection(local.database, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const origin_db = mongoose.createConnection(origin.database, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})



export {local_db,origin_db}
