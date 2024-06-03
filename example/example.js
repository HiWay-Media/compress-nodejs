// EXAMPLE:
//it contains various examples

window.tangram;
window.categories;
window.connectSection = document.getElementById("connect_section");
window.apiKeyInput = document.getElementById("api_key");
window.customerNameInput = document.getElementById("customer_name");
window.connectButton = document.getElementById("connect");
window.uploadSection = document.getElementById("upload_section");
window.fileInput = document.getElementById("file_to_upload");
window.categorySelect = document.getElementById("categories");
window.uploadButton = document.getElementById("upload");
window.titleInput = document.getElementById("title");
window.progress = document.getElementById("progress");
window.progressBar = document.getElementById("progress_bar");

connectButton.addEventListener("click", (event) => {

  var apiKey = apiKeyInput.value;
  var customerName = customerNameInput.value;

  if (!apiKey) {
    alert("Please enter an API Key");
    return;
  }

  if (!customerName) {
    alert("Please enter a Customer Name");
    return;
  }

  //create tangram client

  window.tangram = new TangramClient(apiKey, customerName);
  tangram.get_categories().then((res) => {
    window.categories = res;
    categorySelect.options[0] = new Option();
    categorySelect.options[0].disabled = true;
    categorySelect.options[0].text = "Select a category";
    categorySelect.options[0].value = "";

    for (var i = 0; i < res.length; i++) {
      categorySelect.options[i + 1] = new Option(res[i].name, res[i].id);
    }
  });


  uploadSection.style.display = "block";
  connectSection.style.display = "none";

});


uploadButton.addEventListener("click", (event) => {
  const title = titleInput.value;
  const category = categorySelect.value;

  if (!title) {
    alert("Please enter a title");
    return;
  }

  if (!category) {
    alert("Please select a category");
    return;
  }


  if (fileInput.files.length == 0) {
    alert("Please select a file");
    return;
  }

  const path = "upload/"+fileInput.files[0].name;
  // renderlo dinamico @toninospiderman123
  const config = {
    signerUrl: "https://api.tngrm.io/api/v3.0/external/upload/sign_s3_url",
    logging: true,
    signHeaders: { tangram_key: apiKeyInput.value },
    aws_url: ``,
    aws_key: ``,
    bucket: ``,
    cloudfront: false,
    progressIntervalMS: 1000, //interval every 1 sec update progress callback
    sendCanonicalRequestToSignerUrl: true, // needed for minio s3
    computeContentMd5: true,
    cryptoMd5Method: (d) => btoa(SparkMD5.ArrayBuffer.hash(d, true)),
    cryptoHexEncodedHash256: sha256,
  }
  Evaporate.create(config).then(evaporate => {

    // disable all
    uploadButton.disabled = true;
    fileInput.disabled = true;
    titleInput.disabled = true;
    categorySelect.disabled = true;
    progress.style.display = "block";
    progressBar.style.width = "0%";


    evaporate.add({
      file: fileInput.files[0],
      name: path,
      progress: (percent, status) => {
        console.log(percent, status)

        // percent is between 0-1
        progressBar.style.width = percent * 100 + "%";
      },
      complete: async (result) => {
        console.log(result);
        tangram.encode(path, fileInput.files[0], title, "", "", category).then((res) => {
          // create upload video
          alert("File uploaded successfully")
          uploadButton.disabled = false;
          fileInput.disabled = false;
          titleInput.disabled = false;
          categorySelect.disabled = false;
          progress.style.display = "none";
          progressBar.style.width = "0%";

        }).catch((err) => {
          alert(err)
        })
      },
      error: (error) => {
        alert(error)
      }
    })

  }).catch(function (e) {
    console.log(e)
  });


});
