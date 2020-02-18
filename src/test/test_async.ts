
class TestAsync{
    private item:string = 'TestAsyncItem';
    constructor(){
        // this.start()
        this.loop()
    }

    start(ms:number=100){
        setTimeout(async () => {
            await this.loop();
        }, ms);
    }

    async loop():Promise<void>{
        let date = await this.getDate();
        console.log('1',date,this.item);
        date = await this.getDate();
        console.log('2',date,this.item);
        date = await this.getDate();
        console.log('3',date,this.item);
        this.start();
    }

    async getDate():Promise<Date>{
        return new Promise((resolve, rejects) => {
            setTimeout( () => {
                resolve(new Date());
            },500)
        });
    }
}

const testAsync = new TestAsync();
