
# CI/CD — GitHub Actions and AWS EC2

Note: this references Node 22, make sure you change it to the version of Node you're using.

## Overview

Continuous Integration and Continuous Deployment (CI/CD) allow us to automate the process of testing, validating, and deploying our applications.

Instead of manually connecting to our production server, pulling changes, installing dependencies, building the client, and restarting the server, we can configure GitHub Actions to perform these operations for us.

### Continuous Integration (CI)

Continuous Integration is the practice of frequently integrating code changes into a shared repository while automatically validating those changes.

Common CI responsibilities:

- Running automated tests
- Running linters
- Checking TypeScript compilation
- Building the application
- Detecting integration issues
- Preventing unvalidated code from being merged

### Continuous Delivery

Continuous Delivery ensures that code is automatically validated and prepared for deployment. The actual deployment may still require manual approval.

### Continuous Deployment (CD)

Continuous Deployment automatically deploys validated code to an environment without requiring manual intervention.

In our implementation, merging a Pull Request into `main` will trigger a production deployment.

## Application Workflow

```text
Local Development
        |
        v
Commit and Push Feature Branch
        |
        v
Open Pull Request
        |
        v
Continuous Integration
  - Install dependencies
  - Run server tests
  - Run client tests
  - Build client
        |
        v
Merge Pull Request into main
        |
        v
Continuous Deployment
  - Validate merged commit
  - Connect to EC2 via SSH
  - Retrieve validated commit
  - Install dependencies
  - Build client
  - Restart Express server
  - Verify application health
        |
        v
Updated Production Application
```

## Prerequisites

This reference assumes that we already have:

- A full-stack PERN application
- A GitHub repository
- Automated server and client tests
- An AWS EC2 instance running Ubuntu
- Node.js and npm installed on EC2
- PostgreSQL configured
- Nginx configured as a web server and reverse proxy
- PM2 managing our Express server
- An application accessible through a public IP or domain

The following examples use:

| Configuration | Value |
| --- | --- |
| Application directory | `/var/www/economist` |
| Production branch | `main` |
| EC2 user | `ubuntu` |
| Express port | `4000` |
| PM2 process name | `economist` |
| Node.js version | `22` |
| React build directory | `client/dist` |

Adjust these values to match your application and production environment.

---

# 1. GitHub Actions

GitHub Actions is an automation platform integrated into GitHub.

It allows us to execute commands in response to events occurring within our repository.

Examples of events:

- Opening a Pull Request
- Updating a Pull Request
- Pushing to a branch
- Creating a release
- Manually triggering a workflow
- Running a scheduled task

## GitHub Actions Terminology

| Term | Description |
| --- | --- |
| Workflow | An automated process defined in a YAML file |
| Event | An occurrence that triggers a workflow |
| Job | A collection of steps executed on a runner |
| Step | An individual command or action |
| Action | A reusable automation component |
| Runner | A machine responsible for executing a job |
| Secret | A securely stored value accessible to a workflow |
| Artifact | A file or collection of files produced by a workflow |

## GitHub-hosted Runners

GitHub provides temporary machines that execute our workflows.

When a workflow runs, GitHub provisions a runner, executes the specified commands, and disposes of the runner when the job completes.

Our GitHub runner and AWS EC2 instance are two separate machines.

Installing Node.js on a GitHub runner does not install Node.js on EC2.

Files created on a runner do not automatically appear on EC2.

---

# 2. Project Structure

Our project will contain two workflow files and one deployment script.

```text
economist/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── cd.yml
├── client/
│   ├── src/
│   ├── package.json
│   └── package-lock.json
├── server/
│   ├── package.json
│   └── package-lock.json
├── scripts/
│   └── deploy.sh
├── .gitignore
└── README.md
```

GitHub automatically discovers workflow files located inside:

```text
.github/workflows/
```

Workflow files use the `.yml` or `.yaml` extension.

YAML uses indentation to represent relationships between properties. Incorrect indentation can invalidate a workflow.

---

# 3. Continuous Integration

## 3.1 Verify Local Tests

Before creating a pipeline, verify that the tests work locally.

Server:

```bash
cd server
npm test
```

Client:

```bash
cd ../client
npm test
```

Verify that the client can also be built:

```bash
npm run build
```

Test commands must terminate automatically. A test runner operating in watch mode may cause the workflow to remain running indefinitely.

Example Jest configuration in `package.json`:

```json
{
    "scripts": {
        "test": "jest"
    }
}
```

Example Vitest configuration:

```json
{
    "scripts": {
        "test": "vitest run"
    }
}
```

If tests require a database, configure an isolated test database for CI. Never execute automated tests against the production database.

## 3.2 Create the Workflow

From the project root:

```bash
git checkout -b setup-ci

mkdir -p .github/workflows

touch .github/workflows/ci.yml
```

Add the following to `ci.yml`:

```yaml
name: Continuous Integration

on:
  pull_request:
    branches:
      - main

permissions:
  contents: read

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install server dependencies
        working-directory: server
        run: npm ci

      - name: Run server tests
        working-directory: server
        run: npm test

      - name: Install client dependencies
        working-directory: client
        run: npm ci

      - name: Run client tests
        working-directory: client
        run: npm test

      - name: Build client application
        working-directory: client
        run: npm run build
```

## 3.3 Workflow Configuration

### name

```yaml
name: Continuous Integration
```

Defines the name displayed in the GitHub Actions interface.

### on

```yaml
on:
  pull_request:
    branches:
      - main
```

Defines the event responsible for triggering the workflow.

In this case, the workflow runs when a Pull Request targeting `main` is opened, reopened, or updated.

The branch specified here is the destination branch of the Pull Request.

### permissions

```yaml
permissions:
  contents: read
```

Limits the workflow's GitHub token permissions to reading repository contents.

Our workflow does not need permission to modify repository contents.

### jobs

```yaml
jobs:
  test:
```

Defines the jobs belonging to the workflow.

`test` is the identifier of our job.

A workflow can contain multiple jobs. Jobs generally execute independently unless dependencies are explicitly configured.

### runs-on

```yaml
runs-on: ubuntu-latest
```

Specifies the operating system of the GitHub-hosted runner.

GitHub provisions a temporary Ubuntu machine to execute the job.

### steps

```yaml
steps:
```

Defines the individual operations executed within a job.

Steps execute sequentially. By default, if a step fails, subsequent ordinary steps are skipped.

### uses

```yaml
uses: actions/checkout@v4
```

Executes an existing GitHub Action.

`actions/checkout` retrieves the repository contents and makes them available on the runner.

Without this step, our application source code would not be available.

The `@v4` portion specifies the version of the action.

### with

```yaml
uses: actions/setup-node@v4
with:
  node-version: 22
```

Provides configuration to an action.

In this case, we are requesting Node.js version 22.

Use a Node.js version compatible with the application and consistent with the production environment.

### working-directory

```yaml
working-directory: server
```

