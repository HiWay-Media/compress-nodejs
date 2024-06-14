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

  tangram.upload({
    file: fileInput.files[0],
    title,
    category_id: category,
    onStart: () => {
      uploadButton.disabled = true;
      fileInput.disabled = true;
      titleInput.disabled = true;
      categorySelect.disabled = true;
      progress.style.display = "block";
      progressBar.style.width = "0%";
    },
    onProgress: (percent) => {
      progressBar.style.width = percent * 100 + "%";
    },
    onComplete: (result) => {
      alert("File uploaded successfully")
      uploadButton.disabled = false;
      fileInput.disabled = false;
      titleInput.disabled = false;
      categorySelect.disabled = false;
      progress.style.display = "none";
      progressBar.style.width = "0%";
    },
    onError: (error) => {
      alert(error)
    }
  });
  
});
