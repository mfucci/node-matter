# node-matter

[![license](https://img.shields.io/badge/license-Apache2-green.svg?style=flat)](https://raw.githubusercontent.com/mfucci/node-matter/master/LICENSE) 

Matter protocol for node.js with no native dependencies (and very limited dependencies).

Matter is a new secure / reliable / local / standard protocol for smart devices that will launch at the end of 2022.

It is supported and Google / Apple / Amazon and 200+ other companies and it is supposed to bring a revolution in smart home automation by unifying WiFi / Bluetooth / Zigbee (through Thread) and by making all smart devices inter-compatible and secure (through the standard and secure Matter protocol).

To know more about Matter: https://csa-iot.org/all-solutions/matter/

## Installation

```bash
npm i -g node-matter
```

## Usage

```bash
node-matter
```

This starts a Matter server listening on port 5540.

This first version only includes the OnOff cluster (on/off smart thing, like a plug or a bulb).
You can use -on and -off parameter to run a script to control something.
For instance, on a Raspberry Pi, this will turn on / off the red LED:

```bash
node-matter -on "echo 255 > /sys/class/leds/led1/brightness" -off "echo 0 > /sys/class/leds/led1/brightness"
```

## Modifying the server behavior

Main.ts defines the server behavior. You can add / remove clusters, change default parameters, etc...

```typescript
new MatterServer()
    .addChannel(new UdpChannel(5540))
    .addProtocolHandler(Protocol.SECURE_CHANNEL, new SecureChannelHandler(
            new PasePairing(20202021, { iteration: 1000, salt: Crypto.getRandomData(32) }),
            new CasePairing(),
        ))
    .addProtocolHandler(Protocol.INTERACTION_MODEL, new InteractionProtocol(new Device([
        new Endpoint(0x00, "MA-rootdevice", [
            new BasicCluster({ vendorName: "node-matter", vendorId: 0xFFF1, productName: "Matter test device", productId: 0X8001 }),
            new GeneralCommissioningCluster(),
            new OperationalCredentialsCluster(),
        ]),
        new Endpoint(0x01, "MA-OnOff", [
                new OnOffCluster(executor("on"), executor("off")),
        ]),
    ])))
    .start()
```

## What can I use to control my device?

It should work with any Matter-compatible home automation app when Matter will be released.

For now, you can control it with Matter test app: https://github.com/project-chip/connectedhomeip/tree/master/src/android/CHIPTest
You can find a compiled apk in /matter-test-apk in this repository.

*Provisioning the device*: click "provision with WiFi" > "Input Device address" > type IP address of the machine running node-matter
*Controlling the device*: click "Light on/of" and you can control the light

## FAQ

### Why using node-matter instead of the official codebase?

Well, the original codebase is platform dependent, has finicky tool version requirements and is over 8GB with all dependencies.
This tool is less than 500kB and works on anything supporting node. Sure, it supports only the barebone Matter protocol for now.

### Can this work from a browser?

Not yet, but I know how to make it works with a few tricks.

### How can I have support for more clusters?

Adding more clusters should be pretty easy now the core protocol is working.
Have a look at the implementation of the OnOff cluster: pretty simple, right?

I am planning on adding more clusters, so stay tuned or pinged me to implement first the one you need.

### Contact the author

For other questions, you can reach out to: mfucci@gmail.com or post a message on the github forum.
