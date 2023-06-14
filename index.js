#!/usr/bin/env node

import shell from 'shelljs';
import { group, intro, multiselect, outro, select, spinner, text, log } from '@clack/prompts';
import fetch from 'node-fetch';

intro(`Create A New Release`);

// shell.exec("git pull")

const repoUrl = shell.exec("git config --get remote.origin.url", {silent: true}).stdout;
const split = repoUrl.split("/");
const owner = split[3];
const repo = split[4].split(".git")[0];

const s = spinner();
s.start('Fetching Current Tag Name...');
const tagName = await latestTagName()
s.stop(`Current Tag Name: ${tagName}`);

await createNewTag();




async function createNewTag() {
    const newTag = await text({
        message: 'New Tag',
        initialValue: tagName,
    });
    const s = spinner();
    s.start('Checking...');
    const tagExists = await fetchTagExists(newTag);
    s.stop('Checking...')
    if (tagExists) {
        log.warning("This tag already exists.")
        return await createNewTag()
    }
    outro(`Creating and Pushing Tag...`);
    shell.exec(`git tag ${newTag}`)
    shell.exec(`git push origin ${newTag}`)
}



async function latestTagName() {
    const getLatestReleaseUrlEntpoint = `https://api.github.com/repos/${owner}/${repo}/releases/latest`

    const res = await fetch(getLatestReleaseUrlEntpoint).then(res => res.json());
    return res.tag_name
}


async function fetchTagExists(tagName) {
    const getTagEndpoint = `https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${tagName}`;

    const res = await fetch(getTagEndpoint);
    return res.status === 200;
}
