# site-builder

Generates a static web site from content in the publishing system.

## Common

Contains utilities and helpers shared between both MyGov and gov.scot.

## Dependencies

This project also depends on CouchDB to store the log of when the site
was published. It is assumed that couchdb is already installed.

The design documents in the couch directory must be uploaded to CouchDB
before the publishes log feature can be used.

# First time and whenever design docs have changed:
couchdb-push http://localhost:5984/publish couch
