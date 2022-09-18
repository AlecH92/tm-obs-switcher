import inquirer from "inquirer";
import Client, { AuthenticatedRole } from "vex-tm-client";
import OBSWebSocket from "obs-websocket-js";
import Keyv from 'keyv';

const keyv = new Keyv('sqlite://config.sqlite');

export async function getTournamentManagerCredentials(): Promise<{
  address: string;
  password: string;
}> {
  var tmAddress = await keyv.get('tmAddress');
  var tmPassword = await keyv.get('tmPassword');
  if(!tmAddress)
  {
    tmAddress = "127.0.0.1";
  }
  return inquirer.prompt([
    {
      type: "input",
      message: "VEX TM Address:",
      name: "address",
      default() {
        return tmAddress;
      },
    },
    {
      type: "password",
      message: "VEX TM Password:",
      mask: "*",
      name: "password",
      default() {
        return tmPassword;
      }
    },
  ]);
}

export async function getOBSCredentials(): Promise<{
  address: string;
  password: string;
}> {
  var obsAddress = await keyv.get('obsAddress');
  var obsPassword = await keyv.get('obsPassword');
  if(!obsAddress)
  {
    obsAddress = "ws://127.0.0.1:4455";
  }
  return inquirer.prompt([
    {
      type: "input",
      message: "OBS Websocket Address:",
      name: "address",
      default() {
        return obsAddress;
      },
    },
    {
      type: "password",
      message: "OBS Websocket (leave blank for no password):",
      mask: "*",
      name: "password",
      default() {
        return obsPassword;
      },
    },
  ]);
}

export async function getCredentials() {
  const tm = await getTournamentManagerCredentials();
  const obs = await getOBSCredentials();
  await keyv.set('tmAddress', tm.address);
  await keyv.set('tmPassword', tm.password);
  await keyv.set('obsAddress', obs.address);
  await keyv.set('obsPassword', obs.password);

  return { tm, obs };
}

async function keypress() {
  return new Promise((resolve, reject) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', resolve);
  });
};

export async function connectTM({
  address,
  password,
}: {
  address: string;
  password: string;
}) {
  const client = new Client(
    `http://${address}`,
    AuthenticatedRole.ADMINISTRATOR,
    password
  );

  try {
    await client.connect();
  } catch (e: any) {
    console.log("❌ Tournament Manager: " + e.message);

    if (e.message.includes("cookie")) {
      console.log("\nCould not automatically generate cookie. Check to ensure you are connecting to the correct address.");
    } else if (e.message.includes("ECONNREFUSED")) {
      console.log("\nCould not connect to the Tournament Manager server. Ensure you have started it and that the address is correct. ");
    };

    await keypress();
    process.exit(1);
  }

  return client;
}

export async function connectOBS(creds: { address: string; password: string }) {
  const obs = new OBSWebSocket();

  try {
    await obs.connect(creds.address, creds.password);
    return obs;
  } catch (e: any) {
    console.log("❌ Open Broadcaster Studio: ", e);

    await keypress();
    process.exit(1);
  };
}