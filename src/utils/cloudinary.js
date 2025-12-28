import { v2 as cloudinary } from "cloudinary";
import fs from "fs";


cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        const normalizedPath = localFilePath.replace(/\\/g, "/");

        const response = await cloudinary.uploader.upload(normalizedPath, {
            resource_type: "auto"
        });

       // console.log("Uploaded to Cloudinary:", response.url);
        fs.unlinkSync(localFilePath);

        return response;

    } catch (error) {
        console.error("Cloudinary Error:", error.message);

        if (localFilePath && fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};

const deleteOnCloudinary = async (imageUrl) => {
    try {
        
        if(!imageUrl) return null

        const public_id = imageUrl.split('/').pop().split('.')[0]
        const response = await cloudinary.uploader.destroy(public_id)

        console.log(response)

        return true

    } catch (error) {
        return null
    }
}


export { uploadOnCloudinary, deleteOnCloudinary };