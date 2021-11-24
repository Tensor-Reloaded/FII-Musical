var seed
var seedName

class submitMonitor{
  constructor(){
    this.uploadedFlag = false;
    this.submitedFlag = false;
  }
  handleViolation(){
    alert("File should be selected with browse before pressing this button");
  }
}

var submitedMonitor = new submitMonitor()

function UploadFile()
{
  seedName = event.target.files;
  console.log(seedName);
  var reader = new FileReader();
  reader.readAsText(event.target.files[0], "UTF-8");
  reader.onload = function (evt) {
    //console.log(evt.target.result);
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
  if(seedName != null){
    submitedMonitor.uploadedFlag = true;
  }
}


class DownloadManager{
  ManageDownload(){
    if (submitedMonitor.uploadedFlag == true) {
      console.log("Seed was properly cached");
      submitedMonitor.submitedFlag = true;

      console.log("Recorded Seed is: ");
      console.log(seed);

      var hiddenElement = document.createElement('a');
      hiddenElement.href = 'data:attachment/text,' + encodeURI(seed);
      hiddenElement.target = '_blank';
      hiddenElement.download = 'myFile.txt';
      hiddenElement.click();
    }
    else{
      console.log("Alerting Download Manager Failure");
      submitedMonitor.handleViolation();
    }
  }
}
const MainDownloadManager = new DownloadManager();
const getMethods = (obj) => Object.getOwnPropertyNames(Object.getPrototypeOf(obj)).filter(item => typeof obj[item] === 'function')

function replaceMethod(target, methodName, aspect, advice) {
    const originalCode = target[methodName]
    target[methodName] = (...args) => {
        if(["before", "around"].includes(advice)) {
            aspect.apply(target, args)
        }
        const returnedValue = originalCode.apply(target, args)
        if(["after", "around"].includes(advice)) {
            aspect.apply(target, args)
        }
        if("afterReturning" == advice) {
            return aspect.apply(target, [returnedValue])
        } else {
            return returnedValue
        }
    }
}


function inject(target, aspect, advice, pointcut, method = null) {
    if(pointcut == "method") {
        if(method != null) {
            replaceMethod(target, method, aspect, advice)
        } else {
            throw new Error("Tryin to add an aspect to a method, but no method specified")
        }
    }
    if(pointcut == "methods") {
        const methods = getMethods(target)
        methods.forEach( m => {
            replaceMethod(target, m, aspect, advice)
        })
    }


}

function stoperror() {
   return true;
}

function loggingAspect() {
  try{
    console.log(`Aspect detected the file: ${seedName[0].name}`)
    console.log(`of size: ${seedName[0].size}`)
    console.log(`and with type: ${seedName[0].type}`)
  }catch(e){
    stoperror(e);
  }
}

inject(MainDownloadManager, loggingAspect, "before", "methods")
