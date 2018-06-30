const mongodb = require("mongodb")
const MongoClient = mongodb.MongoClient
const Db = mongodb.Db
const Collection = mongodb.Collection
const Cursor = mongodb.Cursor

const getPrototypeProperties = (Class) => {
  return Object.getOwnPropertyNames(Class.prototype)
}

const mongoClientMethods = getPrototypeProperties(MongoClient)
const dbMethods = getPrototypeProperties(Db)
const collectionMethods = getPrototypeProperties(Collection)
const cursorMethods = getPrototypeProperties(Cursor)

const mongonow = (uri) => {
  const connect = MongoClient.connect(uri)
  const wrapper = {}
  // add MongoClient methods
  mongoClientMethods
    .forEach(method => 
      wrapper[method] = (...args) => 
        connect.then(mongoClient => mongoClient[method](...args)))
  // add Db methods
  wrapper.db = (...dbArgs) => {
    const dbWrapper = {}
    dbMethods
      .forEach(method => 
        dbWrapper[method] = (...args) => 
          connect.then(mongoClient => mongoClient.db(...dbArgs)[method](...args)))
    // add Collection methods
    dbWrapper.collection = (...collectionArgs) => {
      const collectionWrapper = {}
      collectionMethods
        .forEach(method =>
          collectionWrapper[method] = (...args) =>
            connect.then(mongoClient => mongoClient.db(...dbArgs).collection(...collectionArgs)[method](...args)))
      // add Cursor methods
      collectionWrapper.find = (...findArgs) => {
        const findWrapper = {}
        cursorMethods
          .forEach(method => 
            findWrapper[method] = (...args) =>
              connect.then(mongoClient => mongoClient.db(...dbArgs).collection(...collectionArgs).find(...findArgs)[method](...args)))
        return findWrapper
      }
      return collectionWrapper
    } 
    return dbWrapper
  }
  return wrapper
}

module.exports = mongonow