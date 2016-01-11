module.exports = {
  "title": "Publish",
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
    },
    "what": {
      "type": "string",
    },
    "start": {
      "type": "string",
      "format": "date-time"
    },
    "end": {
      "type": "string",
      "format": "date-time"
    },
    "user": {
      "type": "string",
      "format": "email"
    },
    "items": {
      "type": "number"
    }
  },
  "required": [
    "type",
    "what",
    "start",
    "user"
  ]
};
