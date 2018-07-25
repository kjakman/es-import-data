# `es-import-data`

Simple utility based on [json-es-to-bulk](https://github.com/mradamlacey/json-to-es-bulk) that reads in a file (specified on the command line with `-f`) that
contains an array of JSON data and outputs a new file with contents suitable
as the request body for an Elasticsearch bulk request. 

Sometimes as a consultant, you are at a customer, and want to quickly copy some data from their cluster to your own instance for testing. On the source cluster, you run a search command like this:

```
GET [index_name]/_search
{
  "size": N
}
```

where N is the number of records you want to copy.

You copy the output and save it on your local machine as `inputdata.json` (by default). You then install and run this utility on your local machine, and the the data will be written to your cluster at `localhost:9200` with the index name you specify.


The utility will create also file named `request-data.txt` in the output path specified.


## Limitations

- Currently is required that there is a property named `id` in each object
of the array in order to properly create the bulk request.
- Only `index` operations are supported


> The easy use-case for this tool is to use something like [JSON-Generator](http://www.json-generator.com/)
to generate test data that can easily be converted to a bulk request.

## Usage
```
node index.js -f [input JSON file] -o [output path for request body data file] -i [Elasticsearch index to write to] -t [Elasticsearch type to write] -e 1
```

`-e 1` means export result to Elasticsearch on localhost:9200

E.g.

```
node index.js -f inputdata.json --index test --type test -e 1
```

This will read `inputdata.json` from the current directory, and
create a bulk request to the `test` index to the `test` mapping.

### Getting started

 - Clone this repo
 - Run `npm install`


### Using `curl` to index the request data:

```
curl -XPOST http://localhost:9200/_bulk @<path to output file>
```