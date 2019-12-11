var caseImportTemplate = $("#caseImportList").html();
var importCaseAjax;
var isImportCaseCanceled = false;

detectEndpoint1 = function () {
	$("#caseImportSection #importButton").show();
	$("#urlEndpointSuccess").hide();
	$("#urlEndpointError").hide();
	var url = $("#urlEndpoint").val();
	if (url.endsWith("/") == false)
		url += "/";
	$.ajax({
		url: url + "ims/case/v1p0/CFDocuments",
		method: "GET",
		headers: {
			Accept: "application/json"
		},
		success: getDocsSuccess,
		failure: getServerSide,
		error: getServerSide
	});
}

getDocsSuccess = function(result, b, c) {
	if (result.CFDocuments == null)
		detectEndpoint2();
	else {
		$("#urlEndpointSuccess").text(result.CFDocuments.length + " frameworks detected.").show();
		$("#caseImportList").html("");
		for (var i = 0; i < result.CFDocuments.length; i++) {
			var doc = result.CFDocuments[i];
			var t = $("#caseImportList").append(caseImportTemplate).children().last();
			t.attr("id", doc.uri);
			t.attr("identifier", doc.identifier);
			t.find(".caseImportTitle").text(doc.title);
		}
		isImportCaseCanceled = false;
		showPage("#caseImportSection");
	}
}

getServerSide = function() {
	var url = $("#urlEndpoint").val();
	if (url.endsWith("/") == false)
		url += "/";
	$.ajax({
		url: repo.selectedServer + "ims/case/getDocs?url=" + url,
		method: "GET",
		success: getDocsSuccess,
		failure: detectEndpoint2,
		error: detectEndpoint2
	});
}

detectEndpoint2 = function (error) {
	$("#urlEndpointError").text("No frameworks found. Please check the URL and try again.").show();
}

detectURLType = function() {
	if ($("#urlEndpoint").val().indexOf("graph") != -1 || $("#urlEndpoint").val().indexOf("ceasn") != -1) {
		importCTDLASNURL();
	} else {
		detectEndpoint1();
	}
}

$("#urlEndpointButton").click(detectURLType);

importCase = function () {
	$("#caseImportSection #importButton").hide();
	$("#caseImportSection input:not(:checked)").parent().remove();
	if (!isImportCaseCanceled) {
		let lis = $(".caseImportTemplate.unfinished");
		if (lis.length == 0) {
			if (framework != null) {
				showPage("framework");
				loading("Loading framework...");
	            populateFramework();
	            selectedCompetency = null;
	            refreshSidebar();
	        }
	        else {
	        	showPage("importSection");
	        }
		} else {
			lis.find("input").hide();
			var id = lis.first().attr("id");
			var uuid = lis.first().attr("identifier");

			$("#caseImportSection [id='" + id + "']").find(".loading").show();
            var identity = EcIdentityManager.ids[0];
            var formData = new FormData();
            if (identity != null)
                formData.append('owner',identity.ppk.toPk().toPem());
			importCaseAjax = $.ajax({
				url: repo.selectedServer + "ims/case/harvest?caseEndpoint=" + $("#urlEndpoint").val() + "&dId=" + uuid,
                method: "POST",
                data: formData,
                processData: false,
                contentType: false,
				success: function () {
					$("#caseImportSection [id='" + id + "']").removeClass("unfinished").addClass("finished").find(".loading").hide().parent().find(".success").show();
					EcFramework.get(id, function(f) {
						framework = f;
						spitEvent("importFinished", f.shortId());
						importCase();
					}, function(error) {
						importCase();
					});
				},
				failure: function (failure) {
					$("#caseImportSection [id='" + id + "']").removeClass("unfinished").addClass("finished").find(".loading").hide().parent().find(".error").show().attr("title", failure.statusText);
					importCase();
				},
				error: function (failure) {
					$("#caseImportSection [id='" + id + "']").removeClass("unfinished").addClass("finished").find(".loading").hide().parent().find(".error").show().attr("title", failure.statusText);
					importCase();
				}
			});
		}
	}// if not import canceled
}

importCaseCancel = function () {
	isImportCaseCanceled = true;
	if (importCaseAjax != null)
		importCaseAjax.abort();
}