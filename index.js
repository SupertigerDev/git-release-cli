#!/usr/bin/env node

import shell from 'shelljs';
import { group, intro, multiselect, outro, select, spinner, text } from '@clack/prompts';
import fetch from 'node-fetch';

intro(`Create A New Release`);

// shell.exec("git pull")

const repoUrl = shell.exec("git config --get remote.origin.url", {silent: true}).stdout

const s = spinner();
s.start('Fetching Current Tag Name...');
const tagName = await latestTagName(repoUrl)
s.stop(`Current Tag Name: ${tagName}`);


const newTag = await text({
    message: 'New Tag',
    initialValue: tagName,
});


outro(`You're All Set!`);

async function latestTagName(repoUrl) {
    const split = repoUrl.split("/");
    const owner = split[3]
    const repo = split[4].split(".git")[0]
    const getLatestReleaseUrlEntpoint = `https://api.github.com/repos/${owner}/${repo}/releases/latest`

    const res = await fetch(getLatestReleaseUrlEntpoint).then(res => res.json());
    return res.tag_name
}
