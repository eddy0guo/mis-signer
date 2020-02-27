import * as v8 from 'v8';

type K = keyof v8.HeapInfo;

class Health {
  private heapInfo: v8.HeapInfo;
  private spaceInfo: v8.HeapSpaceInfo[];
  constructor() {
    this.heapInfo = v8.getHeapStatistics();
    this.spaceInfo = v8.getHeapSpaceStatistics();
  }
  checkHeapInfo() {
    const newInfo = v8.getHeapStatistics();
    const newSpaceInfo = v8.getHeapSpaceStatistics();

    const size = newInfo.used_heap_size - this.heapInfo.used_heap_size;
    console.log(`heap size changed: ${(size / 1024).toFixed(2)}kb`);

    this.heapInfo = newInfo;
    this.spaceInfo = newSpaceInfo;
    // console.log(newSpaceInfo);
    this.printInfo();
  }
  start() {
    setInterval(() => {
      this.checkHeapInfo();
    }, 60*1000);
  }
  printInfo() {
    console.log(
      'heap size used',
      (
        (this.heapInfo.used_heap_size / this.heapInfo.total_heap_size) *
        100
      ).toFixed(2),
      '%'
    );
    const info = new Map<string, string>();

    for (const k in this.heapInfo) {
      if( !this.heapInfo[k as K] ) continue;
      const v = this.heapInfo[k as K];
      const kb = (v / 1024).toFixed(2) + 'KB';
      const mb = (v / 1024 / 1024).toFixed(2) + 'MB';
      info.set(k, v > 1024 * 1024 ? mb : kb);
    }
    console.log(info);
    const space = new Map<string, string>();
    this.spaceInfo.forEach(e => {
      const kb = (e.space_used_size / 1024).toFixed(2) + 'KB';
      const mb = (e.space_used_size / 1024 / 1024).toFixed(2) + 'MB';
      space.set(e.space_name, e.space_used_size > 1024 * 1024 ? mb : kb);
    });
    console.log(space);
  }
}

export { Health };
