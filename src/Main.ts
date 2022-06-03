import { Dispatcher } from "./transport/Dispatcher";
import { Udp } from "./transport/Udp";

class Main {
    start() {
        new Udp(new Dispatcher()).start();
    }
}

new Main().start();
