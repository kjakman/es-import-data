var path = require('path'),
    yargs = require('yargs'),
    colors = require('colors/safe'),
    util = require('util'),
    cmd=require('node-cmd'),
    fs = require('fs'),
    _ = require('lodash')
    isVerboseOn = false;
    exportToES = false;

process.on('uncaughtException', function(err) {

    if(isVerboseOn){
        console.log(colors.red(err.stack));
    }
    else{
        console.log(colors.red(err));
    }

});

var argv = yargs.usage('Usage: $0 -f [input JSON file] -o [output path for request body data file] -i [Elasticsearch index to write to] -t [Elasticsearch type to write] -e 1')
    .demand(['f', 'i', 't'])
    .alias('f', 'file')
    .describe('f', 'Path to input JSON file')
    .alias('e', 'export')
    .describe('e', 'Export JSON to ElasticSearch?')
    .default('e', 0)
    .alias('o', 'output')
    .describe('o', 'Output path of the request body data file')
    .default('o', './')
    .alias('i', 'index')
    .describe('i', 'Elasticsearch index to write to')
    .alias('t', 'type')
    .describe('t', 'Name of the Elasticsearch type that is being inserted')
    .alias('v', 'verbose')
    .help('h')
    .alias('h', 'help')
    .epilog('Copyright 2015')
    .argv;

if(argv.verbose){
    isVerboseOn = true;
}

if(argv.export){
    exportToES = true;
}

cmd.get(
    'pwd',
    function(err, data, stderr){
        console.log('the current working dir is : ',data)
    }
);


var stats = fs.statSync(argv.file);
if(!stats.isFile()){
    console.log(colors.red('Unable to find input file: ', argv.file));
    exit(1);
}

var inputJsonString = fs.readFileSync(argv.file),
    inputJson;

try{
    inputJson = JSON.parse(inputJsonString);
}
catch(err){
    console.log(colors.red('Unable to parse input json contents', err));
    exit(1);
}

var outputStats = fs.statSync(argv.output);
if(!outputStats.isDirectory()){
    console.log(colors.red('[output] is not a valid directory: ', argv.output));
    exit(1);
}

/** Added by Kjetil - check if input file is output from ES query */
var es_query_output = false;
if(inputJson.hits && inputJson.hits.hits &&  _.isArray(inputJson.hits.hits)) {
    inputJson = inputJson.hits.hits;
    console.log(colors.red('Found ES query output, using hits'));
    es_query_output = true;
} else if(!_.isArray(inputJson)){
    console.log(colors.red('Contents of JSON input file must be an array'));
    exit(1);
}

var output_file = path.join(argv.output, 'request-data.txt');
var stream = fs.createWriteStream(output_file);
stream.on('finish', function() {
	console.log(colors.green('completed, wrote: ' + counter + ' record(s)'));
});

var stats = fs.statSync(argv.file);
if(!stats.isFile()){
    console.log(colors.red('Unable to find input file: ', argv.file));
    exit(1);
}

console.log(colors.gray('Writing records...'));
var counter = 0;

stream.once('open', function(fd) {

    _.each(inputJson, function(record){
        /** Added by Kjetil - check if input file is output from ES query */
        if(es_query_output && record._source) record = record._source;
          
        var recordPrologue = { index: { '_index': argv.index, '_id': record.id, '_type': argv.type } };
        stream.write(JSON.stringify(recordPrologue) + '\n');
        stream.write(JSON.stringify(record) + '\n');

        //process.stdout.write('.');

        if(counter % 100){
           // console.log(colors.gray('.'));
        }

        counter++;
    });

    stream.end();
    
    if(exportToES) {
      var outputString;
      fs.readFile(output_file, (err, outputString) => {
        if (err) throw err;
        console.log(colors.gray('Exporting ' + output_file + ' to ElasticSearch index=' + argv.index + ' ...'));
        var cmdstr = "curl -XPOST http://localhost:9200/_bulk -H 'Content-Type: application/json' -d'\n" + outputString + "'";
        cmd.get(
            cmdstr,
            function(err, data, stderr){
                console.log('Elasticsearc response : ',data)
            }
        );
        
      });


      
    }
});
