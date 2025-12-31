#!/usr/bin/env node

import shell from "shelljs";
import {
  group,
  intro,
  multiselect,
  outro,
  select,
  spinner,
  text,
  confirm,
  log,
} from "@clack/prompts";
import fetch from "node-fetch";

intro(`Create A New Release`);

// shell.exec("git pull")

const repoUrl = shell.exec("git config --get remote.origin.url", {
  silent: true,
}).stdout;
const split = repoUrl.split("/");
const owner = split[3];
const repo = split[4].split(".git")[0];

await ensureMainBranch();
await ensureLatestCommit();

const s = spinner();
s.start("Fetching Current Tag Name...");
const tagName = await latestTagName();
s.stop(`Current Tag Name: ${tagName}`);

await createNewTag();

async function ensureMainBranch() {
  const currentBranch = shell
    .exec("git rev-parse --abbrev-ref HEAD", { silent: true })
    .trim();

  if (currentBranch !== "main" && currentBranch !== "master") {
    const shouldSwitch = await confirm({
      message: `You are on "${currentBranch}". Switch to main/master?`,
    });

    if (shouldSwitch) {
      const targetBranch = shell.ls(".git/refs/heads/main").length
        ? "main"
        : "master";
      shell.exec(`git checkout ${targetBranch}`);
    }
  }
}

async function ensureLatestCommit() {
  const s = spinner();
  s.start("Checking for updates...");
  shell.exec("git fetch", { silent: true });

  const local = shell.exec("git rev-parse @", { silent: true }).stdout.trim();
  const remote = shell
    .exec("git rev-parse @{u}", { silent: true })
    .stdout.trim();

  if (local !== remote) {
    s.stop("Updates found");
    const pull = await confirm({
      message: "Local branch is behind remote. Pull changes?",
    });
    if (pull) shell.exec("git pull");
  } else {
    s.stop("Branch is up to date");
  }
}

async function createNewTag() {
  const newTag = await text({
    message: "New Tag",
    initialValue: tagName,
  });
  const s = spinner();
  s.start("Checking...");
  const tagExists = await fetchTagExists(newTag);
  s.stop("Checking...");
  if (tagExists) {
    log.warning("This tag already exists.");
    return await createNewTag();
  }
  outro(`Creating and Pushing Tag...`);
  shell.exec(`git tag ${newTag}`);
  shell.exec(`git push origin ${newTag}`);
}

async function latestTagName() {
  const getLatestReleaseUrlEntpoint = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

  const res = await fetch(getLatestReleaseUrlEntpoint).then((res) =>
    res.json()
  );
  return res.tag_name;
}

async function fetchTagExists(tagName) {
  const getTagEndpoint = `https://api.github.com/repos/${owner}/${repo}/git/refs/tags/${tagName}`;

  const res = await fetch(getTagEndpoint);
  return res.status === 200;
}