Specifies the directory in which a command executes.

This is equivalent to navigating into the directory before executing the command.

### run

```yaml
run: npm test
```

Executes a shell command on the runner.

Multiple commands can be executed using the YAML pipe character:

```yaml
run: |
  npm ci
  npm test
  npm run build
```

### npm ci

```bash
npm ci
```

Installs dependencies using the existing `package-lock.json`.

Unlike `npm install`, `npm ci`:

- Requires a lock file
- Removes an existing `node_modules` directory
- Installs the locked dependency versions
- Fails if `package.json` and the lock file are inconsistent
- Does not update the lock file

This makes dependency installation more predictable in automated environments.

Both the client and server lock files must be committed to the repository.

### npm run build

```bash
npm run build
```

Creates a production build of the client application.

For Vite applications, the output is typically stored in:

```text
client/dist/
```

Building the application during CI helps detect compilation errors, invalid imports, and other build-related issues before deployment.

---

# 4. Testing the CI Workflow

Commit and push the workflow:

```bash
git add .
git commit -m "Configure continuous integration"
git push -u origin setup-ci
```

On GitHub:

1. Navigate to the repository.
2. Open a Pull Request targeting `main`.
3. Navigate to the Actions tab.
4. Select the running workflow.
5. Select the `test` job.
6. Inspect the output of individual steps.

GitHub reports the status of each job and workflow.

| Status | Description |
| --- | --- |
| Pending | Waiting to execute |
| In progress | Currently executing |
| Success | Completed successfully |
| Failure | One or more required operations failed |
| Skipped | Did not execute |

## Exit Codes

Shell commands communicate their execution status using exit codes.

| Exit Code | Description |
| --- | --- |
| `0` | Successful execution |
| Nonzero | Unsuccessful execution |
| `127` | Command not found |
| `255` | Common SSH connection or authentication failure |

GitHub Actions uses command exit codes to determine whether a step succeeded or failed.

---

# 5. Branch Protection

Creating a CI workflow does not automatically prevent developers from merging failing code.

We must configure branch protection.

Navigate to:

```text
Repository
  Settings
    Branches
      Add branch protection rule
```

Depending on the repository configuration, equivalent settings may be available under Rulesets.

Configure the following:

- Branch name pattern: `main`
- Require a Pull Request before merging
- Require status checks to pass before merging
- Select the `test` status check
- Require branches to be up to date before merging
- Prevent bypassing the rules where appropriate

The status check may not appear until the workflow has executed at least once.

Branch protection availability depends on repository visibility and the GitHub plan.

Once configured, developers must satisfy the required checks before merging code into `main`.

Merge the initial CI Pull Request before continuing.

---

# 6. Continuous Deployment

Our existing deployment process requires us to manually connect to EC2 and execute commands similar to:

```bash
ssh ubuntu@YOUR_EC2_IP

cd /var/www/economist

git pull origin main

cd server
npm ci

cd ../client
npm ci
npm run build

pm2 restart economist
```

Continuous Deployment allows us to automate this process.

GitHub Actions will establish an SSH connection to EC2 and execute a deployment script remotely.

---

# 7. SSH Authentication

SSH (Secure Shell) is a protocol used to securely communicate with remote machines.

When we originally configured EC2, we used an AWS-generated private key to authenticate with the instance.

For automated deployments, we will create a separate SSH key specifically for GitHub Actions.

This allows us to revoke GitHub's access without affecting our personal SSH credentials.

## 7.1 Generate a Deployment Key

On your local computer:

```bash
ssh-keygen -t ed25519 \
  -C "github-actions-deploy" \
  -f ~/.ssh/github-actions-deploy
```

When prompted for a passphrase, leave it empty for this implementation.

An automated workflow cannot interactively enter a passphrase.

### Command Breakdown

| Argument | Description |
| --- | --- |
| `ssh-keygen` | Generates SSH key pairs |
| `-t ed25519` | Specifies the key algorithm |
| `-C` | Adds an identifying comment |
| `-f` | Specifies the output file location |

Two files will be generated:

```text
~/.ssh/github-actions-deploy
~/.ssh/github-actions-deploy.pub
```

The file without an extension is the private key.

The `.pub` file is the public key.

The private key must remain confidential. The public key can be distributed to machines that need to authenticate the private key holder.

Never commit a private key to a Git repository.

## 7.2 Authorize the Deployment Key on EC2

On your local computer, retrieve the public key:

```bash
cat ~/.ssh/github-actions-deploy.pub
```

Copy the entire output.

Connect to EC2 using your existing AWS SSH key:

```bash
ssh -i ~/.ssh/YOUR_AWS_KEY.pem ubuntu@YOUR_EC2_IP
```

On EC2, open:

```bash
nano ~/.ssh/authorized_keys
```

Append the deployment public key on a new line.

Do not remove the existing AWS public key.

Save the file:

```text
CTRL + O
Enter
CTRL + X
```

Verify the directory and file permissions:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### authorized_keys

The `authorized_keys` file contains public keys permitted to authenticate as the current Linux user.

By adding our deployment public key to this file, we are authorizing GitHub Actions to authenticate as that user.

For this exercise, we are using the existing `ubuntu` account. Production environments should generally use a dedicated deployment account with limited permissions.

### File Permissions

Linux file permissions determine who can read, write, and execute files.

| Permission | Description |
| --- | --- |
| `700` | Owner can read, write, and execute |
| `600` | Owner can read and write |
| `644` | Owner can read and write; others can read |

SSH may reject keys or configuration files with excessively permissive permissions.

## 7.3 Test Deployment Authentication

Exit the EC2 session:

```bash
exit
```

From your local computer:

```bash
ssh -i ~/.ssh/github-actions-deploy \
  -o IdentitiesOnly=yes \
  ubuntu@YOUR_EC2_IP
```

`IdentitiesOnly=yes` instructs SSH to use the explicitly specified identity rather than trying other identities from an SSH agent.

If authentication succeeds, the deployment key is configured correctly.

Do not continue until this connection works.

---

# 8. AWS Security Groups

GitHub Actions must be able to establish an SSH connection to our EC2 instance.

Navigate to:

```text
AWS Console
  EC2
    Instances
      Select instance
        Security
          Security groups
            Edit inbound rules
```

Our application typically requires the following inbound rules:

| Type | Port | Source |
| --- | --- | --- |
| SSH | 22 | Authorized deployment sources |
| HTTP | 80 | Anywhere IPv4 |
| HTTPS | 443 | Anywhere IPv4 |

GitHub-hosted runners use changing IP addresses.

If SSH access is restricted to your personal IP address, GitHub Actions may be unable to connect.

For a temporary classroom demonstration, SSH can be made accessible using:

```text
0.0.0.0/0
```

This permits SSH connections from any IPv4 address.

Only use this temporary configuration when password authentication and root SSH login are disabled and key-based authentication is enforced.

Remove the temporary rule after the exercise. Subsequent deployments will require an appropriate network access solution.

