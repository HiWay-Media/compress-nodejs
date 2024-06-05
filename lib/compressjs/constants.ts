/*
 *
 * Author: Allan Nava       (allan.nava@hiway.media)
 * Author: Daniel Botta     (daniel.botta@hiway.media)
 * Author: Antonio Borgese  (antonio.borgese.hiway.media) 
 * -----
 * Last Modified: 
 * Modified By: Allan Nava  (allan.nava@hiway.media>)
 * -----
 * Copyright 2023 - 2024 © 
 * 
 */

export const TNGRM_BASE_URL                 = "https://api-compress.hiway.media/api/v4.0";
//export const AUTH_LOGIN                     = "/external/auth/login"; deprecated
export const GET_CATEGORIES                 = "/external/upload/categories";
export const CREATE_CATEGORY                = `${GET_CATEGORIES}/create`;
// restreamers 
export const GET_RESTREAMERS                = "/external/restreamers";
export const GET_RUNNING_INSTANCES          = `${GET_RESTREAMERS}/running_instances`;
export const GET_RUNNING_SINGLE_INSTANCE    = `${GET_RESTREAMERS}/single_instance`;
export const SCALE_RESTREAMER               = `${GET_RESTREAMERS}/scale_instance`;
export const RESTREAMER_HLS_START           = `${GET_RESTREAMERS}/hls/start`;
export const RESTREAMER_HLS_STOP            = `${GET_RESTREAMERS}/hls/stop`;
export const RESTREAMER_PUSH_START          = `${GET_RESTREAMERS}/push/start`;
export const RESTREAMER_PUSH_STOP           = `${GET_RESTREAMERS}/push/stop`;
export const RESTREAMER_PULL_START          = `${GET_RESTREAMERS}/pull/start`;
export const RESTREAMER_PULL_STOP           = `${GET_RESTREAMERS}/pull/stop`;
// events 
export const EVENTS_EXTERNAL                = "/external/events";
export const BULK_EVENTS_CREATE             = `${EVENTS_EXTERNAL}/create_bulk`;
export const EVENTS_HISTORY                 = `${EVENTS_EXTERNAL}/history`;
export const LIVE_TO_VOD                    = `${EVENTS_EXTERNAL}/generate_vod`;
// video upload
export const GET_UPLOADS                    = "/external/upload";
export const GET_SINGLE_UPLOAD              = `${GET_UPLOADS}/jobid`;
export const GET_JOBID_PROGRESS             = `${GET_UPLOADS}/job_progress/jobid`;
export const SET_PUBLISHED_UPLOAD           = `${GET_UPLOADS}/set_published`;
export const CREATE_UPLOAD                  = `${GET_UPLOADS}/create`;
export const PRESIGNED_URL_S3               = `${GET_UPLOADS}/presignedUrl`;
export const S3_SPACE                       = `${GET_UPLOADS}/s3_space`;
export const ADD_VIDEO_THUMB                = `${GET_UPLOADS}/add_thumb`;
export const SIGN_S3_URL                    = `${GET_UPLOADS}/sign_s3_url`;
// credentials
export const CREDENTIALS                    = `/external/credentials/`;
// customers
export const CUSTOMERS                      = `/external/customers/`;
export const GET_CUSTOMER_ZONE              = `${CUSTOMERS}/s3`;
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

