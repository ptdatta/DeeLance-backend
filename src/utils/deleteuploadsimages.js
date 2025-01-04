const fs = require('fs');
const path = require('path');

const fullPath = path.join(process.cwd(), 'src/uploads/');

console.log('Full path:', fullPath);

const deleteImagesInUploadsFolder = async () => {
  try {
    fs.readdir(fullPath, (err, files) => {
      console.log('this is ', files);
      if (err) {
        console.error(err);
        return;
      }
      //==========deleteFiles' is declared but its value is never read=====//
      // eslint-disable-next-line no-unused-vars
      const deleteFiles = files.map(file => {
        console.log(path.join(fullPath, file));
        fs.unlink(path.join(fullPath, file), error => {
          if (err) {
            console.error(error);
            return;
          }
          console.log('File deleted successfully');
        });
        return '';
      });
    });
    // fs.readdir('uploads', (err, files) => {
    //   console.log('this is ', files);
    //   if (err) {
    //     console.error(err);
    //     return;
    //   }
    //   files.forEach(file => {
    //     fs.unlink(`uploads/${file}`, error => {
    //       if (error) {
    //         // Changed from `err` to `error` to correctly reference the variable in this scope
    //         console.error(error);
    //         return;
    //       }
    //       console.log('File deleted successfully');
    //     });
    //   });
    // });
  } catch (err) {
    console.error('Error deleting images:', err);
  }
};

module.exports = deleteImagesInUploadsFolder;