Production alternatives include:

- AWS Systems Manager
- Deployment runners with static outbound IP addresses
- Private network deployment runners
- Restricted network access

PostgreSQL port `5432` and Express port `4000` do not need to be publicly accessible for this architecture.

Nginx handles incoming public application traffic.

## Public IP Addresses

An automatically assigned EC2 public IPv4 address may change when an instance is stopped and started.

This can affect:

- DNS records
- SSH connections
- GitHub Actions configuration
- SSH known hosts entries

An Elastic IP provides a persistent public IPv4 address, although AWS public IPv4 charges may apply.

Alternatively, use a domain name and maintain its DNS record.

---

# 9. SSH Host Verification

SSH authentication works in both directions.

EC2 needs to verify the identity of the connecting client.

The connecting client also needs to verify the identity of EC2.

```text
GitHub Actions
    |
    | Private deployment key
    v
EC2 authorized_keys

EC2
    |
    | Public server host key
    v
GitHub Actions known_hosts
```

These are two different key pairs.

| File | Purpose |
| --- | --- |
| `authorized_keys` | Determines which clients may authenticate |
| `known_hosts` | Determines which remote servers are trusted |
| `github-actions-deploy` | Client's private authentication key |
| `github-actions-deploy.pub` | Client's public authentication key |
| `ssh_host_ed25519_key.pub` | Server's public identity key |

## 9.1 Retrieve the EC2 Host Key

On EC2:

```bash
cat /etc/ssh/ssh_host_ed25519_key.pub
```

Example output:

```text
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... root@ip-172-31-...
```

This is the public identity key of our SSH server.

It is not the deployment public key generated earlier.

Retrieve its fingerprint:

```bash
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

A fingerprint is a shorter representation of a cryptographic key that allows us to compare keys.

## 9.2 Retrieve the Host Key Remotely

On your local computer:

```bash
ssh-keyscan -t ed25519 YOUR_EC2_IP
```

Example output:

```text
# YOUR_EC2_IP:22 SSH-2.0-OpenSSH
YOUR_EC2_IP ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...
```

Compare the public key with the one retrieved directly from EC2.

The key contents should match.

Alternatively, compare fingerprints:

```bash
ssh-keyscan -t ed25519 YOUR_EC2_IP \
  2>/dev/null | ssh-keygen -lf -
```

If the fingerprints do not match, verify the IP address, DNS configuration, and identity of the EC2 instance before proceeding.

Do not blindly trust a key retrieved using `ssh-keyscan`.

## 9.3 Construct the known_hosts Entry

The required format is:

```text
HOSTNAME ALGORITHM PUBLIC_KEY
```

Example:

```text
YOUR_EC2_IP ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...
```

We can also construct this entry manually using the verified public host key retrieved directly from EC2.

Remove the trailing server comment and prepend the IP address or hostname.

If connecting through a domain name, the entry must contain that domain name instead of the IP address.

The hostname must match the hostname used by the SSH connection.

---

# 10. GitHub Actions Secrets

Secrets allow us to securely provide sensitive configuration values to GitHub Actions.

Navigate to:

```text
Repository
  Settings
    Secrets and variables
      Actions
        New repository secret
```

Create the following repository secrets:

| Secret | Value |
| --- | --- |
| `EC2_HOST` | EC2 public IP address or domain |
| `EC2_USER` | Linux username, typically `ubuntu` |
| `EC2_SSH_KEY` | Private deployment key |
| `EC2_KNOWN_HOSTS` | Verified SSH host key entry |

## EC2_HOST

The IP address or domain name of the EC2 instance.

Example:

```text
myapp.example.com
```

Do not include:

- `https://`
- A trailing slash
- An application route

SSH requires a hostname or IP address, not a web URL.

## EC2_USER

The Linux user used to establish the SSH connection.

```text
ubuntu
```

## EC2_SSH_KEY

Retrieve the private deployment key from your local computer:

```bash
cat ~/.ssh/github-actions-deploy
```

The contents should have the following structure:

```text
-----BEGIN OPENSSH PRIVATE KEY-----
PRIVATE KEY CONTENTS
-----END OPENSSH PRIVATE KEY-----
```

Copy the entire file, including the beginning and ending lines.

Preserve all line breaks.

On macOS, the file can be copied directly to the clipboard:

```bash
pbcopy < ~/.ssh/github-actions-deploy
```

Paste the contents into the GitHub secret.

Do not use the `.pub` file.

## EC2_KNOWN_HOSTS

Use the verified host key entry from the previous section:

```text
YOUR_EC2_IP ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA...
```

Do not include the SSH banner or fingerprint.

The hostname must match the value stored in `EC2_HOST`.

Although the hostname and public host key are not confidential, we are storing them alongside our other deployment configuration for convenience.

## Accessing Secrets

GitHub Actions exposes secrets through the `secrets` context:

```yaml
${{ secrets.EC2_HOST }}
```

We can assign a secret to an environment variable:

```yaml
env:
  EC2_HOST: ${{ secrets.EC2_HOST }}
```

The shell can then access the environment variable:

```bash
$EC2_HOST
```

GitHub generally masks secret values in workflow logs. However, secrets should never be intentionally printed.

---

# 11. Preparing the Production Environment

Connect to EC2.

Verify the installed software:

```bash
node -v
npm -v
git --version
pm2 -v
```

Identify the installation paths:

```bash
which node
which npm
which pm2
```

Verify the application directory:

```bash
cd /var/www/economist

pwd
git status
git remote -v
```

Verify that the production repository can retrieve changes:

```bash
git fetch origin main
```

This command must work without interactive authentication.

## Private Repositories

There are two separate connections involved in our deployment.

```text
GitHub Actions -- SSH --> EC2

EC2 -- Git fetch --> GitHub Repository
```

The deployment SSH key allows GitHub Actions to connect to EC2.

It does not automatically allow EC2 to retrieve a private GitHub repository.

If the repository is private, configure separate repository authentication on EC2, preferably using a read-only GitHub deploy key.

## Verify PM2

```bash
pm2 list
```

Identify the name of the existing Express process.

Example:

```text
economist
```

Test that the process can be restarted:

```bash
pm2 restart economist
```

The deployment script will use this process name.

PM2 processes belong to the user that started them. Make sure the deployment user is the same user managing the existing application process.

---

# 12. Application Health Check

A health check is an endpoint used to verify whether an application is operational.

Add the following route to the Express application:

```js
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "healthy"
    })
})
```

Register this route before any catch-all 404 or error-handling middleware.

The endpoint should not require authentication.

Once this change is deployed, it can be tested locally on EC2:

```bash
curl http://127.0.0.1:4000/api/health
```

Expected response:

```json
{
    "status": "healthy"
}
```

The deployment script will use this endpoint to verify that Express is responding after being restarted.

This basic health check does not verify database connectivity or the functionality of every application feature.

---

# 13. Deployment Script

