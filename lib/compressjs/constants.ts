/*
 *
 * Author: Allan Nava (allan.nava@hiway.media)
 * -----
 * Last Modified: 
 * Modified By: Allan Nava (allan.nava@hiway.media>)
 * -----
 * Copyright 2023 - 2023 © 
 * 
 */

export const TNGRM_BASE_URL = "https://api.tngrm.io/api/v3.0";
export const AUTH_LOGIN = "/external/auth/login";
export const GET_CATEGORIES = "/external/upload/categories";
export const CREATE_CATEGORY  = `${GET_CATEGORIES}/create`;
export const GET_RESTREAMERS = "/external/restreamers";
export const GET_RUNNING_INSTANCES = `${GET_RESTREAMERS}/running_instances`;
export const GET_RUNNING_SINGLE_INSTANCE = `${GET_RESTREAMERS}/single_instance`;
export const GET_UPLOADS = "/external/upload";
export const GET_SINGLE_UPLOAD = `${GET_UPLOADS}/jobid`;
export const SET_PUBLISHED_UPLOAD = `${GET_UPLOADS}/set_published`;
export const CREATE_UPLOAD = `${GET_UPLOADS}/create`;
export const PRESIGNED_URL_S3 = `${GET_UPLOADS}/presignedUrl`;
export const S3_SPACE = `${GET_UPLOADS}/s3_space`;
export const ADD_VIDEO_THUMB = `${GET_UPLOADS}/add_thumb`;
export const PERMITTED_FILE_EXTENSIONS = [
  ".mov",
  ".mpeg1",
  ".mpeg2",
  ".mpeg4",
  ".mp4",
  ".mpg",
  ".avi",
  ".wmv",
  ".flv",
  ".3gpp",
  ".webm",
  ".prores",
  ".h265",
  ".hevc",
];

