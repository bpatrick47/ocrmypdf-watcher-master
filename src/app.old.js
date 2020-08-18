
const chokidar = require('chokidar');
const exec = require('child_process').exec;
const fs = require('fs');

const log = console.log.bind(console);
const processingFiles = {};

const DELAY = process.env.DELAY | 10000; // milliseconds
log(`Delay milliseconds is ${DELAY}`);

var OCRMYPDF_OPTIONS = '--pdf-renderer tesseract --tesseract-timeout 600 --rotate-pages -l fra+eng --deskew --clean --skip-text';
if(process.env.OCRMYPDF_OPTIONS !== undefined) OCRMYPDF_OPTIONS = process.env.OCRMYPDF_OPTIONS;
log(`OCRmyPDF options: ${OCRMYPDF_OPTIONS}`);

const watcher = chokidar.watch('watch-folder/', {
  persistent: true
});

function processFile(path){
  processingFiles[path].state = 'started';
  let exportPath = path.replace(/^watch-folder\//, 'export-folder/');
  log(`Create output to ${exportPath}`);
  exec(`ocrmypdf ${OCRMYPDF_OPTIONS} ${path} ${exportPath}`,
        (error, stdout, stderr) => {
            log(`${stdout}`);
            log(`${stderr}`);
            if (error !== null) {
                log(`exec error: ${error}`);
            }else{
              fs.unlinkSync(path);
            }
            delete processingFiles.path;
        });
}

function checkFileProcessing(path){
  if(processingFiles[path]){
    if(processingFiles[path].state == 'created'){
      let handle = processingFiles[path];
      clearTimeout(handle.timer);
      handle.timer = setTimeout(function(){ processFile(path) }, DELAY);
    }
  } else {
    processingFiles[path]={
      timer: setTimeout(function(){ processFile(path) }, DELAY),
      state: 'created'
    }
  }
}

function processing (path, stats, event){
  if(path.endsWith('.pdf')||path.endsWith('.PDF') || path.endsWidth('.tif')  || path.endsWidth('.TIF')){
    if (stats) 
      log('File', path, event, 'changed size to', stats.size);
    else 
      log('File', path, event);
    checkFileProcessing(path);
  }
}


watcher.on('change', function(path,stat) {
    processing(path,stat,'change');
  }).on('add', function(path, stat) {
    processing(path, stat, 'add');
  });