A shell script allows us to group terminal commands into a reusable executable file.

On your local computer, create a feature branch from the updated `main` branch:

```bash
git checkout main
git pull origin main

git checkout -b setup-cd
```

From the project root:

```bash
mkdir -p scripts

touch scripts/deploy.sh
```

Add the following:

```bash
#!/usr/bin/env bash

# Load Node.js when installed through NVM
export NVM_DIR="$HOME/.nvm"

if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh" || exit 1
    nvm use 22 || exit 1
fi

set -euo pipefail

APP_DIR="/var/www/economist"
PM2_PROCESS="economist"

echo "Starting deployment..."

cd "$APP_DIR"

echo "Node.js version:"
node -v

echo "npm version:"
npm -v

echo "Installing server dependencies..."

cd server
npm ci

echo "Installing client dependencies..."

cd ../client
npm ci

echo "Building client application..."

npm run build

echo "Restarting Express server..."

cd ../server
pm2 restart "$PM2_PROCESS" --update-env

echo "Checking application health..."

curl --fail --silent --show-error \
    --retry 5 \
    --retry-connrefused \
    --retry-delay 2 \
    --max-time 10 \
    http://127.0.0.1:4000/api/health

echo
echo "Deployment completed successfully!"
```

Adjust the application directory, Node.js version, PM2 process name, and health check URL to match your environment.

## 13.1 Shebang

```bash
#!/usr/bin/env bash
```

Specifies that the script should be interpreted using Bash.

## 13.2 NVM Initialization

```bash
export NVM_DIR="$HOME/.nvm"
```

Defines the directory where Node Version Manager is installed.

`$HOME` represents the current user's home directory.

For the Ubuntu user, this typically resolves to:

```text
/home/ubuntu/.nvm
```

The `export` command makes a variable available to child processes.

```bash
if [ -s "$NVM_DIR/nvm.sh" ]; then
```

Checks whether the NVM initialization file exists and is not empty.

```bash
source "$NVM_DIR/nvm.sh"
```

Executes the contents of the initialization script within the current shell.

This makes the `nvm` command available.

```bash
nvm use 22
```

Selects Node.js version 22.

The specified version must already be installed on EC2.

To inspect installed versions:

```bash
nvm ls
```

To install the required version if necessary:

```bash
nvm install 22
```

### Why is NVM initialization necessary?

When we manually connect to EC2, our interactive shell typically loads configuration from `.bashrc`.

This configuration initializes NVM and makes Node.js, npm, and globally installed packages available through the `PATH` environment variable.

GitHub Actions executes commands through a non-interactive SSH session.

Non-interactive shells do not necessarily load the same configuration.

Consequently, commands such as the following may be unavailable:

```bash
node
npm
pm2
```

Explicitly initializing NVM ensures that these commands are available to the deployment script.

NVM also maintains separate globally installed packages for different Node.js versions. Make sure PM2 is installed for the selected version.

## 13.3 Error Handling

```bash
set -euo pipefail
```

Configures stricter Bash error handling.

| Option | Description |
| --- | --- |
| `-e` | Exit when a command fails in most ordinary cases |
| `-u` | Treat undefined variables as errors |
| `-o pipefail` | Detect failures within piped commands |

Without error handling, the script could continue after an unsuccessful installation or build and incorrectly report a successful deployment.

NVM is initialized before enabling these options to avoid potential compatibility issues with its initialization script.

The `|| exit 1` expressions ensure that failed NVM initialization still stops deployment.

## 13.4 Shell Variables

```bash
APP_DIR="/var/www/economist"
PM2_PROCESS="economist"
```

Defines reusable shell variables.

Variables can be referenced using:

```bash
$APP_DIR
$PM2_PROCESS
```

Double quotes prevent unexpected word splitting when a variable contains spaces.

```bash
cd "$APP_DIR"
```

## 13.5 Installing Dependencies

```bash
npm ci
```

Installs the dependencies associated with the deployed commit.

We install dependencies separately for the server and client because each has its own `package.json` and lock file.

The client requires development dependencies such as Vite to produce its production build.

## 13.6 Building the Client

```bash
npm run build
```

Generates the production React application.

Nginx serves the generated files from the configured document root.

If the application uses Vite, this is typically:

```text
/var/www/economist/client/dist
```

## 13.7 Restarting the Server

```bash
pm2 restart "$PM2_PROCESS" --update-env
```

Restarts the existing Express process.

This allows Express to load the updated source code.

`--update-env` updates environment variables supplied to PM2 from the current execution environment.

If Express loads a `.env` file through `dotenv`, it will read that file again when the process restarts.

If the server uses TypeScript and runs compiled JavaScript, add the appropriate server build command before restarting PM2.

## 13.8 Verifying Application Health

```bash
curl --fail --silent --show-error \
    --retry 5 \
    --retry-connrefused \
    --retry-delay 2 \
    --max-time 10 \
    http://127.0.0.1:4000/api/health
```

`curl` allows us to make HTTP requests from the terminal.

| Argument | Description |
| --- | --- |
| `--fail` | Returns a failure exit code for HTTP errors |
| `--silent` | Suppresses the progress meter |
| `--show-error` | Displays errors even in silent mode |
| `--retry 5` | Retries eligible transient failures up to five times |
| `--retry-connrefused` | Retries refused connections |
| `--retry-delay 2` | Waits two seconds between retries |
| `--max-time 10` | Limits the duration of an individual transfer |

Retries allow Express some time to initialize after being restarted.

If the health check ultimately fails, the deployment script returns a nonzero exit code.

GitHub Actions will mark the deployment as unsuccessful.

---

# 14. Nginx Configuration

Our existing Nginx configuration should be similar to the following:

```nginx
server {
    server_name YOUR_DOMAIN;

    root /var/www/economist/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:4000;
    }
}
```

This is an abbreviated configuration for reference.

Do not replace your existing HTTPS or certificate configuration with this example.

```text
Browser
    |
    v
Nginx (80 / 443)
    |
    |--- / ------> React static files
    |
    |--- /api/ --> Express (4000)
                       |
                       v
                   PostgreSQL
```

We do not need to restart Nginx every time the application is deployed.

Nginx continues serving files from the same directory and forwarding API requests to the same port.

Our deployment script replaces the client build and restarts Express.

If your Nginx document root points to a different directory, the deployment script must also publish the generated build to that directory.

Only reload Nginx when its configuration changes:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

# 15. Production Environment Variables

Production environment files should already exist on EC2.

Example:

```text
economist/
├── client/
│   ├── .env.production
│   └── dist/
└── server/
    └── .env
```

The deployment process does not need to recreate these files.

Make sure they are excluded from version control.

Example `.gitignore`:

```gitignore
node_modules/
dist/

.env
.env.*
!.env.example
```

Git normally preserves ignored, untracked environment files when checking out another commit.

However, an ignored file can still be overwritten if a checked-out commit tracks a file at the same path. Ensure production environment files are never tracked.

