const core = require('@actions/core')
    , github = require('@actions/github')
    , YAML = require('yaml')
    ;

const CONTEXT = github.context;

// A singleton Octokit for using to access the GitHub API
let octokit = null;


async function run() {
    const issueId = getRequiredInputValue('issue_id');

    try {
        const issueBody = await getIssueBody(issueId)
            , result = parseBody(issueBody)
            ;

        if (result !== null) {
            core.setOutput('payload', result);
        } else {
            core.setFailed(`There was no valid payload found in the issue: ${issueId}.`);
        }
    } catch(err) {
        core.setFailed(err);
    }
}

run();




function getBodyPayloadRegex(payload) {
    const marker = core.getInput('payload_marker');
    core.debug(`Payload Marker: '${marker}'`)

    let header = payload;
    if (marker && marker.length > 0) {
        header = `${payload}.*${marker}`;
    }

    const regexString = `\`\`\`${header}([^]*)\`\`\``;
    core.debug(`Regular Expression match is set to '${regexString}'`);

    return new RegExp(regexString, 'igm');
}


function parseBody(content) {
    const payload = getRequiredInputValue('payload').toLowerCase();
    core.debug(`Payload type: '${payload}'`);

    const matched = getBodyPayloadRegex(payload).exec(content);
    if (!matched) {
        core.error(`Failed to find parsable payload data in issue body: '${JSON.stringify(content)}'`);
        return null;
    }

    try {
        const result = parseExtractedData(payload, matched[1]);
        core.debug(`Matched and parsed data: '${JSON.stringify(result)}'`);
        return result;
    } catch (err) {
        core.error(err);
        throw new Error(`Failed to parse data payload as ${payload}: '${data}'`);
    }
}


function getRequiredInputValue(key) {
    return core.getInput(key, {required: true});
}


function parseExtractedData(payloadType, stringData) {
    if (payloadType === 'json') {
        // Will throw an error on parsing if content is not valid
        return JSON.parse(stringData);
    } else if (payloadType === 'yaml' || payloadType === 'yml' ) {
        // Will throw an error on parsing if content is not valid
        return YAML.parse(stringData);
    } else {
        throw new Error(`Unsupported Payload type: ${payloadType}.`);
    }
}


function getOctokit() {
    if (octokit == null) {
        const token = getRequiredInputValue('github_token');

        if (!token) {
            core.error('Failed to provide a GitHub token for accessing the REST API.');
        }
    
        octokit = new github.GitHub(token);
    }
    return octokit;
}


function getIssueBody(id) {
    const octokit = getOctokit();

    return octokit.issues.get({
        ...CONTEXT.repo,
        issue_number: id
    }).then(result => {
        if (result.status !== 200) {
            throw new Error(`Unexpected status code from retrieving issue: ${result.status}`);
        }
        return result.data.body;
    }).catch(err => {
        core.error(err);
        // core.setFailed(`Failed to load issue: ${id}`);
        throw err;
    });
}