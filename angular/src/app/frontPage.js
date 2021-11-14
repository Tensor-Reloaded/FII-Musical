function Falert(){  alert("JS FILE BUT FROM FUNCTION")
}

var seed

function UploadFile()
{
  console.log(event.target.files);
  var reader = new FileReader();
  var readerContent;
  reader.readAsText(event.target.files[0], "UTF-8");
  reader.onload = function (evt) {
    console.log(evt.target.result);
    seed = evt.target.result;
    const Url = "https://1fsemkwku3.execute-api.us-east-1.amazonaws.com/prod/seeds";
    const Data = {
        "alias": "test223",
        "type": "blabla"
    };
    const parameters = {
        mode: "no-cors",
        method: "POST",
        body: Data
    };
    response = fetch(Url, parameters);
  }
}

function ManageDownload(){
  console.log("Recorded Seed is: ");
  console.log(seed);

  var hiddenElement = document.createElement('a');
  hiddenElement.href = 'data:attachment/text,' + encodeURI(seed);
  hiddenElement.target = '_blank';
  hiddenElement.download = 'myFile.txt';
  hiddenElement.click();

}
