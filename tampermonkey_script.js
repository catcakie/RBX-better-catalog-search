// ==UserScript==
// @name         Remove Clothes Duplicates
// @version      0.1
// @description  Remove the duplicate shirts and pants in the roblox catalog
// @author       Danielle
// @match        https://api.roblox.com/*
// @match        https://www.roblox.com/home
// @require      https://code.jquery.com/jquery-3.5.1.js
// @require      https://bundle.run/pixelmatch
// ==/UserScript==

/* global pixelmatch */

const perfectThreshold = .5;

let nextPageCursor = "";
let category = "&Category=3&Subcategory=12"
let keywordSearch = "20015";
let clothes = [];
let uniqueClothes = [];

let baseApiUrl = "https://catalog.roblox.com/v1/search/items/details?Keyword=" + keywordSearch + category + "&cursor=";
let usedApiUrl = baseApiUrl + nextPageCursor;

function getLink(text) {
    let linkIDstartIndex = text.indexOf("tr.rbxcdn.com/") + 14;
    let linkIDendIndex = text.indexOf("/", linkIDstartIndex + 1);
    let linkID = text.slice(linkIDstartIndex, linkIDendIndex);
    let clothingType = "Shirt";
    let link = "https://tr.rbxcdn.com/" + linkID + "/420/420/" + clothingType + "/Png";
    return link;
}

function createImg(thumbnailLink, catalogLink) {
    let img = new Image();
    img.src = thumbnailLink;
    img.crossOrigin = "Anonymous";
    img.alt = catalogLink;
    return img;
}

function appendImg(img) {
    img.style.maxWidth = '150px';
    img.style.maxHeight = '150px';
    let place = document.getElementById("Assets");
    place.appendChild(img);
}

function getImgData(img) {
    let canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height
    let ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    return data;
}

function addToArrayAndDoc(thumbnailLink, catalogLink) {
    if (!thumbnailLink.includes("html")) {
        let img = createImg(thumbnailLink, catalogLink);
        img.onload = function() {
            let data = getImgData(img);

            let eachClothing = { // create object
                "catalogLink": catalogLink,
                "imageData": data
            }

            let duplicate = uniqueClothes.some((uniqueClothing) => bothEqual(eachClothing, uniqueClothing));
            if (duplicate == false) {
                uniqueClothes.push(eachClothing);
                appendImg(img);
            }
        }
    }
}

async function forEachClothing(catalogIDs) {
    let catalogIDlength = catalogIDs.length;
    for (let i = 0; i < catalogIDlength; ++i) {
        let catalogID = catalogIDs[i];

        let catalogLink = "https://www.roblox.com/catalog/" + catalogID;
        fetch(catalogLink)
            .then((response) => response.text())
            .then((text) => {
            let thumbnailLink = getLink(text);

            addToArrayAndDoc(thumbnailLink, catalogLink);
        });
    }
}

function bothEqual(a, b) {
  return (pixelmatch(a.imageData, b.imageData, null, 420, 420, {threshold: perfectThreshold}) == 0);
}

async function main() {
		fetch(usedApiUrl)
			.then((apiResponse) => apiResponse.json())
			.then((apiJSON) => {
                nextPageCursor = apiJSON.nextPageCursor;
				usedApiUrl = baseApiUrl + nextPageCursor;

                let catalogIDs = apiJSON.data.map(clothing => clothing.id);

				console.log("finished a page");

				if (nextPageCursor != null) {
					main();
				} else {
					console.log("unique clothes: ");
                    console.log(uniqueClothes);
				}

				forEachClothing(catalogIDs);
			});
}

main();

