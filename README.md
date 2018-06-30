# MongoNow

Tiny wrapper around the MongoDB driver to allow immediate usage of database commands without needing to store state or wrap everything in a callback.

## Installation

```sh
$ npm i mongonow
```

## Usage

```js
const client = require("mongonow")(url) // replace url with your MongoDB url

// you can now use mongodb as usual:

const db = client.db("mydatabase")
db.collection("users").find().toArray().then(users => console.log(users))
```