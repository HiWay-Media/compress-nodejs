/*
 * v1.0.2
 * Author: Allan Nava       (allan.nava@hiway.media)
 * Author: Antonio Borgese  (antonio.borgese@hiway.media)
 * -----
 * Last Modified: 
 * Modified By: Allan Nava (allan.nava@hiway.media>)
 * -----
 * Copyright 2023 - 2024 © 
 * 
 */

import { TNGRM_BASE_URL, S3_SPACE, GET_CATEGORIES, PRESIGNED_URL_S3, ADD_VIDEO_THUMB, CREATE_UPLOAD, GET_RUNNING_SINGLE_INSTANCE, GET_RESTREAMERS, GET_RUNNING_INSTANCES, SCALE_RESTREAMER, GET_UPLOADS, GET_SINGLE_UPLOAD, SET_PUBLISHED_UPLOAD, SIGN_S3_URL, GET_JOBID_PROGRESS, CREDENTIALS, BULK_EVENTS_CREATE, RESTREAMER_HLS_START, RESTREAMER_HLS_STOP, RESTREAMER_PUSH_START, RESTREAMER_PUSH_STOP, RESTREAMER_PULL_START, RESTREAMER_PULL_STOP, GET_CUSTOMER_ZONE, EVENTS_HISTORY, LIVE_TO_VOD, GET_RESTREAMERS_OTT_ALL } from "./constants";