Adding a previously committed file to `.gitignore` does not remove it from Git history.

If credentials were previously committed, remove the tracked file and rotate the exposed credentials.

## Client API Configuration

For applications served through Nginx, we can use relative API paths in production.

```js
const API_URL = import.meta.env.PROD
    ? "/api"
    : "http://localhost:4000/api"
```

Vite sets `import.meta.env.PROD` when creating a standard production build.

Using relative paths allows the browser to send API requests to the same domain serving the React application.

Nginx then forwards those requests to Express.

Never store database credentials, JWT signing secrets, or private API keys in client environment variables.

Client-side configuration is accessible to the browser.

---

# 16. Continuous Deployment Workflow

Create the deployment workflow:

```bash
touch .github/workflows/cd.yml
```

Add the following:

```yaml
name: Continuous Deployment

on:
  push:
    branches:
      - main

permissions:
  contents: read

concurrency:
  group: production-deployment
  cancel-in-progress: false

jobs:
  validate:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install server dependencies
        working-directory: server
        run: npm ci

      - name: Run server tests
        working-directory: server
        run: npm test

      - name: Install client dependencies
        working-directory: client
        run: npm ci

      - name: Run client tests
        working-directory: client
        run: npm test

      - name: Build client application
        working-directory: client
        run: npm run build

  deploy:
    needs: validate
    runs-on: ubuntu-latest

    steps:
      - name: Configure SSH
        env:
          SSH_PRIVATE_KEY: ${{ secrets.EC2_SSH_KEY }}
          SSH_KNOWN_HOSTS: ${{ secrets.EC2_KNOWN_HOSTS }}
        run: |
          mkdir -p ~/.ssh
          chmod 700 ~/.ssh

          printf '%s\n' "$SSH_PRIVATE_KEY" \
            | tr -d '\r' > ~/.ssh/deploy_key

          chmod 600 ~/.ssh/deploy_key

          printf '%s\n' "$SSH_KNOWN_HOSTS" \
            | tr -d '\r' > ~/.ssh/known_hosts

          chmod 600 ~/.ssh/known_hosts

          ssh-keygen -y -P "" \
            -f ~/.ssh/deploy_key > /dev/null

      - name: Deploy application to EC2
        env:
          EC2_HOST: ${{ secrets.EC2_HOST }}
          EC2_USER: ${{ secrets.EC2_USER }}
          DEPLOY_SHA: ${{ github.sha }}
        run: |
          ssh -o BatchMode=yes \
            -o IdentitiesOnly=yes \
            -o StrictHostKeyChecking=yes \
            -o ConnectTimeout=15 \
            -i ~/.ssh/deploy_key \
            "$EC2_USER@$EC2_HOST" \
            "bash -s -- $DEPLOY_SHA" << 'EOF'

          set -euo pipefail

          cd /var/www/economist

          git fetch origin main

          git checkout --detach "$1"

          bash scripts/deploy.sh

          EOF
```

---

# 17. Understanding the CD Workflow

## 17.1 Deployment Trigger

```yaml
on:
  push:
    branches:
      - main
```

Our CI workflow executes when a Pull Request is opened or updated.

Our CD workflow executes when changes are pushed into `main`.

Merging a Pull Request updates the destination branch, triggering the deployment workflow.

## 17.2 Concurrency

```yaml
concurrency:
  group: production-deployment
  cancel-in-progress: false
```

Concurrency controls prevent multiple instances of the deployment workflow from running simultaneously.

Without this configuration, multiple developers merging changes could cause overlapping deployments.

Two deployments might attempt to:

- Install dependencies simultaneously
- Modify the same Git working directory
- Rebuild the same client directory
- Restart the same Express process

The concurrency group identifies workflows that should not overlap.

`cancel-in-progress: false` prevents a newer workflow from interrupting an active deployment.

GitHub may replace an older pending run with a newer one. Concurrency does not guarantee that every intermediate commit will be deployed or that runs execute in FIFO order.

## 17.3 Validation Job

```yaml
jobs:
  validate:
```

The validation job repeats our automated tests and build.

Although the Pull Request was already validated, we want to verify the exact commit that exists in `main` after merging.

This protects against issues introduced by the final merge or changes reaching `main` through other permitted mechanisms.

## 17.4 Job Dependencies

```yaml
deploy:
  needs: validate
```

The `needs` property establishes a dependency between jobs.

```text
validate
    |
    | Success
    v
deploy
```

If the validation job fails, the deployment job is skipped.

Jobs run on separate runners, so files created during validation are not automatically available to the deployment job.

Our implementation rebuilds the application directly on EC2 rather than transferring the build generated during validation.

## 17.5 Configuring SSH

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

Creates the SSH configuration directory on the GitHub runner.

This directory is temporary and exists only within the runner environment.

```bash
printf '%s\n' "$SSH_PRIVATE_KEY" \
  | tr -d '\r' > ~/.ssh/deploy_key
```

Writes the private key stored in GitHub Secrets into a file.

`printf` formats and prints a value.

`%s` represents a string.

`\n` appends a newline.

The pipe character passes the output of one command into another command.

`tr -d '\r'` removes carriage return characters that may have been introduced when copying the key between operating systems.

The `>` operator redirects the output into a file.

```bash
chmod 600 ~/.ssh/deploy_key
```

Restricts access to the private key.

```bash
printf '%s\n' "$SSH_KNOWN_HOSTS" \
  | tr -d '\r' > ~/.ssh/known_hosts
```

Creates the known hosts file containing the verified EC2 public host key.

SSH uses this file to verify the remote server's identity.

## 17.6 Validating the Private Key

```bash
ssh-keygen -y -P "" \
  -f ~/.ssh/deploy_key > /dev/null
```

Validates that the private key is readable using an empty passphrase.

`-y` derives the corresponding public key from a private key.

`-P ""` supplies an empty passphrase.

`-f` specifies the key file.

`/dev/null` discards the generated output.

If the key is malformed or requires a different passphrase, the command fails before attempting deployment.

## 17.7 Establishing the SSH Connection

```bash
ssh -o BatchMode=yes \
  -o IdentitiesOnly=yes \
  -o StrictHostKeyChecking=yes \
  -o ConnectTimeout=15 \
  -i ~/.ssh/deploy_key \
  "$EC2_USER@$EC2_HOST"
```

| Argument | Description |
| --- | --- |
| `BatchMode=yes` | Disables interactive authentication prompts |
| `IdentitiesOnly=yes` | Uses the configured SSH identity |
| `StrictHostKeyChecking=yes` | Requires a trusted server host key |
| `ConnectTimeout=15` | Limits the initial connection timeout |
| `-i` | Specifies the private key file |

Strict host verification prevents the workflow from connecting to an unrecognized server.

Do not disable host verification to resolve configuration errors.

## 17.8 Commit SHA

```yaml
DEPLOY_SHA: ${{ github.sha }}
```

