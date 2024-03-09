#!/usr/bin/env node
import { Command } from "commander";

const twitcit0 = new Command();

const endpointUrl = `https://api.twitter.com/2/tweets`;

twitcit0
	.argument('<string>', 'string to split')
	.action(async (tweet: string) => {
		const data = {
			"text": tweet,
		}


	})

twitcit0.parse(process.argv)

