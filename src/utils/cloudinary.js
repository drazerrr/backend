import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs'
import { url } from 'inspector';

          
cloudinary.config({ 
  cloud_name: `${process.env.CLOUDINARY_CLOUD_NAME}`, 
  api_key: `${process.env.CLOUDINARY_API_KEY}`, 
  api_secret: `${process.env.CLOUDINARY_API_SECRET}` 
});


const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(
            localFilePath, {
                resource_type: "auto"
            },
        )
        //file upload in cloudinary successfully
        //console.log("file is uploaded successfully in cloudinary", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return error;
    }
}

const deleteFromCloudinary = async (url) => {
    try {
        if(!url) return null;
        // delete the file from cloudinary
        const publicId = url.split('/').slice(7).join('/').split('.')[0];        
        //console.log("publicId: ", publicId);
        const response = await cloudinary.uploader.destroy(publicId);
        //file deleted successfully from cloudinary
        //console.log("file is deleted successfully from cloudinary", response);
        return response;    
    } catch (error) {
        return error;
    }    
}

export {uploadOnCloudinary, deleteFromCloudinary}