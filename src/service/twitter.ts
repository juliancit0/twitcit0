import got from "got";
import crypto, { Verify } from "crypto";
import qs from "querystring";
import OAuth, { Data } from "oauth-1.0a";


const readline = require('readline').createInterface({
	input: process.stdin,
	output: process.stdout
});


// The code below sets the consumer key and consumer secret from your environment variables
// To set environment variables on macOS or Linux, run the export commands below from the terminal:
// export CONSUMER_KEY='YOUR-KEY'
// export CONSUMER_SECRET='YOUR-SECRET'
const consumer_key = process.env.CONSUMER_KEY;
const consumer_secret = process.env.CONSUMER_SECRET;

const endpointURL = `https://api.twitter.com/2/tweets`;

// this example uses PIN-based OAuth to authorize the user
const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=oob&x_auth_access_type=write';
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const oauth = new OAuth({
	consumer: {
		key: consumer_key as string,
		secret: consumer_secret as string
	},
	signature_method: 'HMAC-SHA1',
	hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

async function input(prompt: string) {
	return new Promise(async (resolve, reject) => {
		readline.question(prompt, (out: any) => {
			readline.close();
			resolve(out);
		});
	});
}

async function requestToken() {
	const authHeader = oauth.toHeader(oauth.authorize({
		url: requestTokenURL,
		method: 'POST'
	}));

	const req = await got.post(requestTokenURL, {
		headers: {
			Authorization: authHeader["Authorization"]
		}
	});
	if (req.body) {
		return qs.parse(req.body);
	} else {
		throw new Error('Cannot get an OAuth request token');
	}
}


async function accessToken({
	oauth_token,
}: Partial<Data>, verifier: Verify) {
	const authHeader = oauth.toHeader(oauth.authorize({
		url: accessTokenURL,
		method: 'POST'
	}));
	const path = `https://api.twitter.com/oauth/access_token?oauth_verifier=${verifier}&oauth_token=${oauth_token}`
	const req = await got.post(path, {
		headers: {
			Authorization: authHeader["Authorization"]
		}
	});
	if (req.body) {
		return qs.parse(req.body);
	} else {
		throw new Error('Cannot get an OAuth request token');
	}
}

interface IRequest {
	oauth_token: string,
	oauth_token_secret: string
}

async function getRequest({
	oauth_token,
	oauth_token_secret
}: IRequest, text: string) {

	const token = {
		key: oauth_token,
		secret: oauth_token_secret
	};

	const authHeader = oauth.toHeader(oauth.authorize({
		url: endpointURL,
		method: 'POST'
	}, token));

	const data = { text }

	const req = await got.post(endpointURL, {
		json: data,
		responseType: 'json',
		headers: {
			Authorization: authHeader["Authorization"],
			'user-agent': "v2CreateTweetJS",
			'content-type': "application/json",
			'accept': "application/json"
		}
	});
	if (req.body) {
		return req.body;
	} else {
		throw new Error('Unsuccessful request');
	}
}


const tweet = async (text: string) => {
	try {
		// Get request token
		const oAuthRequestToken = await requestToken();
		// Get authorization
		authorizeURL.searchParams.append('oauth_token', oAuthRequestToken.oauth_token as string);
		console.log('Please go here and authorize:', authorizeURL.href);
		const pin: any = await input('Paste the PIN here: ');
		// Get the access token
		const oAuthAccessToken: IRequest = await accessToken(oAuthRequestToken, pin.trim());
		// Make the request
		const response = await getRequest(oAuthAccessToken, text);
		console.dir(response, {
			depth: null
		});
	} catch (e) {
		console.log(e);
		process.exit(-1);
	}
	process.exit();
};

export default tweet;