import Evaporate from "evaporate";
import CryptoJS from "crypto-js";
//
class TangramClient {
  //
  api_key: string;
  customer_name: string;
  client_id: string;
  customerId: number;
  //evaporate: Evaporate;
  configEvaporate: any;
  credentials: any;
  SIGNER_URL: string = `${TNGRM_BASE_URL}${SIGN_S3_URL}`; // need to test it with api_key
  /**
   * 
   * @param {string} apikey 
   * @param {string} customer_name 
   */
  constructor(apikey: string, customer_name: string) {
    //
    this.api_key = apikey;
    this.customer_name = customer_name;
    this.client_id = `${this.customer_name}_client`;
    //this.evaporate = new Evaporate(this.configEvaporate);
    this.get_credential().then((res) => {
      this.credentials = res;
      this.customerId = res.customer_id;
    });
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
   * @returns credential object
   */
  async get_credential() {
    return await fetch(TNGRM_BASE_URL + CREDENTIALS, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.api_key,
        client_id: this.client_id,
      }),
    }).then((res) => {
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
   * @param {file} file
   */
  async upload_s3({
    file,
    title = "",
    tags = "",
    location = "",
    category_id,
  }) {
    const _this = this;
    try {

      const presignedResponse = await fetch(TNGRM_BASE_URL + PRESIGNED_URL_S3, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "api_key": this.api_key,
          "client_id": this.client_id,
          "filename": file.name
        }),
      });
      const presignedJson = await presignedResponse.json();
      if (presignedJson.response == "OK") {
        const presigned_url = presignedJson.message;
        const region = presignedJson.region;
        const presignedUpload = await fetch(presigned_url, {
          method: "PUT",
          body: file,
        });
        if (presignedUpload.ok) {
          const uploadRespone = await _this.encode(file.name, file, title, tags, location, category_id, region)
          return uploadRespone
        } else {
          return {
            "response": "KO",
            "message": "failed to upload to s3"
          }
        }
      } else {
        return presignedJson
      }
    } catch (e) {

      return {
        "response": "KO",
        "message": e
      }
    }
  }

  /**
   * @param {file} file_thumb 
   * @param {number} jobid 
   * @returns 
   */
  async add_video_thumb(file_thumb, jobid) {
    var fd = new FormData();
    fd.append("api_key", this.api_key);
    fd.append("client_id", this.client_id);
    fd.append("file", file_thumb);
    fd.append("jobid", jobid);
    // need to finish the add thumb
    return await fetch(TNGRM_BASE_URL + ADD_VIDEO_THUMB, {
      method: "POST",
      body: fd,
      /*headers: {
        "Content-Type": "application/json",
      },*/
      /*body: JSON.stringify({
        api_key: this.api_key,
        client_id: this.client_id,
        jobid: jobid,
      }),*/
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
   * 
   * 
  */
  get_sign_s3_url() {
    return TNGRM_BASE_URL + SIGN_S3_URL
  }

  /** 
   * 
   * @param {File} file
   * @param {string} title
   * @param {string} tags
   * @param {number} category_id
   * @param {fn} onStart
   * @param {fn} onProgress
   * @param {fn} onComplete
   * @param {onError} onComplete
  */
  async upload({
    file,
    title = "",
    tags = "",
    location = "",
    category_id,
    onStart,
    onProgress,
    onComplete,
    onError,
  }) {

    const _this = this;
    const sign_s3_url = this.get_sign_s3_url()

    try {
      const zoneRepsonse = await _this.get_zone();

      const zone = zoneRepsonse.data.zone
      const bucket_upload = zoneRepsonse.data.bucket_upload
      const access_key = zoneRepsonse.data.access_key
      const host = zoneRepsonse.data.host
      const evaporate = await Evaporate.create({
        signerUrl: sign_s3_url,
        logging: false,
        signHeaders: { tangram_key: _this.api_key },
        aws_url: host,
        aws_key: access_key,
        bucket: bucket_upload,
        cloudfront: false,
        progressIntervalMS: 1000,
        sendCanonicalRequestToSignerUrl: true,
        computeContentMd5: true,
        cryptoMd5Method: (data) => {
          const wordArray = CryptoJS.lib.WordArray.create(data);
          const hash = CryptoJS.MD5(wordArray);
          const base64 = CryptoJS.enc.Base64.stringify(hash);
          return base64;
        },
        cryptoHexEncodedHash256: (data) => {
          const hash = CryptoJS.SHA256(data);
          const hex = hash.toString(CryptoJS.enc.Hex);
          return hex;
        }
      })

      const fileName = file.name.trim();

      evaporate.add({
        file: file,
        name: fileName,
        started: () => {
          if (onStart) {
            onStart()
          } else {
            console.log("started...")
          }
        },
        progress: (percent, status) => {
          if (onProgress) {
            onProgress(percent, status)
          } else {
            console.log(percent, status)
          }
        },
        complete: async (result) => {
          const uploadRespone = await _this.encode(fileName, file, title, tags, location, category_id, zone)
          if (onComplete) {
            onComplete(uploadRespone)
          } else {
            console.log(uploadRespone, result)
          }
        },
        error: (error) => {
          if (onError) {
            onError(error)
          } else {
            console.log(error)
          }
        }
      })


    } catch (e) {
      console.log("failed to upload", e);
    }

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
    * @param {string} zone
    */
  async encode(
    uploaded_filename,
    file,
    title,
    tags,
    location_place,
    category_id,
    zone,
  ) {
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
        region: zone,
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
   * @param {number} start_from 
   * @param {number} amount 
   * @returns restreamer list
   */
  async get_restreamers_ott_all(start_from, amount) {
    return await fetch(TNGRM_BASE_URL + GET_RESTREAMERS_OTT_ALL, {
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
   * scale restreamer 
   * @param {string} instance_name 
   * @param {number} scale 
   * @returns restreamer object
   */
  async scale_restreamer(instance_name, scale) {
    return await fetch(TNGRM_BASE_URL + SCALE_RESTREAMER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.api_key,
        client_id: this.client_id,
        instance_name: instance_name,
        scale: scale,
      }),
    }).then((res) => {
      if (!res.ok) {
        throw new Error(
          `something went wrong during get running instances, ${res.status} ${res.statusText}`
        );
      }
      return res.json();
    });
  }

  /**
     * Checks if the given protocol is either "rtmp" or "srt".
     *
     * @param {string} protocol - The protocol to check.
     * @returns {boolean} True if the protocol is "rtmp" or "srt", otherwise false.
     */
  isValidProtocol(protocol) {
    return protocol === 'rtmp' || protocol === 'srt';
  }


  /**
   * To create a bulk events
   * @param {string} instance_name 
   * @param {string} event_name 
   * @returns instance event object
   */
  createEvent(instance_name: string, event_name: string, protocol: string) {
    if (!this.isValidProtocol(protocol)) {
      return null
    }
    return {
      "instance_name": instance_name,
      "protocol": protocol,
      "event_name": event_name,
      "customer_id": this.customerId,
    }
  }

  /**
   * BULK_EVENTS_CREATE
   * accept value 0 or 1
   * Apikey    string                          `json:"api_key" validate:"nonzero,min=1"`
   * Instances []generateEventNoBookingRequest `json:"instances"` --> [{`json:"instance_name", `json:"event_name", `json:"protocol", `json:"customer_id"}]
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
      });
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
  async restreamer_hls_start(instance_name, stream_protocol) {
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
  async restreamer_hls_stop(instance_name, stream_protocol) {
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

  /**
   * To create an external server object 
   * @param {string} audio_channel 
   * @param {string} ingest_protocol 
   * @param {string} external_server 
   * @returns external server object
   */
  createExternalServer(audio_channel: string, ingest_protocol: string, external_server: string) {
    if (!this.isValidProtocol(ingest_protocol)) {
      return null
    }
    return {
      "external_server": external_server,
      "audio_channel": audio_channel,
      "ingest_protocol": ingest_protocol,
    }
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
   * } `json:"external_servers"` --> [{ "audio_channel": x, "ingest_protocol": x, ,"external_server": x}, { "audio_channel": y, "ingest_protocol": x, ,"external_server": x}]
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
   * } `json:"external_servers"` --> [{ "audio_channel": x, "ingest_protocol": x, ,"external_server": x}, { "audio_channel": y, "ingest_protocol": x, ,"external_server": x}]
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
   * } `json:"external_servers"` --> [{ "process_id": x, }, { "process_id": y, }]
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
   * } `json:"external_servers"` --> [{ "process_id": x, }, { "process_id": y, }]
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
  }


  /**
   * Need to call before upload s3
   * 
   * @returns customer_s3
   */
  async get_zone() {
    return await fetch(TNGRM_BASE_URL + GET_CUSTOMER_ZONE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.api_key,
        client_id: this.client_id,
      })
    }).then((res) => {
      if (!res.ok) {
        throw new Error(
          `something went wrong during get getZone, ${res.status} ${res.statusText}`
        );
      }
      return res.json();
    });
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

  /**
   * 
   * example: get_events_history()
   * @param {number} start_from 
   * @param {number} amount 
   * @returns events list
   */
  async get_events_history(start_from, amount) {
    return await fetch(TNGRM_BASE_URL + EVENTS_HISTORY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.api_key,
        client_id: this.client_id,
        start_from: start_from,
        amount: amount
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
   * 
   * example: live_to_vod
   * @param {string} title 
   * @param {string} event_id 
   * @param {string} instance_name 
   * @param {string} category 
   * @returns events list
   */
  async live_to_vod(title, event_id, instance_name, category) {
    return await fetch(TNGRM_BASE_URL + EVENTS_HISTORY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: this.api_key,
        client_id: this.client_id,
        title: title,
        event_id: event_id,
        instance: instance_name,
        category: category,
        location: "",
        thumbnails_number: "0",
        protocol: ""
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

export default TangramClient;