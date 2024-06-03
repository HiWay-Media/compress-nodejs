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

import { TNGRM_BASE_URL, S3_SPACE, GET_CATEGORIES, PRESIGNED_URL_S3, ADD_VIDEO_THUMB, CREATE_UPLOAD, GET_RUNNING_SINGLE_INSTANCE, GET_RESTREAMERS, GET_RUNNING_INSTANCES, SCALE_RESTREAMER, GET_UPLOADS, GET_SINGLE_UPLOAD, SET_PUBLISHED_UPLOAD, SIGN_S3_URL, GET_JOBID_PROGRESS, CREDENTIALS, BULK_EVENTS_CREATE, RESTREAMER_HLS_START, RESTREAMER_HLS_STOP, RESTREAMER_PUSH_START, RESTREAMER_PUSH_STOP, RESTREAMER_PULL_START, RESTREAMER_PULL_STOP   } from "./constants";
// Import the EvaporateJS library
//import  * from 'evaporate';
//
export class TangramClient {
    //
    api_key: string;
    customer_name: string;
    client_id: string;
    //evaporate: Evaporate;
    configEvaporate: any;
    /**
     * 
     * @param {string} apikey 
     * @param {string} customer_name 
     */
    constructor(apikey : string , customer_name : string) {
      //
      this.api_key        = apikey;
      this.customer_name  = customer_name;
      this.client_id      = `${this.customer_name}_client`,
      // understand if we need to saved globally all categories in constructor
      this.configEvaporate = {
        signerUrl: `${TNGRM_BASE_URL}${SIGN_S3_URL}`,
        logging: true,
        signHeaders: { tangram_key :  `` },
        aws_url: "",
        aws_key: "",
        bucket: "",
        cloudfront: false,
        progressIntervalMS: 1000, //interval every 1 sec update progress callback
        sendCanonicalRequestToSignerUrl: true, // needed for minio s3
        computeContentMd5: true,
        //cryptoMd5Method: function (data) { return CryptoJS.md5(data, 'base64'); },
        //cryptoHexEncodedHash256: function (data) { return CryptoJS.sha256(data, 'hex'); }
      }
      //this.evaporate = new Evaporate(this.configEvaporate);
      
    }
    //
    /**
     *
     * @param {string} apikey
     * @param {string} customer
     * @returns in data {
          "total": 4608,
          "used": 1965
      }
     */
    async get_s3_space() {
        return await fetch(TNGRM_BASE_URL + S3_SPACE, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: this.api_key,
            client_id: this.client_id,
            //client_id: `${this.customer_name}_client`,
          }),
        })
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `something went wrong during get categories, ${res.status} ${res.statusText}`
            );
          }
          return res.json();
        });
    }
    //
    /**
     *
     * @param {string} apikey
     * @param {string} customer
     * @returns list of categories of the customer
     */
    async get_categories() {
      return await fetch(TNGRM_BASE_URL + GET_CATEGORIES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get categories, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
    }
  
    /**
     *
     * @param {string} apikey
     * @param {string} customer
     * @returns list of categories of the customer
     */
     async create_category(category_name) {
      return await fetch(TNGRM_BASE_URL + GET_CATEGORIES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          category_name: category_name
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get categories, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
    }
  
    /**
     * upload video to minio s3 bucket with a presigned PUT url
     *
     * videos will not be displayed in compress platform,
     *
     * this is just a plain upload to s3 storage
     * @param {string} destination_folder
     * @param {string} filename
     * @param {file} file
     */
    async upload_s3(destination_folder, file, filename) {
      //
      //filename = filename.replaceAll(" ", "_");
      let file_dest = destination_folder + "/" + filename;
      //   //file check
      //   let file_ext = "." + file.type.split("/")[1]
      //   console.log(file_ext);
      //   if (!PERMITTED_FILE_EXTENSIONS.contains(file_ext)) {
      //       throw new Error(`file extension not permitted, permitted extensions are: ${PERMITTED_FILE_EXTENSIONS.toString()}`)
      //   }
      //
      console.log("file_dest ", file_dest);
      //getting presigned url
      let json = await fetch(TNGRM_BASE_URL + PRESIGNED_URL_S3, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: this.customer_name,
          filename: file_dest,
        }),
      })
      .then((res) => {
        if (!res.ok) {
          console.log(res);
          throw new Error(
            `something went wrong with getting minio s3 presigned url, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
      console.log(`presigned_url: ${json.message}`);
      let presigned_url = json.message;
      //upload to minio s3 with presigned url
      await fetch(presigned_url, {
        method: "PUT",
        body: file,
      }).then((res) => {
        if (!res.ok) {
          console.log(res);
          throw new Error(
            `something went wrong during upload file to s3 minio, ${res.status} ${res.statusText}`
          );
        }
        console.log(res);
      });
    }
  
    /**
     * @param {file} file_thumb 
     * @returns 
     */
     async add_video_thumb(file_thumb) {
      // need to finish the add thumb
      return await fetch(TNGRM_BASE_URL + ADD_VIDEO_THUMB, {
        method: "POST",
        /*headers: {
          "Content-Type": "application/json",
        },*/
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get uploads, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
    }
    /**
     * upload video without encoding
     *
     * just a plain upload to s3 storage
     *
     * videos uploaded with this will NOT be listed from compress platform
     *
     * if destination folder is empty, it will upload to the root of the bucket
     *
     * remember to specify the folder (usually upload)
     * @param {string} destination_folder 
     * @param {file} file 
     */
    async upload_no_encoding(destination_folder, file) {
      //file.name = file.name.replaceAll(" ", "_");
      let fileName = file.name
      //.replaceAll(" ", "_");
      console.log(`uploading ${fileName} to minio S3...`);
      //upload to minio and create_upload on comress for encoding
      return await this.upload_s3(destination_folder, file, fileName)
        .then(async () => {
          console.log(`${fileName} uploaded!`);
          return "OK";
        })
        .catch((err) => {
          console.log(err);
        });
    }
  
    /**
     * upload video with compress encoding
     *
     * if destination folder is empty, it will upload to the root of the bucket
     *
     * remember to specify the folder (usually upload)
     *
     * @param {string} destination_folder 
     * @param {file} file 
     * @param {string} title 
     * @param {string} tags 
     * @param {string} location_place 
     * @param {number} category_id 
     */
    async upload_with_encoding(
      destination_folder,
      file,
      title,
      tags,
      location_place,
      category_id
    ) {
      //get categories
      let fileName = file.name
      //.replaceAll(" ", "_");
      let file_dest = destination_folder + "/" + fileName;
      // wait until the file is uploaded
      console.log(`uploading ${fileName} to minio S3...`);
      let upload = await this.upload_s3(destination_folder, file, fileName);
      console.log("upload ", upload);
      return await this.encode(file_dest, file, title, tags, location_place, category_id);
      /*return await fetch(TNGRM_BASE_URL + CREATE_UPLOAD, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            api_key: this.api_key,
            title: title,
            tags: tags,
            category: parseInt(category_id),
            location: location_place,
            filename: file_dest,
            size: parseInt(file.size),
            reporter_email: `${this.customer_name}@tngrm.io`,
          }),
        })
        .then((res) => {
          if (!res.ok) {
            throw new Error(
              `something went wrong during create upload, ${res.status} ${res.statusText}`
            );
          }
          return res.json();
        });*/
      //
    }
  
     /**
       * upload video with compress encoding
       *
       * if destination folder is empty, it will upload to the root of the bucket
       *
       * remember to specify the folder (usually upload)
       *
       * @param {string} uploaded_filename
       * @param {file} file
       * @param {string} title
       * @param {string} tags
       * @param {string} location_place
       * @param {number} category_id
       */
     async encode(
        uploaded_filename,
        file,
        title,
        tags,
        location_place,
        category_id
    ) {
        //get categories
        //path = path.replaceAll(" ", "_");
        //console.log("upload ", upload);
        return await fetch(TNGRM_BASE_URL + CREATE_UPLOAD, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                api_key: this.api_key,
                title: title,
                tags: tags,
                category: parseInt(category_id),
                location: location_place,
                filename: uploaded_filename,
                size: parseInt(file.size),
                reporter_email: `${this.customer_name}@tngrm.io`,
            }),
        }).then((res) => {
                if (!res.ok) {
                    throw new Error(
                        `something went wrong during create upload, ${res.status} ${res.statusText}`
                    );
                }
                return res.json();
            });
        //
    }
    /**
     * 
     * @param {number} job_id 
     * @returns progressStateResponse 
     */
    async get_jobid_progress(
      job_id,
    ) {
      return await fetch(TNGRM_BASE_URL + GET_JOBID_PROGRESS, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify({
              api_key: this.api_key,
              job_id: job_id,
          }),
      }).then((res) => {
            if (!res.ok) {
                throw new Error(
                    `something went wrong during create upload, ${res.status} ${res.statusText}`
                );
            }
            return res.json();
        });
    }
    /**
     * 
     * @param {number} start_from 
     * @param {number} amount 
     * @returns restreamer list
     */
    async get_restreamers(start_from, amount) {
      return await fetch(TNGRM_BASE_URL + GET_RESTREAMERS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          start_from: parseInt(start_from),
          amount: parseInt(amount)
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get restreamers, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
    }
  
    /**
     * 
     * @returns restreamer object
     */
     async get_restreamer(instance_name) {
      return await fetch(TNGRM_BASE_URL + GET_RUNNING_SINGLE_INSTANCE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          instance_name: instance_name,
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get restreamers, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
    }
  
    /**
     * 
     * @returns restreamer list running
     */
     async get_running_instances() {
      return await fetch(TNGRM_BASE_URL + GET_RUNNING_INSTANCES, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get running instances, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
    }
  
    /**
     * BULK_EVENTS_CREATE
     * accept value 0 or 1
	   * Apikey    string                          `json:"api_key" validate:"nonzero,min=1"`
	   * Instances []generateEventNoBookingRequest `json:"instances"`
     * @returns 
     */
    async bulk_events_create(instances) {
      return await fetch(TNGRM_BASE_URL + BULK_EVENTS_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          instances: instances
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during bulk_events_create ${instances}, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
      // .then((json_res) => {
      //   console.log(json_res);
      //   return json_res.response;
      // })
      // .catch((err) => {
      //   console.log(err);
      // });
    }  

    /**
     * RESTREAMER_HLS_START
     * accept value 0 or 1
	   * ApiKey   string `json:"api_key" `
	   * ClientId string `json:"client_id" `
	   * InstanceName   string `json:"instance_name" `
	   * StreamProtocol string `json:"stream_protocol" `
     * @returns 
     */
    async restreamer_hls_start(instance_name, ) {
      return await fetch(TNGRM_BASE_URL + RESTREAMER_HLS_START, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          instance_name: instance_name,
          stream_protocol: stream_protocol

        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during restreamer_hls_start ${instance_name}, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
    }


    /**
     * RESTREAMER_HLS_STOP
	   * ApiKey   string `json:"api_key" `
	   * ClientId string `json:"client_id" `
	   * InstanceName   string `json:"instance_name" `
	   * StreamProtocol string `json:"stream_protocol" `
     * @returns 
     */
    async restreamer_hls_stop(instance_name, ) {
      return await fetch(TNGRM_BASE_URL + RESTREAMER_HLS_STOP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          instance_name: instance_name,
          stream_protocol: stream_protocol

        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during restreamer_hls_start ${instance_name}, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
    }

    /** TODO:
     * RESTREAMER_PUSH_START
	   * ApiKey   string `json:"api_key" `
	   * ClientId string `json:"client_id" `
	   * InstanceName   string `json:"instance_name" `
	   * ExternalServers []struct {
	   * 	ExternalServer string `json:"external_server" `
	   * 	IngestProtocol string `json:"ingest_protocol" `
	   * 	AudioChannel   string `json:"audio_channel" `
	   * } `json:"external_servers"`
     * @returns 
     */
    async restreamer_push_start(instance_name, external_servers) {
      return await fetch(TNGRM_BASE_URL + RESTREAMER_PUSH_START, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          instance_name: instance_name,
          external_servers: external_servers

        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during restreamer_push_start ${instance_name}, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
    }

    /** TODO:
     * RESTREAMER_PUSH_STOP
	   * ApiKey   string `json:"api_key" `
	   * ClientId string `json:"client_id" `
	   * InstanceName   string `json:"instance_name" `
	   * ExternalServers []struct {
	   * 	ExternalServer string `json:"external_server" `
	   * 	IngestProtocol string `json:"ingest_protocol" `
	   * 	AudioChannel   string `json:"audio_channel" `
	   * } `json:"external_servers"`
     * @returns 
     */
    async restreamer_push_stop(instance_name, external_servers) {
      return await fetch(TNGRM_BASE_URL + RESTREAMER_PUSH_STOP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          instance_name: instance_name,
          external_servers: external_servers

        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during restreamer_push_start ${instance_name}, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
    }

    /** TODO: need to understand if is used or no 
     * RESTREAMER_PULL_START
	   * ApiKey   string `json:"api_key" `
	   * ClientId string `json:"client_id" `
	   * InstanceName   string `json:"instance_name" `
	   * ExternalServers []struct {
	   * 	ProcessID string `json:"process_id" `
	   * } `json:"external_servers"`
     * @returns 
     */
    async restreamer_pull_start(instance_name, external_servers) {
      return await fetch(TNGRM_BASE_URL + RESTREAMER_PULL_START, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          instance_name: instance_name,
          external_servers: external_servers
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during restreamer_push_start ${instance_name}, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
    }


    /** TODO: need to understand if is used or no 
     * RESTREAMER_PULL_STOP
	   * ApiKey   string `json:"api_key" `
	   * ClientId string `json:"client_id" `
	   * InstanceName   string `json:"instance_name" `
	   * ExternalServers []struct {
	   * 	ProcessID string `json:"process_id" `
	   * } `json:"external_servers"`
     * @returns 
     */
    async restreamer_pull_stop(instance_name, external_servers) {
      return await fetch(TNGRM_BASE_URL + RESTREAMER_PULL_STOP, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          instance_name: instance_name,
          external_servers: external_servers
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during restreamer_push_start ${instance_name}, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      })
    }


    /**
     * all argument are optionals except for start_from and amount,
     * example: get_uploads(0, 50, null, null, null)
     * @param {number} start_from 
     * @param {number} amount 
     * @param {string} title Optional
     * @param {string} category_name Optional
     * @param {string} tags Optional
     * @returns upload list
     */
    async get_uploads(start_from, amount, title, category_name, tags) {
      return await fetch(TNGRM_BASE_URL + GET_UPLOADS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          client_id: this.client_id,
          start_from: parseInt(start_from),
          amount: parseInt(amount),
          q: title,
          category: category_name,
          tags: tags
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get uploads, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
        // .then((json_res) => {
        //   console.log(json_res);
        //   return json_res.data;
        // })
        // .catch((err) => {
        //   console.log(err);
        // });
    }
  
    /**
     * jobid is compulsory
     * example: get_single_upload(1000)
     * @param {string} api_key 
     * @param {number} jobid 
     * @returns upload list
     */
     async get_single_upload(jobid) {
      return await fetch(TNGRM_BASE_URL + GET_SINGLE_UPLOAD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          jobid: jobid
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get uploads, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
    }
  
    /**
     * jobid is compulsory
     * example: set_published_upload(1000)
     * @param {string} api_key 
     * @param {number} jobid 
     * @returns upload list
     */
     async set_published_upload(jobid, published) {
      return await fetch(TNGRM_BASE_URL + SET_PUBLISHED_UPLOAD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: this.api_key,
          jobid: jobid,
          published: published
        }),
      })
      .then((res) => {
        if (!res.ok) {
          throw new Error(
            `something went wrong during get uploads, ${res.status} ${res.statusText}`
          );
        }
        return res.json();
      });
    }
    
}
  
