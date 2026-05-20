var holidays = [];
var bgColor = "#FFD700";
var enabled = true;

function formatDisplay(yyyymmdd) {
  return yyyymmdd.substring(6,8)+"/"+yyyymmdd.substring(4,6)+"/"+yyyymmdd.substring(0,4);
}
function dateInputToYYYYMMDD(val) { return val.replace(/-/g,""); }

function renderList() {
  var ul = document.getElementById("holiday-list");
  ul.innerHTML = "";
  if (holidays.length === 0) {
    var li = document.createElement("li");
    li.className = "empty-msg";
    li.textContent = "No holidays configured";
    ul.appendChild(li);
    return;
  }
  holidays.slice().sort().forEach(function(d) {
    var li = document.createElement("li");
    var span = document.createElement("span");
    span.textContent = formatDisplay(d);
    var btn = document.createElement("button");
    btn.className = "del-btn";
    btn.textContent = "\u2715";
    btn.setAttribute("data-date", d);
    btn.addEventListener("click", function() {
      holidays = holidays.filter(function(h) { return h !== d; });
      renderList();
    });
    li.appendChild(span);
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

chrome.storage.sync.get(["holidays","bgColor","enabled"], function(data) {
  holidays = data.holidays || [];
  bgColor = data.bgColor || "#FFD700";
  enabled = data.enabled !== false;
  document.getElementById("enabled").checked = enabled;
  document.getElementById("bgColor").value = bgColor;
  document.getElementById("colorHex").textContent = bgColor;
  renderList();
});

document.getElementById("bgColor").addEventListener("input", function() {
  bgColor = this.value;
  document.getElementById("colorHex").textContent = bgColor;
});

document.getElementById("addDate").addEventListener("click", function() {
  var val = document.getElementById("newDate").value;
  if (!val) return;
  var yyyymmdd = dateInputToYYYYMMDD(val);
  if (holidays.indexOf(yyyymmdd) === -1) { holidays.push(yyyymmdd); renderList(); }
  document.getElementById("newDate").value = "";
});

document.getElementById("enabled").addEventListener("change", function() {
  enabled = this.checked;
});

document.getElementById("saveBtn").addEventListener("click", function() {
  chrome.storage.sync.set({ holidays: holidays, bgColor: bgColor, enabled: enabled }, function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (tabs[0]) chrome.tabs.sendMessage(tabs[0].id, { action: "refresh" });
    });
    var status = document.getElementById("status");
    status.textContent = "\u2713 Settings saved!";
    setTimeout(function() { status.textContent = ""; }, 2000);
  });
});
