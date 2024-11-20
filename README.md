# issue-body-parser-action

This is a Github Action that can parse the contents of an Issue body for encoded JSON or YAML that can be used to pass information to other GitHub Action Steps.
Think of this as just another way to provide the configuration data to a GitHub Actions workflow via "Issue Ops".

The usecase that resulted in this Action being created was to be used off the back of an Issue template where users are prompted to provide some metadata to a workflow 
that will be triggered off the Issue. I was looking for a more structured way, rather than providing a lot of regexes and using bash scripting, which are alternative ways
to doing this.


## Usage

For details on all parameters see [action.yml](action.yml).

## Examples
### JSON Payload
In this example the Issue that we are to parse is expected to contain a `json` code block somewhere inside the body. It will be the contents of this that is parsed and exposed by the action.

Example Issue Body Content:
```
    Some plain text data in the Issue body goes here and then we encode the payload 
    data in a block like shown below.
    
    ```json
    {
        "id": 1
    }
    ```
```

The configuration of the Action in a workflow:

```yaml
name: Parse Issue Body
uses: peter-murray/issue-body-parser-action@v3
id: issue_body_parser
with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    # This is assuming that you are triggering off the issue, otherwise you will need to know the issue number
    issue_id: ${{ github.event.issue.number }}
```


### JSON Payload with a marker
In this example the Issue body to parse may contain multiple JSON sections, so we use a `payload marker` to identify the target JSON block to parse. In this example, we will use the `target_payload` marker on the JSON block. 

Example Issue Body Content:

```
    Some plain text data in the Issue body goes here and then we encode the payload 
    data in a block like shown below.
    
    ```json target_payload
    {
        "id": 1,
        "name": "Some target data"
    }
    ```
```

The configuration of the Action in a workflow:

```yaml
name: Parse Issue Body
uses: peter-murray/issue-body-parser-action@v3
id: issue_body_parser
with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    # This is assuming that you are triggering off the issue, otherwise you will need to know the issue number
    issue_id: ${{ github.event.issue.number }}
    payload_marker: target_payload
```


### YAML Payload
In this example the Issue body to parse will contain a YAML section, so we need to set the `payload` to `yaml` so that we use the correct parser.

Example Issue Body Content:
```
    A YAML payload will follow.

    ```yaml
    name: Hello World
    id: 100
    description: A simple hello world example
    tags:
      - good first issue
      - needs triage
      - bug
    ```
```



The configuration of the Action in a workflow:

```yaml
name: Parse Issue Body
uses: peter-murray/issue-body-parser-action@v3
id: issue_body_parser
with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    # This is assuming that you are triggering off the issue, otherwise you will need to know the issue number
    issue_id: ${{ github.event.issue.number }}
    payload: yaml
```


### Fail on missing payload
By default the action will fail if the payload is not found in the issue. This behavior can be changed by setting the `fail_on_missing` option to `false`.

```yaml
name: Parse Issue Body
uses: peter-murray/issue-body-parser-action@v3
id: issue_body_parser
with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    issue_id: ${{ github.event.issue.number }}
    fail_on_missing: false
```

In this case, when the payload is not found in the issue, the payload value will be set to `NOT_FOUND`. You may want to skip other actions in your workflow if this is the case by using an `if` conditional as follows:
```yaml
name: Run something that uses the payload
    if : steps.issue_body_parser_request.outputs.payload != 'NOT_FOUND'
    id: run_something
    env:
        VERSION: ${{ fromJson(steps.issue_body_parser_request.outputs.payload).version }}
    run: |
    echo $VERSION
