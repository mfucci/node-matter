
2/2/2023

Simple examples of utilizng the node-matter library.

Humidity Sensor Device
Illuminance Sensor Device
Temperature Sensor Device


Each example takes an argument to specify a script that will
provide the appropriate value for the sensor.  These scripts
can do whatever they need to fetch a value, e.g. read a file,
execute another program, scrape a value from another web site
with curl, generate a random number, etc.

Examples I use with the bash shell: 

TemperatureSenserDevice : -temperature "echo \$RANDOM % 100 | bc"
HumiditySensorDevice : -watercontent "echo \$RANDOM % 10000 | bc"
IlluminanceDevice : -illuminance "echo \$RANDOM % 100 | bc"

In addition, the Temperature sensor example has code to read
and process UDP packets from a local weather station I have
on my network



