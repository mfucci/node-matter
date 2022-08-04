import dgram from "dgram";

export function createDgramSocket(port: number, options: dgram.SocketOptions) {
    const socket = dgram.createSocket(options);
    return new Promise<dgram.Socket>((resolve, reject) => {
        const handleBindError = (error: Error) => {
            socket.close();
            reject(error);
        };
        socket.on("error", handleBindError);
        socket.bind(port, () => {
            socket.removeListener("error", handleBindError);
            socket.on("error", error => console.log(error));
            resolve(socket);
        });
    });
}
