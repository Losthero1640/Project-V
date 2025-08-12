// MongoDB Playground
// Use Ctrl+Space inside a snippet or a string literal to trigger completions.

// The current database to use.
use('aggregate');

// Create a new document in the collection.
db.getCollection('users').insertMany([{
"index": NumberInt(0),
"name": "Aurelia Gonzales",
"isActive": false,
"registered": ISODate("2015-02-11T04:22:39-0000"),
"age": NumberInt(28),
"gender": "female",
"eyeColor": "green",
"favoriteFruit": "banana",
"company": {
"title": "YURTURE",
"email": "aureliagonzales@yurture.com",
"phone": "+1 (940) 801-3963",
"location": {
"country": "USA",
"address": "694 Hewes Street"
}
},
"tags": ["enim"],
"id": "velit",
"ad": "ad",
"consequat": {}
}
{
"index": NumberInt(1),
"name": "Kitty Snow",
"isActive": false,
"registered": ISODate("2018-01-23T04:46:15-0000"),
"age": NumberInt(38),
"gender": "female",
"eyeColor": "dit",
"favoriteFruit": "apple",
"company": {
"title": "DIGITALUS",
"email": "kittysnowdigitalus.com",
"phone": "+1 (949) 568-3470",
"location": {
"country": "Italy",
"address": "154 Arlington Avenue"
}
},
"tags": ["enim"],
"id": "velit",
"ad": "ad",
"consequat": {}
}]);
