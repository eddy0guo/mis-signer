import * as Queue from 'bull'
import NP from 'number-precision'
import to from 'await-to-js'

import DBClient from '../adex/models/db'
import Utils from '../adex/api/utils'



class QueueWS {

    private queue: Queue.Queue;
    private db:DBClient;
    private utils:Utils;
    private client:any;
    private readonly queueName:string;



    constructor(client,queueName) {
        this.client = client;
        this.db = new DBClient();
        this.utils = new Utils();
        this.queueName = queueName
    }

    async initQueue():Promise<void>{
        if( this.queue ){
            await this.queue.close();
        }

        this.queue = new Queue(this.queueName + process.env.MIST_MODE,
            {
                redis: {
                    port: Number(process.env.REDIS_PORT),
                    host: process.env.REDIS_URL,
                    password: process.env.REDIS_PWD
                }
            });
        this.queue.on('error',async e => {
            console.log('[ADEX ENGINE] Queue on Error', e);
            console.log('[ADEX ENGINE] Trying initQueue...')
            await this.initQueue();
        })
        this.start();

    }

    async start():Promise<void> {
            this.queue.process(async (job, done) => {
            console.log(`[ADEX WS]receive a message %o from %o\n`, job.data,job.queue.name);
            const message = job.data;
            const channel = this.queueName + '.' + message.id;
            this.client.emit(channel, message.data); // emit an event to all connected sockets
            done()
        });
        const queueReady = await this.queue.isReady();

        if( queueReady ){
            console.log(`[ADEX WS] started,order queue ready:`);
        }
    }


}

process.on('unhandledRejection', (reason, p) => {
    console.log('[ADEX WS] Unhandled Rejection at: Promise', p, 'reason:', reason);
    // application specific logging, throwing an error, or other logic here
});

export default QueueWS;
