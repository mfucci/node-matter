import { networkInterfaces, NetworkInterfaceInfo } from "os";

export function getIpMacAddresses() {
    const interfaces = networkInterfaces();
    for (var name in interfaces) {
        const netInterfaces = interfaces[name] as NetworkInterfaceInfo[];
        for (var netInterface of netInterfaces) {
            if (netInterface.internal || netInterface.family !== "IPv4") continue;
            return {ip: netInterface.address, mac: netInterface.mac};
        }
    }
    throw new Error(`Cannot determine the host IP address`);
}