export default (name:string) =>{
    process.on('unhandledRejection', (reason, p) => {
        console.log(`[${name}]:Unhandled Rejection at Promise: `,reason);
        // application specific logging, throwing an error, or other logic here
    });
}