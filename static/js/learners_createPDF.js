const MARGINS = {
  top: 80,
  bottom: 60,
  left: 80,
  width: 430,
};

async function downloadPDF() {
    console.log("starting")
    $(".pdf-loading-indicator").show()
    generatePDF().then(()=> {
        $(".pdf-loading-indicator").hide()
        console.log("finished")
    })
}

function generatePDF() {
    return new Promise(resolve => {
        var pdf = new jsPDF("p", "pt", "a4", true);
        let $source = $("#body-inner").clone();

        var pdf_container = document.createElement("div");
        pdf_container.id = "pdfcontainer";
        $("#body-inner").append(pdf_container);

        $("#pdfcontainer").append($source);
        cleanHTML($("#pdfcontainer"));

        source = $("#pdfcontainer")[0];

        pdf.fromHTML(
            source, // HTML string or DOM elem ref.
            MARGINS.left, // x coord
            MARGINS.top, // y coord
            {
              unit: "pt",
              jsPDF: document,
              autoPaging: "text",
              width: MARGINS.width, // max width of content on PDF
            },
            
              function (dispose) {
                pdf.setFontSize(7);
                pdf.setTextColor("#9a9a9a");
                pdf.setFont("helvetica");

                var pageTitle = $(source).find("h1:first").text().trim();

                const pageCount = pdf.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    const pageSize = pdf.internal.pageSize;
                    const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                    const pageHeight = pageSize.height
                    ? pageSize.height
                    : pageSize.getHeight();
                    const header = "Report: " + pageTitle;
                    const footer = `Page ${i} of ${pageCount}`;

                    console.log("width: ", pageWidth);

                    // Header
                    pdf.text(header, 60, 30, { baseline: "top" });

                    // Footer
                    pdf.text(footer, 60, pageHeight - 30, { baseline: "bottom" });
                }
                resolve('resolved');
                pdf.save("Report_" + pageTitle + ".pdf");
                $("#pdfcontainer").remove();
                },
                MARGINS
              
            // MARGINS.left, // x coord
            // MARGINS.top, // y coord
        );
    });
}

function cleanHTML(source) {
  const exception_list = "table, thead, tbody, tr, td, th"
  $.each($(source).find("*"), function () {
    let element = $(this)[0];
    let tagName = $(element).prop("tagName");
    var k = parseInt($(tagName).css("font-size"));
    var redSize = (k * 80) / 100;
    $(element).not(exception_list).css({ "font-size": redSize });
    $(element).not(exception_list).css({ padding: 0 });
    $(element).addClass("pdf");
  });

  // Adjust Image Sizes
  $.each($(source).find("img"), function () {
    adjustImgSize(this);
  });

  // Replace hyperlinks
  $.each($(source).find("a"), function () {
    // $(this).replaceWith("<b>" + this.innerHTML + "</b>");
    $(this).replaceWith(this.innerHTML);
  });

  // $.each($(source).find("em"), function () {
  //   $(this).replaceWith(this.innerHTML);
  // });
  // $.each($(source).find("b"), function () {
  //   $(this).replaceWith(this.innerHTML);
  // });
  // $.each($(source).find("strong"), function () {
  //   $(this).replaceWith(this.innerHTML);
  // });

  // Replace labels
  $.each($(source).find("label"), function () {
    // $(this).replaceWith("<b>" + this.innerHTML + "</b>");
    $(this).replaceWith(this.innerHTML);
  });

  // Replace input fields with value
  $.each($(source).find("input[type=text]"), function () {
    let value = $(this).attr("value");
    replaceInputField(value, $(this));
  });

  // Replace input selects with value
  $.each($(source).find("select"), function () {
    let value = $(this).find("option:selected").text();
    replaceInputField(value, $(this));
  });

  // Replace input textarea with value
  $.each($(source).find("textarea"), function () {
    let value = $(this).val();
    replaceInputField(value, $(this));
  });

  // Remove unnecessary elements
  let objects_to_remove = [
    "div.exercise-control",
    ".add-input-row",
    "button",
    "aside",
    ".copy-to-clipboard",
  ];
  $.each(objects_to_remove, function (i) {
    $(source).find(objects_to_remove[i]).remove();
  });

  // Replace special chars
  let map = { "’": "'" };
  $(source).html(
    $(source)
      .html()
      .replace(/’/g, function (m) {
        return map[m];
      })
  );
}

function replaceInputField(value, element) {
  element.replaceWith(
    "<table class='answer pdf'><tr><th>Answer:</th></tr><tr><td>" + value + "</td></tr></table>"
  );
}

function toDataURL(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onload = function () {
    var reader = new FileReader();
    reader.onloadend = function () {
      callback(reader.result);
    };
    reader.readAsDataURL(xhr.response);
  };
  xhr.open("GET", url);
  xhr.responseType = "blob";
  xhr.send();
}

function adjustImgSize(img) {
  let orignial_width = $(img).prop("naturalWidth");
  let orignial_height = $(img).prop("naturalHeight");
  let max_value = MARGINS.width;

  if (orignial_width > max_value) {
    $(img).width(max_value);
    if ($(img).height() > max_value) {
      $(img).width("");
      $(img).height(max_value);
    }
  } else if (orignial_height > max_value) {
    $(img).height(max_value);
  }
}
