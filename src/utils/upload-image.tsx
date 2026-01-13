// import axiosInstance from 'src/lib/axios';
// import { endpoints } from 'src/lib/axios';

// /**
//  * Upload image file to backend
//  * @param file - Image file to upload
//  * @returns Promise with uploaded image object name
//  */
// export async function uploadImage(file: File): Promise<string> {
//   try {
//     const formData = new FormData();
//     formData.append('file', file);

//     const response = await axiosInstance.post<{ objectName: string }>(
//       endpoints.media.uploadImage,
//       formData,
//       {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       }
//     );

//     // Return the object name (e.g., "group_4-2_20260113122717.png")
//     return response.data.objectName;
//   } catch (error) {
//     console.error('Error uploading image:', error);
//     throw new Error('Failed to upload image');
//   }
// }

// /**
//  * Get full image URL from object name
//  * @param objectName - Image object name
//  * @returns Full image URL
//  */
// export function getImageUrl(objectName: string | null | undefined): string {
//   if (!objectName) return '';
  
//   // If it's already a full URL, return as is
//   if (objectName.startsWith('http://') || objectName.startsWith('https://')) {
//     return objectName;
//   }
  
//   // Otherwise, construct the full URL
//   return endpoints.media.getImage(objectName);
// }