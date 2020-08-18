const chokidar = require('chokidar');                                                                                                                
const exec = require('child_process').exec;                                                                                                          
const fs = require('fs');                                                                                                                            
                                                                                                                                                     
const log = console.log.bind(console);                                                                                                               
const processingFiles = {};                                                                                                                          
var converting = false; // mémorise une conversion en cours                                                                                          
                                                                                                                                                     
const DELAY = process.env.DELAY | 10000; // milliseconds                                                                                             
log(`Delay milliseconds is ${DELAY}`);                                                                                                               
                                                                                                                                                     
const PUID = process.env.PUID | 1000;                                                                                                                
const GID = process.env.PGUID | 100;                                                                                                                 
const timeOutProg = process.env.TIMEOUT | 500000;                                                                                                    
                                                                                                                                                     
log('PUID : ', PUID, ', PGUID : ', GID);                                                                                                             
const execOptions = {                                                                                                                                
   // gid: GID,                                                                                                                                      
   // uid: PUID,                                                                                                                                     
   timeout: timeOutProg                                                                                                                              
};                                                                                                                                                   
                                                                                                                                                     
log('execOption : ', execOptions);                                                                                                                   
                                                                                                                                                     
var OCRMYPDF_OPTIONS = '--tesseract-timeout 600 --rotate-pages -l fra+eng --deskew --clean --clean-final --skip-text';                               
if (process.env.OCRMYPDF_OPTIONS !== undefined) OCRMYPDF_OPTIONS = process.env.OCRMYPDF_OPTIONS;                                                     
log(`OCRmyPDF options: ${OCRMYPDF_OPTIONS}`);                                                                                                        
                                                                                                                                                     
const watcher = chokidar.watch('watch-folder/', {                                                                                                    
   persistent: true                                                                                                                                  
});  

function processFile(path) {                                                                                                                         
   processingFiles[path].state = 'started';                                                                                                          
   // Mémoriser la conversion                                                                                                                        
   converting = true;                                                                                                                                
                                                                                                                                                     
   let exportPath = path.replace(/^watch-folder\//, 'export-folder/');                                                                               
   // changer la sortie tif en pdf                                                                                                                   
   if (exportPath.endsWith('.tif')) {                                                                                                                
      exportPath = exportPath.replace('.tif', '.pdf');                                                                                               
   }                                                                                                                                                 
   if (exportPath.endsWith('.TIF')) {                                                                                                                
      exportPath = exportPath.replace('.TIF', '.pdf');                                                                                               
   }                                                                                                                                                 
   log(`Create output to ${exportPath}`);                                                                                                            
   exec(`ocrmypdf ${OCRMYPDF_OPTIONS} "${path}" "${exportPath}"`,                                                                                    
      execOptions,                                                                                                                                   
      (error, stdout, stderr) => {                                                                                                                   
         log(`${stdout}`);                                                                                                                           
         log(`${stderr}`);                                                                                                                           
         if (error !== null) {                                                                                                                       
            log(`--> exec error: ${error}`);                                                                                                         
         } else {                                                                                                                                    
            fs.unlinkSync(path);                                                                                                                     
         }                                                                                                                                           
         // Fin de conversion                                                                                                                        
         converting = false;                                                                                                                         
         // log('ProcessingFiles :', processingFiles);                                                                                               
         delete processingFiles[path];                                                                                                               
         // log('ProcessingFiles after delete :', processingFiles);                                                                                  
      });                                                                                                                                            
}                                                                                                                                                    
    /**                                                                                                                                                  
 * Vérifie si pas de conversion en cours                                                                                                             
 * SI pas de conversion : lance la conversion                                                                                                        
 * SI conversion, relance le timer                                                                                                                   
 * @param {*} path Fichier a traiter                                                                                                                 
 */                                                                                                                                                  
function checkConverting(path) {                                                                                                                     
   // log('checkConverting : ', converting, ' path : ', path);                                                                                       
   if (converting == false) {                                                                                                                        
      processFile(path);                                                                                                                             
   } else {                                                                                                                                          
      checkFileProcessing(path, 1000);                                                                                                               
   }                                                                                                                                                 
}                                                                                                                                                    
                                                                                                                                                     
function checkFileProcessing(path, delay = DELAY) {                                                                                                  
   if (processingFiles[path]) {                                                                                                                      
      if (processingFiles[path].state == 'created') {                                                                                                
         let handle = processingFiles[path];                                                                                                         
         clearTimeout(handle.timer);                                                                                                                 
         handle.timer = setTimeout(function () { checkConverting(path) }, delay);                                                                    
      }                                                                                                                                              
   } else {                                                                                                                                          
      processingFiles[path] = {                                                                                                                      
         timer: setTimeout(function () { checkConverting(path) }, delay),                                                                            
         state: 'created'                                                                                                                            
      }                                                                                                                                              
   }                                                                                                                                                 
}                                                                                                                                                    
                                                                                                                                                     
function processing(path, stats, event) {                                                                                                            
   if (path.endsWith('.pdf') || path.endsWith('.PDF') || path.endsWith('.tif') || path.endsWith('.TIF')) {                                           
      if (stats)                                                                                                                                     
         log('File', path, event, 'changed size to', stats.size);                                                                                    
      else                                                                                                                                           
         log('File', path, event);                                                                                                                   
      checkFileProcessing(path);                                                                                                                     
   }                                                                                                                                                 
}  

watcher.on('change', function (path, stat) {                                                                                                         
      processing(path, stat, 'change');                                                                                                                 
   }).on('add', function (path, stat) {                                                                                                                 
   processing(path, stat, 'add');                                                                                                                    
});
