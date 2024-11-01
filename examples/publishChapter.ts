/*
 * Publish a chapter, reading it from disk.
 */

import { RoyalRoadAPI } from '../src/lib';
import { readFileSync } from 'fs';

// To be replaced with the fiction ID you want to post a chapter to.
const fiction = 0;

// To be replaced with the credentials of the user to check state for.
const username = '';
const password = '';

const api = new RoyalRoadAPI();

await api.user.login(username, password);
console.log('Logged in.');

// Read the chapter from disk. Note that the content will be submitted directly,
// and is expected to follow RRLs formatting.
const content = readFileSync('chapter.html', 'utf8');
const chapter = {
    content,
    title: 'My Chapter Title',
    preNote: 'This chapter was published using the royalroadl-api.',
};

await api.chapter.publish(fiction, chapter);
console.log('Chapter published successfully.');
