import { MatterController } from "./matter/MatterController";

const controller = new MatterController();
const temperatureSensor = controller.getNode(1).getCluster(TemperatureSensorCluster);
const acSwitch = controller.getNode(2).getCluster(OnOffCluster);

acSwitch.subscribeOn(on => {
    if (on) {
        console.log("AC has been turned on");
    } else {
        console.log("AC has been turned off");
    }
});

temperatureSensor.subscribeTemperature(temperature => {
    console.log(`Temperature is: ${temperature}`);
    const acOn = acSwitch.getOn();
    if (!acOn && temperature > Fahrenheit(80)) acSwitch.on();
    if (acOn && temperature < Fahrenheit(75)) acSwitch.off();
}, { interval: Minutes(5) });
