import inquirer from "inquirer";
import ObsWebSocket from "obs-websocket-js";
import Client from "vex-tm-client";
import { join } from "path";
import { promises as fs } from "fs";
import { cwd } from "process";
import Fieldset from "vex-tm-client/out/Fieldset";
import Division from "vex-tm-client/out/Division";
import { Atem } from "atem-connection";
import OBSWebSocket from "obs-websocket-js";
import Keyv from 'keyv';

const keyv = new Keyv('sqlite://config.sqlite');

export async function getFieldset(tm: Client) {
    const defaultFieldSet = await keyv.get("fieldsetChoice");
    const response: { fieldset: string } = await inquirer.prompt([
        {
            name: "fieldset",
            type: "list",
            message: "Which fieldset do you wish to control? ",
            choices: tm.fieldsets.map((d) => d.name),
            default: defaultFieldSet,
        },
    ]);

    await keyv.set("fieldsetChoice", response.fieldset);

    return tm.fieldsets.find(
        (set) => set.name === response.fieldset
    ) as Fieldset;
};

export async function getAssociations(fieldset: Fieldset, obs: ObsWebSocket | null, atem: Atem | null) {
    const fields = fieldset.fields;

    const scenes = await obs?.call("GetSceneList") ?? { scenes: [] };


    const associations: { obs: string | undefined, atem: number | undefined }[] = [];

    for (const field of fields) {

        const questions: any[] = [];

        if (obs && scenes.scenes.length > 0) {
            const fieldDefault = await keyv.get("field" + field.id + "SceneChoice");
            questions.push(
                {
                    name: "obs",
                    type: "list",
                    message: `What OBS scene do you want to associate with ${field.name}? `,
                    choices: scenes.scenes.map((s) => s.sceneName),
                    default: fieldDefault,
                },
            );
        }

        if (atem && atem.state) {

            const inputs = Object.entries(atem.state?.inputs);
            const fieldAtemDefault = await keyv.get("field" + field.id + "AtemChoice");
            questions.push(
                {
                    name: "atem",
                    type: "list",
                    message: `What ATEM input do you want to associate with ${field.name}? `,
                    choices: inputs.map(([value, input]) => ({ name: input?.shortName, value: Number.parseInt(value) })),
                    default: fieldAtemDefault,
                }
            );
        }

        const response: { obs: string | undefined, atem: number | undefined } = await inquirer.prompt(questions);
        associations[field.id] = response;
        await keyv.set("field" + field.id + "SceneChoice", response.obs);
        await keyv.set("field" + field.id + "AtemChoice", response.atem);
    };

    {
        //set up obs audience display selection
        const questions: any[] = [];

        if (obs && scenes.scenes.length > 0) {
            const fieldDefault = await keyv.get("audienceSceneChoice");
            questions.push(
                {
                    name: "obs",
                    type: "list",
                    message: `What OBS scene do you want to associate with Audience Display? `,
                    choices: scenes.scenes.map((s) => s.sceneName),
                    default: fieldDefault,
                },
            );
        }

        if (atem && atem.state) {

            const inputs = Object.entries(atem.state?.inputs);
            const fieldAtemDefault = await keyv.get("audienceAtemChoice");
            questions.push(
                {
                    name: "atem",
                    type: "list",
                    message: `What ATEM input do you want to associate with Audience Display? `,
                    choices: inputs.map(([value, input]) => ({ name: input?.shortName, value: Number.parseInt(value) })),
                    default: fieldAtemDefault,
                }
            );
        }
        const response: { obs: string | undefined, atem: number | undefined } = await inquirer.prompt(questions);
        associations[99] = response; //use field 99 as audience display
        await keyv.set("audienceSceneChoice", response.obs);
        await keyv.set("audienceAtemChoice", response.atem);
    }

    return associations;
};

