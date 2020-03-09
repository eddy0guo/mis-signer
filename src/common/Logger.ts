export class Logger {
  static logCount = 0;
  static lastLogTime: Date = new Date();
  constructor(
    private name = 'Logger',
    private timeout:number = 15 * 1000,
  ){
    setInterval(()=>{
      this.tick();
    },1000);
  }

  // tslint:disable-next-line: no-any
  log(message?: any, ...optionalParams: any[]): void{
    Logger.logCount ++;
    Logger.lastLogTime = new Date();
    console.log(`[${this.name}] ${Logger.lastLogTime.toLocaleTimeString()} (${Logger.logCount})`,
    message , ...optionalParams);
  }

  tick():void{
    const now = new Date();
    const waiting = now.getTime() - Logger.lastLogTime.getTime();
    if( waiting > this.timeout ){
      this.log(`Say Goodbye after waiting: ${(waiting/1000).toFixed(1)}s`);
      process.exit(-1);
    }
  }
}