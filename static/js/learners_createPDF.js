// var dataUrl = "";

$(function () {

    $(".gpdf").click(function () {
        generatePDF();
    });

    // dataUrl = getDataUrl($("#body-inner").find("img")[0]);
    // console.log(dataUrl);

});

function generatePDF() {
    var pdf = new jsPDF("p", "pt", "a4", true);
    let source = $("#body-inner").clone()[0];

    let html = '<div id="pdfcontainer" style="position: absolute; top: -9999px">';
    html += cleanHTML(source).innerHTML;
    html += "</div>";
    $("#body-inner").append(html);

    source = $("#pdfcontainer")[0];

    margins = {
        top: 80,
        bottom: 60,
        left: 80,
        width: 430,
    };

    pdf.fromHTML(
        source, // HTML string or DOM elem ref.
        margins.left, // x coord
        margins.top, // y coord
        {
            unit: 'pt',
            jsPDF: document,
            autoPaging: "text",
            width: margins.width, // max width of content on PDF
        },

        function (dispose) {

            pdf.setFontSize(7);
            pdf.setTextColor("#9a9a9a");
            pdf.setFont("helvetica")

            var pageTitle = $(source).find("h1:first").text().trim()

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

                // Header
                pdf.text(header, 80, 30, { baseline: "top" });

                // Footer
                pdf.text(
                    footer,
                    80,
                    pageHeight - 30,
                    { baseline: "bottom" }
                );
            };
            pdf.save("Report_" + pageTitle + ".pdf");
        },
        margins
    );

    $("#pdfcontainer").remove();
}

function getDataUrl(img) {
    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    // Set width and height
    canvas.width = img.width;
    canvas.height = img.height;
    // Draw the image
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg');
}

function cleanHTML(source) {
    $.each($(source).find("*"), function () {
        let element = $(this)[0];
        let tagName = $(element).prop("tagName");
        var k = parseInt($(tagName).css("font-size"));
        var redSize = (k * 80) / 100;
        $(element).css({ "font-size": redSize });
        $(element).css({ "padding": 0 });
    });

    // Replace hyperlinks
    $.each($(source).find("a"), function () {
        $(this).replaceWith("<b style='color: #d34a5d'>" + this.innerHTML + "</b>");
    });

    // Replace labels
    $.each($(source).find("label"), function () {
        $(this).replaceWith("<b>" + this.innerHTML + "</b>");
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
    let objects_to_remove = ["div.exercise-control", ".add-input-row", "button", "aside", ".copy-to-clipboard", "img"];
    $.each(objects_to_remove, function (i) {
        $(source).find(objects_to_remove[i]).remove();
    });

    // Replace special chars
    let map = { "’": "'" };
    $(source).html(
        // $(source).html().replace(/’;|&lt;|&gt;|&quot;|&#039;/g,
        $(source)
            .html()
            .replace(/’/g, function (m) {
                return map[m];
            })
    );

    return source;
}

function replaceInputField(value, element) {
    element.replaceWith(
        "<span style='padding-bottom: 10px; font-style: italic; color: #555555'>" +
        value +
        "</span>"
    );
}