export async function getAudienceDisplayOptions(obs: ObsWebSocket | null, atem: Atem | null) {

    type Choices = "queueIntro" | "preventSwitch" | "savedScore" | "rankings" | "useIntroAsInMatch" | "introObs" | "introAtem";
    const choices: { name: string; value: Choices }[] = [
        { name: "Show intro upon match queue", value: "queueIntro" },
        { name: "Prevent switching display mode in-match", value: "preventSwitch" },
        { name: "Show saved score 3 seconds after match", value: "savedScore" },
        { name: "Flash rankings 3 seconds after every 6th match", value: "rankings" },
        { name: "Use Intro in place of In-Match when queueing", value: "useIntroAsInMatch" }
    ];
    const audienceChoicesDefault = await keyv.get("audienceChoicesDefault");

    const response: { options: Choices[] } = await inquirer.prompt([
        {
            name: "options",
            type: "checkbox",
            message: "Which audience display automation would you like to enable?",
            default: audienceChoicesDefault,
            choices
        }
    ]);

    await keyv.set("audienceChoicesDefault", response.options);

    const flags = Object.fromEntries(choices.map(ch => [ch.value, false])) as Record<Choices, boolean | string | number>;

    for (const option of response.options) {
        flags[option] = true;
    };

    if(flags["useIntroAsInMatch"] == true)
    {
        //we want to use Intro instead of In-Match, let's connect that to an OBS/Atem Scene?
        const scenes = await obs?.call("GetSceneList") ?? { scenes: [] };
        const questions: any[] = [];
        if (obs && scenes.scenes.length > 0) {

            const introDefault = await keyv.get("introSceneChoice");
            questions.push(
                {
                    name: "obs",
                    type: "list",
                    message: `What OBS scene do you want to associate with Intro? `,
                    choices: scenes.scenes.map((s) => s.sceneName),
                    default: introDefault,
                },
            );
        };
        if (atem && atem.state) {

            const inputs = Object.entries(atem.state?.inputs);
            const introAtemDefault = await keyv.get("introAtemChoice");
            questions.push(
                {
                    name: "atem",
                    type: "list",
                    message: `What ATEM input do you want to associate with Intro? `,
                    choices: inputs.map(([value, input]) => ({ name: input?.shortName, value: Number.parseInt(value) })),
                    default: introAtemDefault,
                }
            );
        };
        const response: { obs: string | undefined, atem: number | undefined } = await inquirer.prompt(questions);
        if(response.atem) {
            flags['introAtem'] = response.atem;
            await keyv.set("introAtemChoice", response.atem);
        }
        if(response.obs) {
            flags['introObs'] = response.obs;
            await keyv.set("introSceneChoice", response.obs);
        }
    };

    return flags;
};

export async function getRecordingOptions(tm: Client, obs: OBSWebSocket | null) {

    let response = { recordIndividualMatches: false };
    if (obs) {
        const recordIndividualMatchesDefault = await keyv.get("recordIndividualMatches");
        response = await inquirer.prompt([
            {
                name: "recordIndividualMatches",
                type: "confirm",
                message: "Start and stop recording for each match? ",
                default: recordIndividualMatchesDefault
            }
        ]);
    }

    await keyv.set("recordIndividualMatches", response.recordIndividualMatches);

    let division: Division = tm.divisions[0];
    if (tm.divisions.length > 1) {
        const divisionDefault = await keyv.get("divisionDefault");
        const response: { division: number } = await inquirer.prompt([
            {
                name: "division",
                type: "list",
                message: "Which division do you wish to record? ",
                choices: tm.divisions.map(d => ({ name: d.name, value: d.id }))
            },
        ]);

        await keyv.set("divisionDefault", response.division);

        division = tm.divisions.find(d => d.id === response.division) as Division;
    };

    const directory = cwd();

    const date = new Date();
    const path = join(directory, `tm_obs_switcher_${date.getDate()}_${date.getMonth() + 1}_${date.getFullYear()}_times.csv`);

    console.log(`  Will save match stream times to ${path}`);
    const handle = await fs.open(path, "a");

    const stat = await handle.stat();

    if (stat.size > 0) {
        console.log(`  File already exists, will append new entries...`);
    } else {
        handle.write("TIMESTAMP,OBS_TIME,MATCH,RED_TEAMS,BLUE_TEAMS\n");
    }

    return { handle, division, ...response }
};
