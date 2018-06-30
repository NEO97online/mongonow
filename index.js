const mongodb = require("mongodb")
const MongoClient = mongodb.MongoClient
const Db = mongodb.Db
const Collection = mongodb.Collection
const Cursor = mongodb.Cursor

/**
 * Wraps all functions of a class with a given wrapper function
 * @param {class} Class The class to wrap
 * @param {function} wrapperFn The function to wrap the class methods with
 */
const wrap = (Class, wrapperFn) => {
  const methods = Object.getOwnPropertyNames(Class.prototype)
  const wrapper = methods.reduce((acc, cur) => {
    acc[cur] = (...args) => wrapperFn(cur)(args)
    return acc
  }, {})

  return wrapper
}

const mongonow = (uri) => {
  // store a promise which resolves when connecting to MongoDB
  const connect = MongoClient.connect(uri)

  // wrap all the main methods of MongoDB
  const MongoClientWrapper = wrap(MongoClient, (method) => ((args) => connect.then(mongoClient => mongoClient[method](...args))))
  const DbWrapper = (dbArgs) => wrap(Db, (method) => ((args) => connect.then(mongoClient => mongoClient.db(...dbArgs)[method](...args))))
  const CollectionWrapper = (dbArgs, collectionArgs) => wrap(Collection, (method) => ((args) => connect.then(mongoClient => mongoClient.db(...dbArgs).collection(...collectionArgs)[method](...args))))
  const CursorWrapper = (dbArgs, collectionArgs, findArgs) => wrap(Cursor, (method) => ((args) => connect.then(mongoClient => mongoClient.db(...dbArgs).collection(...collectionArgs).find(...findArgs)[method](...args)).catch(console.log)))

  // Note that we have to nest wrappers like this,
  // because mongodb has some functions which dont return promises.
  // For every function which doesn't return a promise, we need to wrap it,
  // to maintain the same API functionality as the mongodb driver.
  // If we didn't wrap these functions, then `client.db` would return a
  // promise, which is different from how the mongodb driver works.
  const mainWrapper = {
    ...MongoClientWrapper,
    db: (...dbArgs) => ({
      ...DbWrapper(dbArgs),
      collection: (...collectionArgs) => ({
        ...CollectionWrapper(dbArgs, collectionArgs),
        find: (...findArgs) =>
          CursorWrapper(dbArgs, collectionArgs, findArgs)
      })
    })
  }

  return mainWrapper
}

module.exports = mongonow