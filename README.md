# QuantBlitz

## Back-End Development Environment Setup

1. Download Vagrant: https://www.vagrantup.com/downloads.html
2. Download VirtualBox: https://www.virtualbox.org/wiki/Downloads
3. Run `vagrant up` within the project's root directory
4. Run `vagrant provision` to run the provision script again **ONLY** if you have modified it
5. Follow the commands printed out by the provision script
6. Install argon2 using the following steps found here: https://www.npmjs.com/package/argon2#before-installing
7. Create a `secret.json` file to use in signing session cookies.
8. Run `npm start` to get the Node server running whilst connected to the PostgreSQL database
9. Hack the planet

## Recommended Development Tools

If you don't have `nvm` (Node Version Manager) yet, it is highly advised that you install it. Simply use one of the two following install scripts:

- For cURL: `curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash`
- For Wget: `wget -qO- https://raw.githubusercontent.com/creationix/nvm/v0.32.0/install.sh | bash`

## Git Conventions We Use

Make sure to *never* push into the `development` branch without having merged it to your branch first to resolve any potential merge conflicts that may arise. The `development` branch is to stay merge conflict-free.

For this project, we use the following format to name branches:

- Release branch: `release-1.0`
- Feature branch: `f-branch-name`
- Bug fix branch: `b-branch-name`
- Hot fix branch: `h-branch-name`
- Refactor branch: `r-branch-name`

Hot fixes are only meant to be quick critical fixes that get immediately pushed into production. Merge this directly into the `development` branch, followed by the `release` & `master` branch.

## Copyright Notice

Copyright (c) 2017, <https://github.com/RecursiveLogic>

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is NOT granted, unless written consent from the publisher is granted.
