module.exports = {
  "title": "Publish",
	"type": "object",
	"properties": {
    "type": {
      "type": "string",
		},
		"start": {
      "type": "string",
      "format": "date-time"
    },
    "createdby": {
      "type": "string",
      "format": "email"
    },
    "itemcount": {
      "type": "number"
		},
    "buildTime": {
      "type": "number"
		}
	},
	"required": [
    "start",
    "createdby"
  ]
};
