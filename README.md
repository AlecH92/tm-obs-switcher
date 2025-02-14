![TM Switcher](https://user-images.githubusercontent.com/8839926/194345784-558c3ab7-8e0b-4d5d-a789-0ef14376bb56.png)


TM Switcher will automatically manage robotics competition livestreams that use VEX Tournament Manager. Typically, most events require a dedicated volunteer to handle switching cameras between fields and controlling the audience displays.

This application provides a level of automation to vastly simplify the workload involved in running a livestream for your event. See below for a list of features!

- Integrate with OBS to automatically change scenes when matches are queued or started

- Capable of controlling an ATEM switcher over the network when matches are queued or started

- Automatically switch audience display to show match results when a match ends

- Automatically show rankings intermitently throughout the event

- Record timestamps for when each match starts and its timestamp in the livestream

- Create recordings for every match

![image](https://user-images.githubusercontent.com/8839926/153454145-18752edc-5022-4fa5-a0eb-538dfd4a5a1e.png)

## Install

Download the most recent build for your OS from [releases](https://github.com/MayorMonty/tm-obs-switcher/releases/), and run! 

## Run From Source

If you don't want to run from the precompiled executable, you can alternatively
run this program from the source code. This requires you have the following
software installed:

- [Nodejs](https://nodejs.org) v14
- [Git](https://git-scm.com) (reccomended)

1. Clone or download this repository
2. In a terminal window inside the cloned source, run the following commands:

```
npm install
npm run-script build
```

3. To run the program, enter the command:

```
npm run-script run
```


## Troubleshooting

Some key implementation details to be aware of when deploying this at your event!

- Make sure your LAN allows connections between devices! For our events, we will deploy our own router, attached to the upstream network. This is strongly reccomended if you use tablet scoring or multiple computers in your tournament. Additionally make sure that connections at the following ports are allowed between devices on your network: `80`, `4455`

- Due to a quirk in the `atem-connection` module, ATEM control over USB is not supported. You will need to ensure that your switcher is connected to the network. Be advised that most ATEM switchers assign themselves static IPs (usually 192.168.10.240), so make sure that your router is able to assign that IP. Use the ATEM Setup utility over USB to connect 


If your event runs into trouble with this tool, please reach out to me!.
