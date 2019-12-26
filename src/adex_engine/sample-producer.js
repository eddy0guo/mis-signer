import Queue from 'bull'

function Consumer() {

    var orderQueue = new Queue('OrderQueue', 'redis://127.0.0.1:6379');
    var count = 0;
    function addJob() {
        orderQueue.add({
            test: 'pending order job',
            count:count++
        })
        setTimeout(() => {
            addJob()
        }, 1000)
    }

    addJob()
}

export default new Consumer();