Git identifies commits using a unique commit hash, commonly referred to as a SHA.

GitHub Actions exposes the commit associated with the triggering event through the `github.sha` context.

We use this value to deploy the exact commit that was validated.

## 17.9 Executing Remote Commands

```bash
"bash -s -- $DEPLOY_SHA" << 'EOF'
```

This uses a shell feature called a heredoc.

A heredoc allows us to provide multiple lines of input to a command.

Everything between the opening and closing `EOF` markers is sent to Bash on the remote server.

```bash
bash -s
```

Instructs Bash to read commands from standard input.

```bash
--
```

Separates Bash options from positional arguments.

```bash
$DEPLOY_SHA
```

Passes the commit SHA as an argument to the remote Bash process.

The quoted `'EOF'` delimiter prevents the local shell from expanding variables within the heredoc.

Variables inside the block are evaluated on EC2 instead.

## 17.10 Retrieving Repository Changes

```bash
git fetch origin main
```

Retrieves commits from the remote repository.

Unlike `git pull`, `git fetch` does not immediately modify our checked-out application files.

```bash
git checkout --detach "$1"
```

Checks out the commit SHA passed into the remote Bash process.

`$1` represents the first positional argument supplied to Bash.

### Why not use git pull?

Consider the following scenario:

```text
Commit A is merged
    |
    v
GitHub starts validating Commit A
    |
    v
Commit B is merged
    |
    v
Deployment executes git pull
    |
    v
Commit B is deployed instead of Commit A
```

By checking out a specific commit SHA, we ensure that the deployed source code corresponds to the commit validated by the workflow.

### Detached HEAD

Normally, Git's `HEAD` references the currently checked-out branch.

A detached HEAD means that `HEAD` references a specific commit rather than a branch.

This is acceptable for a deployment environment.

We do not intend to develop or commit code directly on EC2.

Do not make manual source code changes on the production server. Local modifications may interfere with subsequent deployments.

## 17.11 Executing the Deployment Script

```bash
bash scripts/deploy.sh
```

Executes the deployment script from the checked-out commit.

The script performs the following operations:

1. Initializes the Node.js environment.
2. Installs server dependencies.
3. Installs client dependencies.
4. Builds the client application.
5. Restarts Express.
6. Verifies application health.

SSH waits for the remote commands to complete.

If the deployment script returns a nonzero exit code, SSH communicates that failure back to GitHub Actions.

---

# 18. Deploying the Pipeline

Verify that the following files exist:

```text
.github/workflows/ci.yml
.github/workflows/cd.yml
scripts/deploy.sh
```

Verify that the health check endpoint has been added to Express.

Verify that the required GitHub secrets have been configured.

Commit and push the changes:

```bash
git add .

git commit -m "Configure automated EC2 deployment"

git push -u origin setup-cd
```

Open a Pull Request targeting `main`.

Observe the CI workflow.

Once validation succeeds, merge the Pull Request.

Navigate to the GitHub Actions tab.

Select the Continuous Deployment workflow.

The expected workflow consists of two jobs:

```text
Continuous Deployment
    |
    |--- validate
    |      |--- Checkout repository
    |      |--- Setup Node.js
    |      |--- Install server dependencies
    |      |--- Run server tests
    |      |--- Install client dependencies
    |      |--- Run client tests
    |      |--- Build client application
    |
    |--- deploy
           |--- Configure SSH
           |--- Deploy application to EC2
```

Expected deployment output:

```text
Starting deployment...
Node.js version:
v22.x.x
npm version:
...
Installing server dependencies...
Installing client dependencies...
Building client application...
Restarting Express server...
Checking application health...
{"status":"healthy"}
Deployment completed successfully!
```

Visit the production application to verify that it remains operational.

---

# 19. Testing the Complete Pipeline

## 19.1 Successful Deployment

Create a new feature branch:

```bash
git checkout main
git pull origin main

git checkout -b update-homepage
```

Modify a visible portion of the React application.

Example:

```jsx
<h1>Economist — Version 2</h1>
```

Commit and push:

```bash
git add .
git commit -m "Update homepage heading"
git push -u origin update-homepage
```

Open a Pull Request.

Verify that:

1. CI executes automatically.
2. Server tests pass.
3. Client tests pass.
4. The client build succeeds.
5. The production application remains unchanged before merging.

Merge the Pull Request.

Verify that:

1. CD executes automatically.
2. The merged commit is validated.
3. GitHub Actions connects to EC2.
4. EC2 retrieves the validated commit.
5. Dependencies are installed.
6. React is rebuilt.
7. Express is restarted.
8. The production application displays the updated heading.

No manual SSH deployment should be necessary.

## 19.2 Failed Integration

Create another branch:

```bash
git checkout main
git pull origin main

git checkout -b demonstrate-ci-failure
```

Create or modify a test so that it intentionally fails:

```js
test("demonstrates a failed CI check", () => {
    expect(2 + 2).toBe(5)
})
```

Commit and push:

```bash
git add .
git commit -m "Demonstrate failing test"
git push -u origin demonstrate-ci-failure
```

Open a Pull Request.

Observe the failed CI workflow.

If branch protection is configured correctly, merging should be blocked.

The production application should remain unchanged.

Fix the test:

```js
test("demonstrates a successful CI check", () => {
    expect(2 + 2).toBe(4)
})
```

Commit and push:

```bash
git add .
git commit -m "Fix failing test"
git push
```

GitHub automatically reruns the CI workflow.

Merge the Pull Request once validation succeeds.

Observe the subsequent deployment.

---

# 20. Troubleshooting

Always inspect the first failing step in the GitHub Actions logs.

A workflow may report multiple errors resulting from a single underlying issue.

## 20.1 SSH Connection Timeout

Example:

```text
ssh: connect to host ... port 22: Connection timed out
```

Possible causes:

- EC2 instance is stopped
- Incorrect public IP address
- Outdated DNS record
- Security group blocks SSH
- Network configuration prevents access

Verify the public IP address in the AWS console.

Check DNS resolution:

```bash
dig +short YOUR_DOMAIN
```

Check port accessibility from your local computer:

```bash
nc -vz YOUR_EC2_IP 22
```

A successful local connection does not guarantee that the GitHub runner is permitted through the security group.

## 20.2 Host Key Verification Failed

Example:

```text
No ED25519 host key is known for ...
Host key verification failed.
```

GitHub Actions cannot find a matching trusted host key for the EC2 instance.

Verify that:

- `EC2_KNOWN_HOSTS` contains the complete host key entry
- The hostname matches `EC2_HOST`
- The host key belongs to the correct EC2 instance
- The entry contains the public key rather than its fingerprint

Retrieve the host key directly from EC2:

```bash
cat /etc/ssh/ssh_host_ed25519_key.pub
```

Retrieve the remote host key:

```bash
ssh-keyscan -t ed25519 YOUR_EC2_IP
```

Compare the key contents.

