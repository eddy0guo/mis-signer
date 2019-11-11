import DBConfig from '../config/database'
import mongoose from 'mongoose'

const db = mongoose.connect(DBConfig.database, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

module.exports = db