Monster Battle
==========================

## Install

### Prerequisites
- Node.js - Download and Install Node.js with [NVM](https://github.com/creationix/nvm) (Node Version Manager) - Simple bash script to manage multiple active node.js versions.
```
brew install mongodb
npm install -g grunt
```

**NOTE:**
After installing  Node.js and MongoDB server has running, then its time to running your server.

```
  $ git clone git@github.com:zhangchiqing/MonBattle.git
  $ cd MonBattle
  $ npm install
  $ mongodb
  $ grunt
```

Then visit [http://localhost:3001/](http://localhost:3001/)



### Directory structure

```
-app/
  |__config/
  |__controllers/
  |__helper
  |__models/
  |__mailer/
  |__views/
  |__routes

-public/
  |__css (all files will generate from Grunt)
  |__js
  |__less
  |__fonts
  |__img
  favicon.ico
-Grunfile.coffee
```