The expected known hosts format is:

```text
YOUR_EC2_IP ssh-ed25519 PUBLIC_KEY
```

Keep strict host checking enabled.

## 20.3 Not a Public Key File

Example:

```text
(stdin) is not a public key file
```

This may occur when executing:

```bash
ssh-keyscan -t ed25519 YOUR_EC2_IP \
  2>/dev/null | ssh-keygen -lf -
```

The `ssh-keyscan` command may have returned no valid key.

The error redirection may have hidden the underlying issue.

Execute the command without redirection:

```bash
ssh-keyscan -t ed25519 YOUR_EC2_IP
```

Verify network connectivity and the SSH server.

If necessary, retrieve the verified host key directly from EC2 and manually construct the known hosts entry.

## 20.4 Error in libcrypto

Example:

```text
Load key "/home/runner/.ssh/deploy_key": error in libcrypto
Permission denied (publickey).
```

This generally indicates that SSH cannot parse the private key.

Possible causes:

- Public key was copied instead of private key
- Beginning or ending lines are missing
- Line breaks were removed
- Key contains unexpected characters
- Secret is empty or incorrectly configured

Verify the private key locally:

```bash
ssh-keygen -y -f ~/.ssh/github-actions-deploy
```

If the key is valid, this command generates its corresponding public key.

On macOS, copy the private key directly:

```bash
pbcopy < ~/.ssh/github-actions-deploy
```

Update the `EC2_SSH_KEY` secret.

The workflow removes carriage returns and validates the private key before establishing the SSH connection.

## 20.5 Permission Denied (publickey)

Example:

```text
ubuntu@YOUR_EC2_IP: Permission denied (publickey).
```

The SSH server rejected the authentication attempt.

Verify that:

- The correct private key is being used
- The corresponding public key exists in `authorized_keys`
- The correct Linux username is configured
- SSH file permissions are correct

On EC2:

```bash
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

Test the deployment key locally:

```bash
ssh -i ~/.ssh/github-actions-deploy \
  -o IdentitiesOnly=yes \
  ubuntu@YOUR_EC2_IP
```

For additional debugging:

```bash
ssh -v \
  -i ~/.ssh/github-actions-deploy \
  -o IdentitiesOnly=yes \
  ubuntu@YOUR_EC2_IP
```

## 20.6 npm: Command Not Found

Example:

```text
scripts/deploy.sh: line 14: npm: command not found
Process completed with exit code 127
```

This commonly occurs when Node.js was installed using NVM.

GitHub Actions executes a non-interactive SSH session that may not initialize NVM.

Verify the installation paths on EC2:

```bash
which node
which npm
which pm2
```

If the paths contain:

```text
/home/ubuntu/.nvm/versions/node/
```

Ensure that the deployment script explicitly initializes NVM:

```bash
export NVM_DIR="$HOME/.nvm"

if [ -s "$NVM_DIR/nvm.sh" ]; then
    source "$NVM_DIR/nvm.sh" || exit 1
    nvm use 22 || exit 1
fi
```

Verify that the selected Node.js version is installed.

## 20.7 PM2: Command Not Found

Example:

```text
pm2: command not found
```

Verify that NVM has been initialized and that the selected Node.js version has PM2 installed.

```bash
nvm use 22
which pm2
```

If PM2 is not installed for that version:

```bash
npm install -g pm2
```

Ensure the existing production process is managed by the selected user and Node.js environment.

## 20.8 PM2 Process Not Found

Example:

```text
[PM2][ERROR] Process or Namespace economist not found
```

Inspect the existing processes:

```bash
pm2 list
```

Update the deployment script to use the correct process name.

If the process does not exist, configure and start the Express application using the appropriate entry point.

Example:

```bash
cd /var/www/economist/server

pm2 start app.js --name economist

pm2 save
```

Replace `app.js` with the actual server entry point.

## 20.9 Git Repository Authentication Failure

Example:

```text
fatal: could not read Username for 'https://github.com'
```

EC2 cannot authenticate with the GitHub repository.

Verify the remote URL:

```bash
git remote -v
```

Test repository access:

```bash
git fetch origin main
```

Private repositories require separate repository credentials on EC2.

The SSH key used by GitHub Actions to connect to EC2 does not provide EC2 with access to GitHub.

## 20.10 Permission Denied in Application Directory

Example:

```text
Permission denied
```

The deployment user may not have permission to modify the application directory.

Inspect ownership:

```bash
ls -ld /var/www/economist
```

If this directory is intended to be managed entirely by the Ubuntu deployment user, correct its ownership:

```bash
sudo chown -R ubuntu:ubuntu /var/www/economist
```

Only execute this command against the intended application directory.

Do not use `chmod 777` to resolve permission issues.

## 20.11 npm ci Failure

Example:

```text
npm ci can only install packages when your
package.json and package-lock.json are in sync
```

Update the lock file locally:

```bash
npm install
```

Commit the updated `package-lock.json`.

Do not manually modify the production lock file.

## 20.12 Health Check Failure

Example:

```text
curl: (7) Failed to connect to 127.0.0.1 port 4000
```

Inspect the Express process:

```bash
pm2 list
pm2 logs economist --lines 50
```

Verify the application port:

```bash
ss -ltnp
```

Test the health check manually:

```bash
curl -i http://127.0.0.1:4000/api/health
```

Possible causes:

- Express failed to start
- Incorrect port
- Missing environment variables
- Database connection failure
- Incorrect health check route
- Health check route requires authentication

## 20.13 Nginx 502 Bad Gateway

Nginx is unable to communicate successfully with the upstream application.

Verify Express:

```bash
pm2 list
pm2 logs economist
```

Verify the API directly:

```bash
curl http://127.0.0.1:4000/api/health
```

Inspect Nginx logs:

```bash
sudo tail -n 50 /var/log/nginx/error.log
```

Verify that the Express port matches the Nginx `proxy_pass` configuration.

## 20.14 Website Displays the Previous Version

Verify the deployed commit:

```bash
cd /var/www/economist

git log -1 --oneline
```

Compare the commit with the SHA displayed in GitHub Actions.

Inspect the generated client files:

```bash
ls -lah client/dist
```

Verify that Nginx serves the correct directory:

```bash
sudo nginx -T
```

Check for browser caching.

If the deployed commit is correct but the website has not changed, Nginx may be serving a different build directory.

## 20.15 EC2 Runs Out of Memory During Build

Small EC2 instances may have insufficient memory to install dependencies or build larger applications.

Inspect available memory:

```bash
free -h
```

Inspect disk usage:

```bash
df -h
```

Inspect processes:

```bash
top
```

Possible solutions include increasing instance capacity, configuring appropriate swap space, or building the application on a GitHub runner and transferring the generated artifact instead.

---

# 21. Rerunning Failed Workflows

GitHub allows us to rerun failed jobs.

Navigate to:

```text
Actions
  Select failed workflow
    Re-run jobs
      Re-run failed jobs
