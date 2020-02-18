
class TestAsync{
    private item:string = 'TestAsyncItem';
    constructor(){
        this.start()
    }

    start(ms:number=100){
        setTimeout(async () => {
            await this.loop();
        }, ms);
    }

    async loop():Promise<void>{
        const date = await this.getDate();
        console.log(date,this.item);
        this.start();
    }

    async getDate():Promise<Date>{
        return new Promise((resolve, rejects) => {
            setTimeout( () => {
                resolve(new Date());
            })
        });
    }
}

const testAsync = new TestAsync();
testAsync.start();
