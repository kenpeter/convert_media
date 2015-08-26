#!/usr/bin/env node

// usage: 
// 1.  convert_media.js --mp3 --path /full_path_of_directory
// 1.1  convert_media.js --mp3 --json input.json --path /media/kenpeter/3E3C68780C3F137A/input 
// 2.  convert_media.js --mp4 --path /full_path_of_directory (to create mp4 for iDevice)

// https://github.com/tj/commander.js
var program = require('commander');
var glob = require('glob');
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require("fs");

var options;
var my_path;

program
  .version('0.0.1')
  .option('-a, --mp3', 'Convert mp4 or other media type files to mp3')
  .option('-b, --mp4', 'Convert other media type files to mp4')
  .option('-c, --path [path]', 'The path to media directory')
  .option('-d, --json [json]', 'json contains start and duration of the mp3')
  .parse(process.argv);

// Media direcotry path
console.log('Please install avconv and HandBrakeCLI firstly');

if(program.path) {
  console.log('Media directory path: ' + program.path);
}
else {
  console.log('Please provide the media direcotry path');
}

if(program.mp3 && !program.json) {
  console.log('Processing mp3....');

  // options is optional
  options = {
    
  };

  my_path = program.path + '/**/*'; 

  glob(my_path, options, function (er, files) {
    for(var i in files) {
      var input_file_path = files[i];
      var file_json = path.parse(input_file_path);
      var file_directory = file_json.dir; 
      var output_file_path = file_directory + '/' + file_json.name + '_con' + '.mp3'; 

      console.log('Input file: ' + input_file_path);
      console.log('Output file: ' + output_file_path);      

      // It runs parallel.
      var child = spawn('avconv', [
        '-i', input_file_path,
        '-b', '512k',
        '-f', 'mp3',
        output_file_path
      ]);      
    }

    process.exit(); 
  })

}
else if(program.mp3 && program.json) {
  console.log('Processing cut mp3....');

  // Delete unwanted files, this needs to happen earlier.
  var exec = require('child_process').exec;
  exec('rm *_cut.mp3');
  console.log('Delete *cut.mp3 files');

  // options is optional
  options = {
  
  };

  my_path = program.path + '/**/*';

  glob(my_path, options, function (er, files) {
    var time_json = JSON.parse(fs.readFileSync(program.path + '/' + program.json, "utf8"));
   
    console.log('NOTE: number of json obj must match the number of converting songs!!!!'); 
    console.log('Reading time json file: ' + program.json);
    //console.log('Content of time json file:');
    //console.log(time_json);
    console.log('How many files to convert:');
    console.log(files.length);

    for(var i in files) {
      var input_file_path = files[i];
      var file_json = path.parse(input_file_path);
      
      if(file_json.ext == '.mp3') {
        var file_directory = file_json.dir;
        var output_file_path = file_directory + '/' + file_json.name + '_cut' + '.mp3';

        // e.g. avconv -i RR119Accessibility.wav -ss 52:13:49 -t 01:13:52 RR119Accessibility-2.wav
        var index = i - 2; // Because . and .., so it starts at 2?

        console.log('Index: ' + index);
        console.log('Input file: ' + input_file_path);
        console.log('Output file: ' + output_file_path);

        /*
          Sample json file
          [
            {
              "start": "00:00:10",
              "length": "00:01:00"
            },
            {
              "start": "00:00:10",
              "length": "00:01:00"
            },
            {
              "start": "00:00:10",
              "length": "00:01:00"
            },
            {
              "start": "00:00:10",
              "length": "00:01:00"
            }
          ]

          NOTE: the length is always the same, because only cut the start.
          the number of object should match number of song
        */
        var time_obj = time_json[index];
        var start_time = time_obj.start;
        var duration = time_obj.length;

        console.log('Start time and duration:');
        console.log(time_obj.start + ' | ' + time_obj.length);

        
        // It runs parallel.
        var child = spawn('avconv', [
          '-i', input_file_path,
          '-ss', start_time,
          //'-t', duration, // We only cut the start
          output_file_path
        ]);
        
      }
    }   

    process.exit();
  })

}
else if(program.mp4) {
  console.log('Processing mp4....');

  // options is optional
  options = {

  };

  my_path = program.path + '/**/*';

  glob(my_path, options, function (er, files) {
    for(var i in files) {
      var input_file_path = files[i];
      var file_json = path.parse(input_file_path);
      var file_directory = file_json.dir;
      var output_file_path = file_directory + '/' + file_json.name + '_con' + '.mp4';

      console.log('Input file: ' + input_file_path);
      console.log('Output file: ' + output_file_path);

      // It runs parallel.
      var child = spawn('HandBrakeCLI', [
        '-i', input_file_path,
        '-o', output_file_path,
        '-e', 'x264',
        '-b', '700',

        '-a', '1',
        '-E', 'faac',
        '-B', '160',
        '-6', 'dpl2',
        
        '-R', 'Auto',
        '-D', '0.0',
        '-f', 'mp4',
        '-I',
        
        '-X', '320',
        '-m',
        '-x',
        'level=30:bframes=0:weightp=0:cabac=0:ref=1:vbv-maxrate=768:vbv-bufsize=2000:analyse=all:me=umh:no-fast-pskip=1:subme=6:8x8dct=0:trellis=0'
         
      ]);
    }
    process.exit(); 

  });
}
else {
  console.log('Unknown');
}