```

If the failure was caused by configuration outside the repository, such as an incorrect GitHub secret or security group rule, rerunning the failed job may be sufficient.

If the failure requires modifying source code, a workflow file, or the deployment script, commit and merge the changes.

Rerunning an existing workflow uses the original triggering commit. It does not automatically retrieve newly committed workflow or script changes.

---

# 22. Rollbacks

A successful CI/CD pipeline does not guarantee that an application is free of defects.

Automated tests only verify the behavior they were designed to test.

A rollback restores a previously working application version.

One approach is to revert the problematic commit through Git.

```bash
git checkout main
git pull origin main

git checkout -b rollback-fix

git revert COMMIT_SHA

git push -u origin rollback-fix
```

If reverting a merge commit, specify the appropriate parent:

```bash
git revert -m 1 MERGE_COMMIT_SHA
```

Open a Pull Request and allow CI to validate the reverted code.

Once merged, CD automatically deploys the reverted application.

This maintains a record of production changes and avoids rewriting repository history.

Do not assume that reverting application code also reverts database schema changes.

Database migrations and rollback strategies require separate consideration.

---

# 23. Production Considerations

Our implementation demonstrates the fundamental components of CI/CD without introducing additional deployment infrastructure.

There are several limitations to deploying directly into an existing application directory.

- The application may experience brief downtime.
- A failed build may leave partially updated files.
- Dependency installation modifies the existing application environment.
- A failed health check does not automatically restore the previous version.
- The client is rebuilt on EC2 rather than deploying the exact build artifact produced by CI.
- Database migrations are not automatically executed.
- Concurrent manual deployments are not prevented by GitHub concurrency settings.
- A publicly accessible SSH port increases the server's exposure.

More advanced deployment strategies include:

### Immutable Build Artifacts

Build the application once, validate the generated artifact, and deploy that same artifact to production.

### Release Directories

Create a separate directory for each application release and switch the active release after validation.

### Automated Rollback

Automatically restore the previous working release if deployment or health verification fails.

### Blue-Green Deployment

Maintain two production environments and switch traffic to the newly deployed environment after validation.

### Container-Based Deployment

Build and distribute versioned Docker images instead of installing dependencies directly on the production server.

### Infrastructure as Code

Define infrastructure using version-controlled configuration rather than manually configuring resources.

Examples include Terraform, AWS CloudFormation, and AWS CDK.

---

# 24. Challenge

Configure a complete CI/CD pipeline for your existing full-stack application.

## Requirements

- [ ] Create a CI workflow triggered by Pull Requests targeting `main`.
- [ ] Automatically install server and client dependencies.
- [ ] Automatically execute server and client tests.
- [ ] Verify that the client builds successfully.
- [ ] Configure branch protection where supported.
- [ ] Generate a dedicated deployment SSH key.
- [ ] Authorize the deployment key on EC2.
- [ ] Verify the EC2 SSH host key.
- [ ] Configure the required GitHub Actions secrets.
- [ ] Create a reusable deployment script.
- [ ] Initialize NVM within the deployment script if necessary.
- [ ] Create a CD workflow triggered by updates to `main`.
- [ ] Ensure deployment only occurs after validation succeeds.
- [ ] Deploy the exact commit validated by GitHub Actions.
- [ ] Automatically rebuild the client application.
- [ ] Automatically restart the Express process.
- [ ] Implement an application health check.
- [ ] Demonstrate a successful automated deployment.
- [ ] Demonstrate a failed CI workflow.
- [ ] Verify the deployed commit on EC2.

## Bonus

- Configure an isolated PostgreSQL database for integration tests.
- Add a server-side TypeScript build step.
- Include PostgreSQL connectivity in the health check.
- Configure a GitHub production environment.
- Deploy build artifacts rather than rebuilding on EC2.
- Implement an automated rollback strategy.

---

# 25. Reference

## Common Git Commands

```bash
# Create a branch
git checkout -b feature-name

# Switch branches
git checkout main

# Stage changes
git add .

# Commit changes
git commit -m "Commit message"

# Push a new branch
git push -u origin feature-name

# Retrieve remote changes
git fetch origin main

# Retrieve and integrate changes
git pull origin main

# Checkout a specific commit
git checkout --detach COMMIT_SHA

# Inspect the current commit
git log -1 --oneline

# Inspect repository status
git status

# Inspect remote repositories
git remote -v

# Revert a commit
git revert COMMIT_SHA
```

## Common SSH Commands

```bash
# Generate a key pair
ssh-keygen -t ed25519 -f ~/.ssh/deploy-key

# Connect using a private key
ssh -i ~/.ssh/deploy-key ubuntu@HOST

# Connect using verbose logging
ssh -v -i ~/.ssh/deploy-key ubuntu@HOST

# Retrieve a server host key
ssh-keyscan -t ed25519 HOST

# Retrieve a key fingerprint
ssh-keygen -lf PUBLIC_KEY_FILE

# Validate a private key
ssh-keygen -y -f PRIVATE_KEY_FILE

# Inspect authorized public keys
cat ~/.ssh/authorized_keys

# Inspect the server public host key
cat /etc/ssh/ssh_host_ed25519_key.pub
```

## Common NVM Commands

```bash
# List installed Node.js versions
nvm ls

# Install Node.js 22
nvm install 22

# Select Node.js 22
nvm use 22

# Configure the default version
nvm alias default 22

# Inspect Node.js version
node -v

# Inspect npm version
npm -v
```

## Common PM2 Commands

```bash
# List processes
pm2 list

# Start an application
pm2 start app.js --name economist

# Restart an application
pm2 restart economist

# Restart and update environment
pm2 restart economist --update-env

# Inspect application logs
pm2 logs economist

# Inspect recent application logs
pm2 logs economist --lines 50

# Stop an application
pm2 stop economist

# Remove an application from PM2
pm2 delete economist

# Save the current process configuration
pm2 save
```

## Common Nginx Commands

```bash
# Validate configuration
sudo nginx -t

# Display complete configuration
sudo nginx -T

# Reload configuration
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Inspect Nginx status
sudo systemctl status nginx

# Inspect error logs
sudo tail -f /var/log/nginx/error.log

# Inspect access logs
sudo tail -f /var/log/nginx/access.log
```

## Common Linux Commands

```bash
# Display current directory
pwd

# Display directory contents
ls -lah

# Inspect command location
which npm

# Inspect current user
whoami

# Inspect environment path
echo "$PATH"

# Inspect memory
free -h

# Inspect disk usage
df -h

# Inspect running processes
top

# Inspect listening ports
ss -ltnp

# Execute an HTTP request
curl http://127.0.0.1:4000/api/health
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Actions Workflow Syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [NVM Documentation](https://github.com/nvm-sh/nvm)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Vite Documentation](https://vite.dev/guide/)
- [npm ci Documentation](https://docs.npmjs.com/cli/commands/npm-ci)
